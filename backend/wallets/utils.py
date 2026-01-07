from decimal import Decimal
from django.db import transaction
from .models import WalletTransaction

def create_transaction(user, wallet_type, transaction_type, amount, description='', source='system', status='completed'):
    """
    Creates a wallet transaction and computes running balance.
    Amount is positive for credits, negative for debits.
    """
    with transaction.atomic():
        # Get last balance for this wallet type
        last_tx = WalletTransaction.objects.filter(
            user=user,
            wallet_type=wallet_type
        ).order_by('-created_at').first()

        last_balance = last_tx.running_balance if last_tx else Decimal('0.00')
        new_balance = last_balance + Decimal(str(amount))

        tx = WalletTransaction.objects.create(
            user=user,
            wallet_type=wallet_type,
            transaction_type=transaction_type,
            source=source,
            amount=amount,
            running_balance=new_balance,
            status=status,
            description=description
        )
        return tx