# wallet/models.py
from django.db import models, transaction as db_transaction
from django.core.exceptions import ValidationError
from decimal import Decimal
from users.models import User

class WalletTransaction(models.Model):
    TRANSACTION_TYPES = [
        ('task_earning', 'Task Earning'),
        ('referral_bonus', 'Referral Bonus'),
        ('activation_payment', 'Activation Payment'),
        ('withdrawal', 'Withdrawal'),
        ('admin_adjustment', 'Admin Adjustment'),
    ]
    TRANSACTION_SOURCES = [
        ('system', 'System'),
        ('admin', 'Admin'),
        ('user', 'User'),
    ]
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('pending', 'Pending'),
        ('failed', 'Failed'),
    ]
    WALLET_TYPES = [
        ('main', 'Main Wallet'),
        ('referral', 'Referral Wallet'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wallet_transactions')
    wallet_type = models.CharField(max_length=10, choices=WALLET_TYPES)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    source = models.CharField(max_length=10, choices=TRANSACTION_SOURCES, default='system')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    running_balance = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    __original_status = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_status = self.status

    def _get_balance_impact(self):
        """Return the net effect this transaction has on the wallet (positive = increase)."""
        if self.transaction_type in ['withdrawal', 'activation_payment']:
            return -self.amount  # debit
        else:
            return self.amount   # credit

    def _get_current_balance(self):
        """Get the latest completed balance for this wallet."""
        last_tx = WalletTransaction.objects.filter(
            user=self.user,
            wallet_type=self.wallet_type,
            status='completed'
        ).order_by('-created_at').first()
        return last_tx.running_balance if last_tx else Decimal('0.00')

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        status_changed = self.status != self.__original_status
        was_completed = self.__original_status == 'completed'
        is_now_completed = self.status == 'completed'

        balance_updated = False

        with db_transaction.atomic():
            if is_new:
                if is_now_completed:
                    # Apply effect on creation if completed
                    impact = self._get_balance_impact()
                    current_balance = Decimal('0.00')
                    # But better to get real current balance
                    current_balance = self._get_current_balance()
                    new_balance = current_balance + impact
                    if new_balance < 0 and self.transaction_type != 'withdrawal':
                        raise ValidationError("Insufficient balance for this transaction.")
                    self.running_balance = new_balance
                    balance_updated = True
                else:
                    # New but not completed: running_balance = current balance (no change)
                    self.running_balance = self._get_current_balance()
            else:
                # Existing transaction
                if status_changed:
                    if was_completed and not is_now_completed:
                        # Reverting: UNDO the previous effect
                        impact = self._get_balance_impact()
                        current_balance = self._get_current_balance()
                        # Undo: subtract the original impact
                        new_balance = current_balance - impact
                        if new_balance < 0:
                            # Allow negative only if reversing a credit? Be cautious.
                            # For safety, we allow it only in admin context (handled by validation elsewhere)
                            pass
                        self.running_balance = new_balance
                        balance_updated = True

                    elif not was_completed and is_now_completed:
                        # Finalizing: APPLY the effect
                        impact = self._get_balance_impact()
                        current_balance = self._get_current_balance()
                        new_balance = current_balance + impact
                        if new_balance < 0 and self.transaction_type not in ['withdrawal']:
                            raise ValidationError("Insufficient balance to complete this transaction.")
                        self.running_balance = new_balance
                        balance_updated = True
                    # else: e.g., pending ↔ failed → no balance change

            # Save the model
            super().save(*args, **kwargs)
            self.__original_status = self.status

            # After saving a balance-affecting transaction, ensure consistency
            if balance_updated:
                # Optional: validate that running_balance matches actual ledger (for debugging)
                pass

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.wallet_type} - {self.amount}"