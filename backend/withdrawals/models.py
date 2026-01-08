from django.db import models
from django.core.exceptions import ValidationError
from users.models import User
from wallets.models import WalletTransaction

class WithdrawalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    METHOD_CHOICES = [
        ('mobile', 'Mobile Transfer'),
        ('bank', 'Bank Transfer'),
    ]
    WALLET_CHOICES = [
        ('main', 'Main Wallet'),
        ('referral', 'Referral Wallet'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='withdrawal_requests')
    wallet_type = models.CharField(max_length=10, choices=WALLET_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    # Mobile payout
    mobile_phone = models.CharField(max_length=15, blank=True)
    # Bank payout
    bank_name = models.CharField(max_length=100, blank=True)
    bank_branch = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    # Link to wallet transaction
    linked_transaction = models.OneToOneField(
        WalletTransaction,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='withdrawal_request'
    )
    # Metadata
    request_date = models.DateField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        if self.method == 'mobile' and not self.mobile_phone:
            raise ValidationError('Mobile phone required for mobile withdrawal')
        if self.method == 'bank':
            if not self.bank_name or not self.bank_branch or not self.account_number:
                raise ValidationError('Bank details incomplete')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.email} - {self.amount} ({self.status})"