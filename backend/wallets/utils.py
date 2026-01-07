from decimal import Decimal
from .models import WalletTransaction

def create_transaction(user, wallet_type, transaction_type, amount, description='', source='system', status='pending'):
    """
    Creates a wallet transaction.
    
    IMPORTANT:
    - `amount` must be a POSITIVE number (e.g., 100.00, not -100.00).
    - The direction (debit/credit) is determined by `transaction_type`:
        • Credit (adds to balance): 'task_earning', 'referral_bonus', 'admin_adjustment'
        • Debit (subtracts from balance): 'withdrawal', 'activation_payment'
    - Balance is NOT computed here — it is auto-calculated in WalletTransaction.save().
    - Use status='pending' for transactions that require approval (e.g., withdrawals).
      Use status='completed' only for immediate, irreversible actions.
    """
    amount = Decimal(str(amount))
    if amount <= 0:
        raise ValueError("Amount must be a positive number.")

    return WalletTransaction.objects.create(
        user=user,
        wallet_type=wallet_type,
        transaction_type=transaction_type,
        source=source,
        amount=amount,                 # Always positive
        running_balance=Decimal('0.00'),  # Placeholder — updated in save()
        status=status,
        description=description
    )