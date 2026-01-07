import logging
from datetime import date
from django.db import transaction
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import WithdrawalRequest
from .daraja_payout import send_b2c_payment
from wallets.utils import create_transaction
from decimal import Decimal, InvalidOperation

logger = logging.getLogger(__name__)

class WithdrawalRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not user.is_active:
            return Response({'error': 'Account not active'}, status=403)
        if user.is_closed:
            return Response({'error': 'Account closed'}, status=403)

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
                daraja_resp = send_b2c_payment(phone, float(amount))
                if daraja_resp and 'ConversationID' in daraja_resp:
                    # Success: mark both as completed
                    withdrawal.status = 'completed'
                    withdrawal.save(update_fields=['status'])

                    linked_tx.status = 'completed'
                    linked_tx.save(update_fields=['status'])  # Triggers balance debit
                else:
                    withdrawal.status = 'failed'
                    withdrawal.save(update_fields=['status'])

                    linked_tx.status = 'failed'
                    linked_tx.save(update_fields=['status'])  # No balance impact
            except Exception as e:
                logger.error(f"Daraja B2C error: {str(e)}")
                withdrawal.status = 'failed'
                withdrawal.save(update_fields=['status'])

                linked_tx.status = 'failed'
                linked_tx.save(update_fields=['status'])
                return Response({'error': 'Payout service error'}, status=500)

        # Bank withdrawals remain pending for admin approval

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