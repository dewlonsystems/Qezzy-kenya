# withdrawals/models.py
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
    mobile_phone = models.CharField(max_length=15, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    bank_branch = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    linked_transaction = models.OneToOneField(
        WalletTransaction,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='withdrawal_request'
    )
    originator_conversation_id = models.CharField(max_length=20, blank=True, null=True)
    daraja_conversation_id = models.CharField(max_length=50, blank=True, null=True)
    request_date = models.DateField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_status = self.status

    def clean(self):
        if self.method == 'mobile' and not self.mobile_phone:
            raise ValidationError('Mobile phone required for mobile withdrawal')
        if self.method == 'bank':
            if not all([self.bank_name, self.bank_branch, self.account_number]):
                raise ValidationError('Bank details incomplete')

    def save(self, *args, **kwargs):
        self.full_clean()

        status_changed = self.status != self._original_status
        is_new = self.pk is None

        if status_changed and self.status == 'completed':
            from django.utils import timezone
            self.processed_at = timezone.now()
        elif status_changed and self.status != 'completed':
            self.processed_at = None

        super().save(*args, **kwargs)
        self._original_status = self.status

        if not is_new and status_changed and self.linked_transaction_id:
            tx = WalletTransaction.objects.get(pk=self.linked_transaction_id)
            tx.status = self.status
            tx.save()

    def __str__(self):
        return f"{self.user.email} - {self.amount} ({self.status})"