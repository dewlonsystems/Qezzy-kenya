# fix_wallet_balances.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'earn_backend.settings')  # ← CHANGE 'your_project' to your actual settings module name!
django.setup()

from decimal import Decimal
from wallets.models import WalletTransaction

def recalculate_running_balances():
    print("🔍 Finding transactions with negative running_balance...")
    bad_txs = WalletTransaction.objects.filter(running_balance__lt=0)
    print(f"Found {bad_txs.count()} problematic transactions.")

    if not bad_txs.exists():
        print("✅ No negative balances found.")
        return

    # Group by user + wallet_type to rebuild sequentially
    users_wallets = set(
        bad_txs.values_list('user_id', 'wallet_type')
    )

    fixed_count = 0
    for user_id, wallet_type in users_wallets:
        print(f"\n🔧 Recalculating balance for user={user_id}, wallet={wallet_type}")
        # Get ALL transactions for this wallet, ordered by time
        all_txs = WalletTransaction.objects.filter(
            user_id=user_id,
            wallet_type=wallet_type
        ).order_by('created_at', 'id')

        current_balance = Decimal('0.00')
        for tx in all_txs:
            if tx.status == 'completed':
                if tx.transaction_type in ['withdrawal', 'activation_payment']:
                    current_balance -= tx.amount
                else:
                    current_balance += tx.amount
            # Update running_balance to reflect state AFTER this transaction
            tx.running_balance = current_balance
            tx.save(update_fields=['running_balance'])
            fixed_count += 1

    print(f"\n✅ Fixed {fixed_count} transactions.")
    print("Now run: python manage.py migrate")

if __name__ == '__main__':
    recalculate_running_balances()