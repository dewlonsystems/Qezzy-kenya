# wallets/models.py
from django.db import models
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
        ('withdrawal_reversal', 'Withdrawal Reversal'),
        ('admin_adjustment', 'Admin Adjustment'),
    ]
    WALLET_TYPES = [
        ('main', 'Main Wallet'),
        ('referral', 'Referral Wallet'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wallet_transactions')
    wallet_type = models.CharField(max_length=10, choices=WALLET_TYPES)
    transaction_type = models.CharField(max_length=25, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    running_balance = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True)
    linked_withdrawal = models.ForeignKey(
        'withdraws.WithdrawalRequest',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text="Reference to withdrawal this transaction relates to"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            CheckConstraint(
                condition=Q(running_balance__gte=0),
                name='non_negative_running_balance'
            )
        ]

    def _get_balance_impact(self):
        """Return net effect on balance: positive = credit, negative = debit."""
        if self.transaction_type == 'withdrawal':
            return -self.amount
        else:
            # Includes: task_earning, referral_bonus, activation_payment,
            # admin_adjustment, withdrawal_reversal
            return self.amount

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValidationError("WalletTransaction is immutable after creation.")

        # Compute current balance from last completed transaction (all are completed by design)
        last_tx = WalletTransaction.objects.filter(
            user=self.user,
            wallet_type=self.wallet_type
        ).order_by('-created_at', '-id').first()

        current_balance = last_tx.running_balance if last_tx else Decimal('0.00')
        impact = self._get_balance_impact()
        new_balance = current_balance + impact

        if new_balance < 0:
            raise ValidationError("Insufficient balance for this transaction.")

        self.running_balance = new_balance
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.wallet_type} - {self.transaction_type} - {self.amount}"