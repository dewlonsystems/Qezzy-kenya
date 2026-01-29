# withdraws/views.py
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

        # 🔒 Critical: Check balance under lock to prevent race conditions
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
                    status__in=['pending', 'completed']
                ).exists()
                if existing:
                    return Response({'error': 'Withdrawal already requested this month'}, status=400)

            # ✅ REMOVED: 24-hour rule for referral wallet

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

            # ✅ Create PENDING withdrawal request — NO WALLET TRANSACTION YET
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

            # Handle mobile auto-send
            if method == 'mobile':
                try:
                    originator_id = f"B2C_{withdrawal.id}"[:20]
                    daraja_resp = send_b2c_payment(phone, float(amount), originator_id=originator_id)
                    logger.info(f"B2C API Response for withdrawal {withdrawal.id}: {daraja_resp}")

                    if daraja_resp and 'ConversationID' in daraja_resp:
                        # ✅ Success: M-Pesa accepted the request → mark as processing
                        withdrawal.daraja_conversation_id = daraja_resp['ConversationID']
                        withdrawal.originator_conversation_id = originator_id
                        withdrawal.status = 'processing'
                        withdrawal.save(update_fields=[
                            'daraja_conversation_id', 'originator_conversation_id', 'status'
                        ])
                        logger.info(f"Withdrawal {withdrawal.id} sent to M-Pesa")
                    else:
                        # ❌ Immediate failure (e.g., invalid credentials, blocked number)
                        error_msg = daraja_resp.get('error', 'Unknown error') if daraja_resp else 'No response'
                        logger.error(f"B2C immediate failure: {error_msg}")
                        withdrawal.status = 'failed'
                        withdrawal.save(update_fields=['status'])
                        return Response({'error': f'Payout rejected: {error_msg}'}, status=400)

                except Exception as e:
                    # ⚠️ CRITICAL FIX: Do NOT mark as failed here!
                    # M-Pesa may have received the request even if we got an exception.
                    logger.error(f"Daraja exception for withdrawal {withdrawal.id}: {str(e)}", exc_info=True)
                    
                    # Keep as 'processing' — final state will come from callback
                    withdrawal.status = 'processing'
                    withdrawal.save(update_fields=['status'])
                    
                    return Response({
                        'message': 'Withdrawal request accepted. Processing with M-Pesa...',
                        'request_id': withdrawal.id,
                        'status': 'processing'
                    }, status=202)  # Accepted

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
# Daraja B2C Callback Handlers
# ==============================

@csrf_exempt
@require_POST
def daraja_b2c_result(request):
    try:
        payload = json.loads(request.body)
        logger.info(f"Received B2C Result Callback: {payload}")

        result = payload.get('Result', {})
        result_code = result.get('ResultCode')
        conversation_id = result.get('ConversationID')
        originator_id = result.get('OriginatorConversationID')
        transaction_id = result.get('TransactionID', '')

        withdrawal = None
        if originator_id:
            withdrawal = WithdrawalRequest.objects.filter(originator_conversation_id=originator_id).first()
        if not withdrawal and conversation_id:
            withdrawal = WithdrawalRequest.objects.filter(daraja_conversation_id=conversation_id).first()

        if not withdrawal:
            logger.warning(f"No withdrawal found for callback. Originator: {originator_id}")
            return HttpResponse("OK", status=200)

        with transaction.atomic():
            if result_code == 0:
                # ✅ Success: create debit transaction
                withdrawal.status = 'completed'
                withdrawal.processed_at = timezone.now()
                withdrawal.mpesa_receipt_number = transaction_id
                withdrawal.save(update_fields=[
                    'status', 'processed_at', 'mpesa_receipt_number'
                ])

                WalletTransaction.objects.create(
                    user=withdrawal.user,
                    wallet_type=withdrawal.wallet_type,
                    transaction_type='withdrawal',
                    amount=withdrawal.amount,
                    description=f"M-Pesa withdrawal successful. Receipt: {transaction_id}",
                    linked_withdrawal=withdrawal
                )

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
                    logger.warning(f"Email send failed: {e}")

                logger.info(f"Withdrawal {withdrawal.id} completed. TXN: {transaction_id}")
            else:
                # ❌ Failure
                withdrawal.status = 'failed'
                withdrawal.save(update_fields=['status'])
                logger.error(f"Withdrawal {withdrawal.id} failed. Code: {result_code}")

        return HttpResponse("OK", status=200)

    except Exception as e:
        logger.error(f"Error in B2C result callback: {str(e)}", exc_info=True)
        return HttpResponse("Error", status=500)


@csrf_exempt
@require_POST
def daraja_b2c_timeout(request):
    try:
        payload = json.loads(request.body)
        originator_id = payload.get('OriginatorConversationID')
        conversation_id = payload.get('ConversationID')

        withdrawal = None
        if originator_id:
            withdrawal = WithdrawalRequest.objects.filter(originator_conversation_id=originator_id).first()
        if not withdrawal and conversation_id:
            withdrawal = WithdrawalRequest.objects.filter(daraja_conversation_id=conversation_id).first()

        if withdrawal:
            with transaction.atomic():
                # ⚠️ Do NOT mark as failed immediately — could still succeed!
                # For now, mark for manual review
                withdrawal.status = 'needs_review'
                withdrawal.save(update_fields=['status'])
                logger.info(f"Withdrawal {withdrawal.id} marked for review due to timeout")

        return HttpResponse("OK", status=200)

    except Exception as e:
        logger.error(f"Error in B2C timeout callback: {str(e)}", exc_info=True)
        return HttpResponse("Error", status=500)