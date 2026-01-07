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

    # For tracking original state to detect changes
    __original_status = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_status = self.status

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        status_changed = self.status != self.__original_status
        is_now_completed = self.status == 'completed'
        was_completed = self.__original_status == 'completed'

        # Only apply financial impact if transitioning INTO 'completed'
        should_update_balance = False
        if is_new and is_now_completed:
            should_update_balance = True
        elif status_changed and is_now_completed and not was_completed:
            should_update_balance = True

        if should_update_balance:
            if self.amount <= 0:
                raise ValidationError("Transaction amount must be positive.")

            with db_transaction.atomic():
                # Get the latest COMPLETED transaction for this wallet
                last_completed = WalletTransaction.objects.filter(
                    user=self.user,
                    wallet_type=self.wallet_type,
                    status='completed'
                ).order_by('-created_at').first()

                current_balance = last_completed.running_balance if last_completed else Decimal('0.00')

                # Determine balance impact based on transaction type
                if self.transaction_type in ['withdrawal', 'activation_payment']:
                    new_balance = current_balance - self.amount
                else:
                    new_balance = current_balance + self.amount

                if new_balance < 0:
                    raise ValidationError(f"Insufficient balance. Current: {current_balance}, Attempted: {self.amount}")

                self.running_balance = new_balance
                super().save(*args, **kwargs)
                self.__original_status = self.status

        else:
            # Save without balance update (e.g., status = pending/failed, or no change)
            super().save(*args, **kwargs)
            self.__original_status = self.status

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.wallet_type} - {self.amount}"