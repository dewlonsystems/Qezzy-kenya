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
from wallets.utils import create_transaction
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

        # ✅ Check if withdrawals are enabled globally
        if not SystemSetting.withdrawals_enabled():
            return Response({
                'error': 'Withdrawals are temporarily disabled. Please try again later.'
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

        # Get current wallet balance (only from completed transactions)
        from wallets.models import WalletTransaction
        last_tx = WalletTransaction.objects.filter(
            user=user, wallet_type=wallet_type, status='completed'
        ).order_by('-created_at').first()
        balance = last_tx.running_balance if last_tx else Decimal('0.00')

        if amount > balance:
            return Response({'error': 'Insufficient balance'}, status=400)

        # Enforce withdrawal rules
        today = date.today()
        now = timezone.now()

        if wallet_type == 'main':
            if today.day != 5:
                return Response({'error': 'Main wallet withdrawals only allowed on the 5th of the month'}, status=400)
            existing = WithdrawalRequest.objects.filter(
                user=user,
                wallet_type='main',
                request_date__year=today.year,
                request_date__month=today.month,
                status__in=['pending', 'processing', 'completed']
            ).exists()
            if existing:
                return Response({'error': 'Withdrawal already requested this month'}, status=400)

        elif wallet_type == 'referral':
            last_withdrawal = WithdrawalRequest.objects.filter(
                user=user,
                wallet_type='referral',
                status__in=['pending', 'processing', 'completed'],
                created_at__gte=now - timezone.timedelta(hours=24)
            ).first()
            if last_withdrawal:
                return Response({'error': 'Referral withdrawal allowed once every 24 hours'}, status=400)

        # Get payout details
        if method == 'mobile':
            phone = user.payout_phone or user.phone_number
            if not phone:
                return Response({'error': 'No mobile number available for withdrawal'}, status=400)
            bank_name = bank_branch = account_number = ''
        elif method == 'bank':
            phone = ''
            bank_name = user.payout_bank_name
            bank_branch = user.payout_bank_branch
            account_number = user.payout_account_number
            if not all([bank_name, bank_branch, account_number]):
                return Response({'error': 'Bank details not configured'}, status=400)

        # STEP 1: Create a PENDING wallet transaction (no balance impact yet)
        linked_tx = create_transaction(
            user=user,
            wallet_type=wallet_type,
            transaction_type='withdrawal',
            amount=amount,
            description=f"Withdrawal request ({method})",
            source='system',
            status='pending'
        )

        # STEP 2: Create withdrawal request
        withdrawal = WithdrawalRequest.objects.create(
            user=user,
            wallet_type=wallet_type,
            amount=amount,
            method=method,
            mobile_phone=phone,
            bank_name=bank_name,
            bank_branch=bank_branch,
            account_number=account_number,
            status='pending',
            linked_transaction=linked_tx
        )

        # STEP 3: Handle mobile auto-process
        if method == 'mobile':
            try:
                # Pass a unique ID so we can match it in the callback
                originator_id = f"B2C_{withdrawal.id}"[:20]
                daraja_resp = send_b2c_payment(phone, float(amount), originator_id=originator_id)
                
                logger.info(f"B2C API Response for withdrawal {withdrawal.id}: {daraja_resp}")
                
                if daraja_resp and 'ConversationID' in daraja_resp:
                    # Success - M-Pesa accepted the request
                    withdrawal.daraja_conversation_id = daraja_resp['ConversationID']
                    withdrawal.originator_conversation_id = originator_id
                    withdrawal.status = 'processing'
                    withdrawal.save(update_fields=['daraja_conversation_id', 'originator_conversation_id', 'status'])
                    
                    logger.info(f"Withdrawal {withdrawal.id} sent to M-Pesa successfully, status: processing")
                    
                else:
                    # Immediate failure (validation/auth error from M-Pesa)
                    error_msg = daraja_resp.get('error', 'Unknown error') if daraja_resp else 'No response from M-Pesa'
                    logger.error(f"B2C immediate failure for withdrawal {withdrawal.id}: {error_msg}")
                    if daraja_resp:
                        logger.error(f"B2C full response: {daraja_resp}")
                    
                    # Mark as failed
                    withdrawal.status = 'failed'
                    withdrawal.save(update_fields=['status'])
                    
                    linked_tx.status = 'failed'
                    linked_tx.save(update_fields=['status'])
                    
                    return Response({
                        'error': f'Payout failed: {error_msg}',
                        'request_id': withdrawal.id,
                        'status': 'failed'
                    }, status=400)
                    
            except Exception as e:
                logger.error(f"Daraja B2C exception for withdrawal {withdrawal.id}: {str(e)}", exc_info=True)
                withdrawal.status = 'failed'
                withdrawal.save(update_fields=['status'])
                
                linked_tx.status = 'failed'
                linked_tx.save(update_fields=['status'])
                
                return Response({
                    'error': 'Payout service error',
                    'request_id': withdrawal.id,
                    'status': 'failed'
                }, status=500)

        # Bank withdrawals remain pending for admin approval
        # Mobile withdrawals that succeeded reach here

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
                'created_at': w.created_at.isoformat(),
                'processed_at': w.processed_at.isoformat() if w.processed_at else None
            })
        return Response(data)


# ==============================
# Daraja B2C Callback Handlers
# ==============================

@csrf_exempt
@require_POST
def daraja_b2c_result(request):
    """
    Handle M-Pesa B2C result callback from Safaricom.
    Must respond with HTTP 200 within 1 second.
    """
    try:
        payload = json.loads(request.body)
        logger.info(f"Received B2C Result Callback: {payload}")

        result = payload.get('Result', {})
        result_code = result.get('ResultCode')
        result_desc = result.get('ResultDesc', 'No description')
        conversation_id = result.get('ConversationID')
        originator_id = result.get('OriginatorConversationID')
        transaction_id = result.get('TransactionID', '')  # ← M-Pesa receipt number

        # Find the withdrawal using either ID
        withdrawal = None
        if originator_id:
            withdrawal = WithdrawalRequest.objects.filter(originator_conversation_id=originator_id).first()
        if not withdrawal and conversation_id:
            withdrawal = WithdrawalRequest.objects.filter(daraja_conversation_id=conversation_id).first()

        if not withdrawal:
            logger.warning(f"No withdrawal found for B2C callback. Originator: {originator_id}, ConvID: {conversation_id}")
            return HttpResponse("OK", status=200)

        # Update status based on ResultCode
        if result_code == 0:
            # Success
            withdrawal.status = 'completed'
            withdrawal.processed_at = timezone.now()
            withdrawal.mpesa_receipt_number = transaction_id  # ← SAVE RECEIPT
            withdrawal.save(update_fields=[
                'status', 'processed_at', 'mpesa_receipt_number'
            ])

            # Now mark the linked transaction as completed → triggers balance deduction
            if withdrawal.linked_transaction:
                withdrawal.linked_transaction.status = 'completed'
                withdrawal.linked_transaction.save(update_fields=['status'])

            try:
                destination = withdrawal.mobile_phone if withdrawal.method == 'mobile' else f"{withdrawal.bank_name} ({withdrawal.account_number})"
                user = withdrawal.user
                recipient_name = (
                    f"{user.first_name} {user.last_name}".strip()
                    or user.email
                )
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
                logger.warning(f"Failed to send withdrawal email to {withdrawal.user.email}: {e}")
            
            logger.info(f"B2C withdrawal {withdrawal.id} completed successfully. Transaction ID: {transaction_id}")
        else:
            # Failure
            withdrawal.status = 'failed'
            withdrawal.save(update_fields=['status'])

            if withdrawal.linked_transaction:
                withdrawal.linked_transaction.status = 'failed'
                withdrawal.linked_transaction.save(update_fields=['status'])
            
            logger.error(f"B2C withdrawal {withdrawal.id} failed. Code: {result_code}, Desc: {result_desc}")

        logger.info(f"B2C withdrawal {withdrawal.id} updated to status: {withdrawal.status} (Code: {result_code})")
        return HttpResponse("OK", status=200)

    except Exception as e:
        logger.error(f"Error processing B2C result callback: {str(e)}", exc_info=True)
        return HttpResponse("Error", status=500)


@csrf_exempt
@require_POST
def daraja_b2c_timeout(request):
    """
    Handle M-Pesa B2C timeout callback.
    Safaricom sends this if the result isn't delivered in time.
    """
    try:
        payload = json.loads(request.body)
        logger.info(f"Received B2C Timeout Callback: {payload}")

        # Extract identifiers
        conversation_id = payload.get('ConversationID')
        originator_id = payload.get('OriginatorConversationID')

        withdrawal = None
        if originator_id:
            withdrawal = WithdrawalRequest.objects.filter(originator_conversation_id=originator_id).first()
        if not withdrawal and conversation_id:
            withdrawal = WithdrawalRequest.objects.filter(daraja_conversation_id=conversation_id).first()

        if withdrawal:
            withdrawal.status = 'failed'
            withdrawal.save(update_fields=['status'])
            if withdrawal.linked_transaction:
                withdrawal.linked_transaction.status = 'failed'
                withdrawal.linked_transaction.save(update_fields=['status'])
            logger.info(f"Marked withdrawal {withdrawal.id} as failed due to timeout")
        else:
            logger.warning(f"No withdrawal found for timeout callback. Originator: {originator_id}, ConvID: {conversation_id}")

        return HttpResponse("OK", status=200)

    except Exception as e:
        logger.error(f"Error processing B2C timeout callback: {str(e)}", exc_info=True)
        return HttpResponse("Error", status=500)