# wallets/models.py
from django.db import models, transaction as db_transaction
from django.core.exceptions import ValidationError
from django.db.models import CheckConstraint, Q
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
    running_balance = models.DecimalField(max_digits=12, decimal_places=2, blank=True)
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
        """Get the latest completed balance for this wallet, with deterministic ordering."""
        last_tx = WalletTransaction.objects.filter(
            user=self.user,
            wallet_type=self.wallet_type,
            status='completed'
        ).order_by('-created_at', '-id').first()  # ← added -id for tie-breaking
        return last_tx.running_balance if last_tx else Decimal('0.00')

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        status_changed = self.status != self.__original_status
        was_completed = self.__original_status == 'completed'
        is_now_completed = self.status == 'completed'

        with db_transaction.atomic():
            if is_new:
                if is_now_completed:
                    # Apply effect immediately on creation if completed
                    impact = self._get_balance_impact()
                    current_balance = self._get_current_balance()
                    new_balance = current_balance + impact
                    if new_balance < 0:
                        raise ValidationError("Insufficient balance to complete this transaction.")
                    self.running_balance = new_balance
                else:
                    # Pending/failed: running_balance = current balance (no change)
                    self.running_balance = self._get_current_balance()
            else:
                # Existing transaction: only act on status change
                if status_changed:
                    if was_completed and not is_now_completed:
                        # Reverting a completed transaction: UNDO its impact
                        impact = self._get_balance_impact()
                        current_balance = self._get_current_balance()
                        new_balance = current_balance - impact
                        if new_balance < 0:
                            raise ValidationError("Reverting this transaction would cause negative balance.")
                        self.running_balance = new_balance

                    elif not was_completed and is_now_completed:
                        # Finalizing a pending transaction: APPLY its impact
                        impact = self._get_balance_impact()
                        current_balance = self._get_current_balance()
                        new_balance = current_balance + impact
                        if new_balance < 0:
                            raise ValidationError("Insufficient balance to complete this transaction.")
                        self.running_balance = new_balance
                    # Note: pending ↔ failed → no balance change

            # Save the model
            super().save(*args, **kwargs)
            self.__original_status = self.status

    class Meta:
        ordering = ['-created_at']
        constraints = [
            CheckConstraint(
                condition=Q(running_balance__gte=0),
                name='non_negative_running_balance'
            )
        ]

    def __str__(self):
        return f"{self.user.email} - {self.wallet_type} - {self.amount}"