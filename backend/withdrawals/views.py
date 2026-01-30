# withdrawals/views.py
import logging
from datetime import date
from django.db import transaction
from django.utils import timezone
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WithdrawalRequest, SystemSetting
from .daraja_payout import send_b2c_payment
from wallets.models import WalletTransaction
from decimal import Decimal, InvalidOperation
import json
from users.utils import send_withdrawal_completed_email
from .utils import require_safaricom_ip  # ← ADDED

logger = logging.getLogger(__name__)


class WithdrawalRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not user.is_active:
            return Response({'error': 'Account not active'}, status=403)
        if user.is_closed:
            return Response({'error': 'Account closed'}, status=403)

        if not SystemSetting.withdrawals_enabled():
            return Response({
                'error': 'Withdrawals are temporarily disabled.'
            }, status=403)

        data = request.data
        wallet_type = data.get('wallet_type')
        amount = data.get('amount')
        method = data.get('method')

        if wallet_type not in ['main', 'referral']:
            return Response({'error': 'Invalid wallet type'}, status=400)
        if method not in ['mobile', 'bank']:
            return Response({'error': 'Invalid withdrawal method'}, status=400)

        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response({'error': 'Amount must be positive'}, status=400)
        except (ValueError, InvalidOperation):
            return Response({'error': 'Invalid amount'}, status=400)

        # STEP 1: Atomic balance check + create PENDING withdrawal + reserve funds
        withdrawal = None
        with transaction.atomic():
            last_tx = WalletTransaction.objects.select_for_update().filter(
                user=user, wallet_type=wallet_type
            ).order_by('-created_at').first()
            balance = last_tx.running_balance if last_tx else Decimal('0.00')

            if amount > balance:
                return Response({'error': 'Insufficient balance'}, status=400)

            # Enforce business rules
            today = date.today()

            if wallet_type == 'main':
                if today.day != 5:
                    return Response({'error': 'Main wallet withdrawals only allowed on the 5th'}, status=400)
                existing = WithdrawalRequest.objects.filter(
                    user=user,
                    wallet_type='main',
                    request_date__year=today.year,
                    request_date__month=today.month,
                    status__in=['pending', 'completed', 'needs_review']
                ).exists()
                if existing:
                    return Response({'error': 'Withdrawal already requested this month'}, status=400)

            # Get payout details
            if method == 'mobile':
                phone = user.payout_phone or user.phone_number
                if not phone:
                    return Response({'error': 'No mobile number available'}, status=400)
                bank_name = bank_branch = account_number = ''
            else:  # bank
                phone = ''
                bank_name = user.payout_bank_name
                bank_branch = user.payout_bank_branch
                account_number = user.payout_account_number
                if not all([bank_name, bank_branch, account_number]):
                    return Response({'error': 'Bank details not configured'}, status=400)

            # CREATE WITHDRAWAL RECORD
            withdrawal = WithdrawalRequest.objects.create(
                user=user,
                wallet_type=wallet_type,
                amount=amount,
                method=method,
                mobile_phone=phone,
                bank_name=bank_name,
                bank_branch=bank_branch,
                account_number=account_number,
                status='pending'
            )

            # 🔑 RESERVE FUNDS IMMEDIATELY via 'withdrawal_pending' transaction
            pending_tx = WalletTransaction.objects.create(
                user=user,
                wallet_type=wallet_type,
                transaction_type='withdrawal_pending',
                amount=amount,
                description=f"Withdrawal request {withdrawal.reference_code} pending M-Pesa processing",
                linked_withdrawal=withdrawal
            )  

        # STEP 2: Handle M-Pesa OUTSIDE atomic block
        if method == 'mobile':
            try:
                originator_id = f"B2C_{withdrawal.id}"[:20]
                daraja_resp = send_b2c_payment(phone, float(amount), originator_id=originator_id)
                logger.info(f"B2C API Response for withdrawal {withdrawal.id}: {daraja_resp}")

                # ONLY fail for DEFINITIVE errors (auth/invalid requests)
                is_definitive_failure = (
                    daraja_resp is None or
                    daraja_resp.get('errorCode') in ['400', '401', '403', '404'] or
                    'Invalid' in str(daraja_resp.get('errorMessage', '')) or
                    'not allowed' in str(daraja_resp.get('errorMessage', ''))
                )

                if is_definitive_failure:
                    error_msg = daraja_resp.get('errorMessage', 'Unknown error') if daraja_resp else 'No response'
                    logger.error(f"B2C definitive failure: {error_msg}")
                    # Mark as failed — reversal will happen in callback OR manually
                    withdrawal.status = 'failed'
                    withdrawal.save(update_fields=['status'])
                    return Response({'error': f'Payout rejected: {error_msg}'}, status=400)
                else:
                    # Success or ambiguous → update IDs and keep as pending
                    conv_id = (
                        daraja_resp.get('ConversationID') or
                        daraja_resp.get('Response', {}).get('ConversationID') or
                        daraja_resp.get('result', {}).get('ConversationID')
                    )
                    withdrawal.daraja_conversation_id = conv_id
                    withdrawal.originator_conversation_id = originator_id
                    withdrawal.save(update_fields=[
                        'daraja_conversation_id', 'originator_conversation_id'
                    ])
                    logger.info(f"Withdrawal {withdrawal.id} sent to M-Pesa")

            except Exception as e:
                logger.error(f"Daraja exception for withdrawal {withdrawal.id}: {str(e)}", exc_info=True)
                # Assume M-Pesa received it → keep as pending (balance already reserved)
                pass

            return Response({
                'message': 'Withdrawal request accepted. Pending with M-Pesa...',
                'request_id': withdrawal.id,
                'status': 'pending'
            }, status=202)

        # Bank withdrawals (unchanged — no async risk)
        return Response({
            'message': 'Withdrawal request submitted',
            'request_id': withdrawal.id,
            'status': withdrawal.status
        })


class WithdrawalHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        withdrawals = WithdrawalRequest.objects.filter(user=request.user).order_by('-created_at')
        data = []
        for w in withdrawals:
            data.append({
                'id': w.id,
                'wallet_type': w.wallet_type,
                'amount': float(w.amount),
                'method': w.method,
                'mobile_phone': w.mobile_phone,
                'bank_name': w.bank_name,
                'status': w.status,
                'reference_code': w.reference_code,
                'created_at': w.created_at.isoformat(),
                'processed_at': w.processed_at.isoformat() if w.processed_at else None,
                'is_reversed': WalletTransaction.objects.filter(
                    linked_withdrawal=w,
                    transaction_type='withdrawal_reversal'
                ).exists()
            })
        return Response(data)


# ==============================
# Daraja B2C Callback Handlers (IDEMPOTENT + IP WHITELISTED)
# ==============================

@csrf_exempt
@require_POST
@require_safaricom_ip  # ← ENFORCED
def daraja_b2c_result(request):
    try:
        payload = json.loads(request.body)
        logger.info(f"Received B2C Result Callback: {payload}")

        result = payload.get('Result', {})
        result_code = result.get('ResultCode')
        conversation_id = result.get('ConversationID')
        originator_id = result.get('OriginatorConversationID')
        transaction_id = result.get('TransactionID', '')

        callback_id = originator_id or conversation_id
        if not callback_id:
            logger.error("Callback missing both Originator and Conversation ID")
            return HttpResponse("Missing ID", status=400)

        withdrawal = None
        if originator_id:
            withdrawal = WithdrawalRequest.objects.filter(originator_conversation_id=originator_id).first()
        if not withdrawal and conversation_id:
            withdrawal = WithdrawalRequest.objects.filter(daraja_conversation_id=conversation_id).first()

        if not withdrawal:
            logger.warning(f"No withdrawal found for callback ID: {callback_id}")
            return HttpResponse("OK", status=200)

        # 🔑 IDEMPOTENCY CHECK
        if withdrawal.has_processed_callback(callback_id):
            logger.info(f"Duplicate callback ignored: {callback_id} for withdrawal {withdrawal.id}")
            return HttpResponse("OK", status=200)

        if result_code == 0:
            # SUCCESS: Finalize withdrawal
            withdrawal.status = 'completed'
            withdrawal.processed_at = timezone.now()
            withdrawal.mpesa_receipt_number = transaction_id
            withdrawal.save(update_fields=[
                'status', 'processed_at', 'mpesa_receipt_number'
            ])

            # Optional: upgrade pending tx to 'withdrawal' for clarity
            try:
                pending_tx = WalletTransaction.objects.get(
                    linked_withdrawal=withdrawal,
                    transaction_type='withdrawal_pending'
                )
                pending_tx.transaction_type = 'withdrawal'
                pending_tx.description = f"M-Pesa withdrawal successful. Receipt: {transaction_id}"
                pending_tx.save(update_fields=['transaction_type', 'description'])
            except WalletTransaction.DoesNotExist:
                # Fallback: still safe (balance was already reserved)
                pass

            # Send completion email
            try:
                destination = withdrawal.mobile_phone
                user = withdrawal.user
                recipient_name = f"{user.first_name} {user.last_name}".strip() or user.email
                send_withdrawal_completed_email(
                    user=user,
                    amount=withdrawal.amount,
                    method=withdrawal.method,
                    destination=destination,
                    processed_at=withdrawal.processed_at,
                    receipt_number=transaction_id,
                    reference_code=withdrawal.reference_code,
                    recipient_name=recipient_name
                )
            except Exception as e:
                logger.warning(f"Email send failed for withdrawal {withdrawal.id}: {e}")

        else:
            # FAILURE: Reverse the reserved balance
            withdrawal.status = 'failed'
            withdrawal.save(update_fields=['status'])

            try:
                from wallets.services import reverse_pending_withdrawal
                reverse_pending_withdrawal(withdrawal, reason=f"Daraja error {result_code}")
            except Exception as e:
                logger.critical(f"Failed to reverse pending withdrawal {withdrawal.id}: {e}")

        # 🔑 MARK CALLBACK AS PROCESSED
        withdrawal.mark_callback_processed(callback_id)

        return HttpResponse("OK", status=200)

    except Exception as e:
        logger.error(f"Error in B2C result callback: {str(e)}", exc_info=True)
        return HttpResponse("Error", status=500)


@csrf_exempt
@require_POST
@require_safaricom_ip  # ← ENFORCED
def daraja_b2c_timeout(request):
    try:
        payload = json.loads(request.body)
        originator_id = payload.get('OriginatorConversationID')
        conversation_id = payload.get('ConversationID')
        callback_id = originator_id or conversation_id

        if not callback_id:
            return HttpResponse("Missing ID", status=400)

        withdrawal = None
        if originator_id:
            withdrawal = WithdrawalRequest.objects.filter(originator_conversation_id=originator_id).first()
        if not withdrawal and conversation_id:
            withdrawal = WithdrawalRequest.objects.filter(daraja_conversation_id=conversation_id).first()

        if not withdrawal:
            logger.warning(f"No withdrawal for timeout callback: {callback_id}")
            return HttpResponse("OK", status=200)

        # 🔑 IDEMPOTENCY CHECK
        if withdrawal.has_processed_callback(callback_id):
            logger.info(f"Duplicate timeout callback ignored: {callback_id}")
            return HttpResponse("OK", status=200)

        # Mark for manual review (do NOT auto-reverse — balance remains reserved)
        withdrawal.status = 'needs_review'
        withdrawal.save(update_fields=['status'])

        # 🔑 MARK AS PROCESSED
        withdrawal.mark_callback_processed(callback_id)

        logger.info(f"Withdrawal {withdrawal.id} marked for review due to timeout")
        return HttpResponse("OK", status=200)

    except Exception as e:
        logger.error(f"Error in B2C timeout callback: {str(e)}", exc_info=True)
        return HttpResponse("Error", status=500)