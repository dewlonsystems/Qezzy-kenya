import logging
from datetime import date
from decimal import Decimal, InvalidOperation
import json

from django.db import transaction
from django.http import HttpResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import WithdrawalRequest, SystemSetting
from .daraja_payout import send_b2c_payment
from .utils import require_safaricom_ip
from wallets.models import WalletTransaction
from users.utils import send_withdrawal_completed_email

logger = logging.getLogger(__name__)


# =========================================================
# Withdrawal Request (User Initiation)
# =========================================================

class WithdrawalRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not user.is_active:
            return Response({'error': 'Account not active'}, status=403)
        if user.is_closed:
            return Response({'error': 'Account closed'}, status=403)
        if not SystemSetting.withdrawals_enabled():
            return Response({'error': 'Withdrawals are temporarily disabled.'}, status=403)

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

        with transaction.atomic():
            last_tx = WalletTransaction.objects.select_for_update().filter(
                user=user, wallet_type=wallet_type
            ).order_by('-created_at', '-id').first()

            balance = last_tx.running_balance if last_tx else Decimal('0.00')
            if amount > balance:
                return Response({'error': 'Insufficient balance'}, status=400)

            today = date.today()
            if wallet_type == 'main':
                if today.day != 5:
                    return Response({'error': 'Main wallet withdrawals only allowed on the 5th'}, status=400)

                already_requested = WithdrawalRequest.objects.filter(
                    user=user,
                    wallet_type='main',
                    request_date__year=today.year,
                    request_date__month=today.month,
                    status__in=['pending', 'completed', 'needs_review']
                ).exists()

                if already_requested:
                    return Response({'error': 'Withdrawal already requested this month'}, status=400)

            if method == 'mobile':
                phone = user.payout_phone or user.phone_number
                if not phone:
                    return Response({'error': 'No mobile number available'}, status=400)
                bank_name = bank_branch = account_number = ''
            else:
                phone = ''
                bank_name = user.payout_bank_name
                bank_branch = user.payout_bank_branch
                account_number = user.payout_account_number
                if not all([bank_name, bank_branch, account_number]):
                    return Response({'error': 'Bank details not configured'}, status=400)

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

            WalletTransaction.objects.create(
                user=user,
                wallet_type=wallet_type,
                transaction_type='withdrawal_pending',
                amount=amount,
                linked_withdrawal=withdrawal,
                description=f"Withdrawal {withdrawal.reference_code} pending M-Pesa processing"
            )

        if method == 'mobile':
            try:
                originator_id = f"B2C_{withdrawal.id}"[:20]
                resp = send_b2c_payment(phone, float(amount), originator_id=originator_id)

                withdrawal.originator_conversation_id = originator_id
                withdrawal.daraja_conversation_id = (
                    resp.get('ConversationID')
                    or resp.get('Response', {}).get('ConversationID')
                )
                withdrawal.save(update_fields=[
                    'originator_conversation_id',
                    'daraja_conversation_id'
                ])

            except Exception as e:
                logger.error(f"Daraja send error for withdrawal {withdrawal.id}: {e}", exc_info=True)

            return Response({
                'message': 'Withdrawal accepted and sent to M-Pesa',
                'request_id': withdrawal.id,
                'status': 'pending'
            }, status=202)

        return Response({
            'message': 'Withdrawal request submitted',
            'request_id': withdrawal.id,
            'status': withdrawal.status
        })


# =========================================================
# Withdrawal History
# =========================================================

class WithdrawalHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        withdrawals = WithdrawalRequest.objects.filter(
            user=request.user
        ).order_by('-created_at')

        data = []
        for w in withdrawals:
            data.append({
                'id': w.id,
                'wallet_type': w.wallet_type,
                'amount': float(w.amount),
                'method': w.method,
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


# =========================================================
# Daraja B2C Result Callback (FINALIZATION)
# =========================================================

@csrf_exempt
@require_POST
@require_safaricom_ip
def daraja_b2c_result(request):
    try:
        payload = json.loads(request.body)
        result = payload.get('Result', {})
        result_code = result.get('ResultCode')
        originator_id = result.get('OriginatorConversationID')
        conversation_id = result.get('ConversationID')
        receipt = result.get('TransactionID', '')

        callback_id = originator_id or conversation_id
        if not callback_id:
            return HttpResponse("Missing ID", status=400)

        withdrawal = (
            WithdrawalRequest.objects.filter(originator_conversation_id=originator_id).first()
            or WithdrawalRequest.objects.filter(daraja_conversation_id=conversation_id).first()
        )

        if not withdrawal:
            return HttpResponse("OK", status=200)

        if withdrawal.has_processed_callback(callback_id):
            return HttpResponse("OK", status=200)

        with transaction.atomic():
            if result_code == 0:
                WalletTransaction.objects.create(
                    user=withdrawal.user,
                    wallet_type=withdrawal.wallet_type,
                    transaction_type='withdrawal',
                    amount=Decimal('0.00'),
                    linked_withdrawal=withdrawal,
                    description=f"M-Pesa withdrawal settled. Receipt {receipt}"
                )

                withdrawal.status = 'completed'
                withdrawal.processed_at = timezone.now()
                withdrawal.mpesa_receipt_number = receipt
                withdrawal.save(update_fields=[
                    'status', 'processed_at', 'mpesa_receipt_number'
                ])

                try:
                    send_withdrawal_completed_email(
                        user=withdrawal.user,
                        amount=withdrawal.amount,
                        method=withdrawal.method,
                        destination=withdrawal.mobile_phone,
                        processed_at=withdrawal.processed_at,
                        receipt_number=receipt,
                        reference_code=withdrawal.reference_code,
                        recipient_name = f"{withdrawal.user.first_name} {withdrawal.user.last_name}".strip() or withdrawal.user.email
                    )
                except Exception:
                    logger.warning(f"Email failed for withdrawal {withdrawal.id}")

            else:
                from wallets.services import reverse_pending_withdrawal
                reverse_pending_withdrawal(
                    withdrawal,
                    reason=f"Daraja failure code {result_code}"
                )

                withdrawal.status = 'failed'
                withdrawal.save(update_fields=['status'])

                from wallets.services import reverse_pending_withdrawal
                reverse_pending_withdrawal(
                    withdrawal,
                    reason=f"Daraja failure code {result_code}"
                )

            withdrawal.mark_callback_processed(callback_id)

        return HttpResponse("OK", status=200)

    except Exception as e:
        logger.error(f"B2C result callback error: {e}", exc_info=True)
        return HttpResponse("Error", status=500)


# =========================================================
# Daraja Timeout Callback
# =========================================================

@csrf_exempt
@require_POST
@require_safaricom_ip
def daraja_b2c_timeout(request):
    try:
        payload = json.loads(request.body)
        callback_id = payload.get('OriginatorConversationID') or payload.get('ConversationID')

        if not callback_id:
            return HttpResponse("Missing ID", status=400)

        withdrawal = (
            WithdrawalRequest.objects.filter(originator_conversation_id=callback_id).first()
            or WithdrawalRequest.objects.filter(daraja_conversation_id=callback_id).first()
        )

        if not withdrawal:
            return HttpResponse("OK", status=200)

        if withdrawal.has_processed_callback(callback_id):
            return HttpResponse("OK", status=200)

        withdrawal.status = 'needs_review'
        withdrawal.save(update_fields=['status'])
        withdrawal.mark_callback_processed(callback_id)

        return HttpResponse("OK", status=200)

    except Exception as e:
        logger.error(f"B2C timeout callback error: {e}", exc_info=True)
        return HttpResponse("Error", status=500)
