from django.db import models
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
    running_balance = models.DecimalField(max_digits=12, decimal_places=2)  # Balance after this transaction
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='completed')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.wallet_type} - {self.amount}"