# wallets/utils.py
from decimal import Decimal
from django.db import transaction as db_transaction
from .models import WalletTransaction

def create_transaction(user, wallet_type, transaction_type, amount, description='', source='system', status='pending'):
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError("Amount must be a positive number.")

    with db_transaction.atomic():
        # Lock the latest completed transaction to prevent concurrent balance reads
        last_tx = WalletTransaction.objects.filter(
            user=user,
            wallet_type=wallet_type,
            status='completed'
        ).select_for_update().order_by('-created_at', '-id').first()

        current_balance = last_tx.running_balance if last_tx else Decimal('0.00')

        # Enforce balance check for debits
        if transaction_type in ['withdrawal', 'activation_payment']:
            if amount > current_balance:
                raise ValueError("Insufficient balance.")

        # For pending transactions, running_balance = current balance (no change yet)
        running_balance = current_balance

        return WalletTransaction.objects.create(
            user=user,
            wallet_type=wallet_type,
            transaction_type=transaction_type,
            source=source,
            amount=amount,
            running_balance=running_balance,
            status=status,
            description=description
        )