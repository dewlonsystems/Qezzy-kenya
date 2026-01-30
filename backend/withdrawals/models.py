# withdrawals/models.py
from django.db import models
from django.core.exceptions import ValidationError
from users.models import User
import uuid


class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.BooleanField(default=True)
    description = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "System Setting"
        verbose_name_plural = "System Settings"
        ordering = ['key']

    def __str__(self):
        return f"{self.key}: {'Enabled' if self.value else 'Disabled'}"

    @classmethod
    def withdrawals_enabled(cls):
        setting, created = cls.objects.get_or_create(
            key='withdrawals_enabled',
            defaults={
                'value': True,
                'description': 'Enable/disable withdrawal functionality globally'
            }
        )
        return setting.value


class WithdrawalRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('needs_review', 'Needs Review'),  # ← Added for timeout handling
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
    originator_conversation_id = models.CharField(max_length=20, blank=True, null=True)
    daraja_conversation_id = models.CharField(max_length=50, blank=True, null=True)
    reference_code = models.CharField(max_length=20, unique=True, blank=True)
    mpesa_receipt_number = models.CharField(max_length=50, blank=True)
    request_date = models.DateField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # 🔑 NEW: For idempotent callback processing
    processed_callbacks = models.JSONField(
        default=list,
        null=True,
        help_text="List of OriginatorConversationID or ConversationID already processed"
    )

    def clean(self):
        if self.method == 'mobile' and not self.mobile_phone:
            raise ValidationError('Mobile phone required for mobile withdrawal')
        if self.method == 'bank':
            if not all([self.bank_name, self.bank_branch, self.account_number]):
                raise ValidationError('Bank details incomplete')

    def save(self, *args, **kwargs):
        if not self.reference_code:
            self.reference_code = "WDR" + uuid.uuid4().hex[:6].upper()

        self.full_clean()

        # Only allow status change from 'pending' → final state (once)
        if self.pk:
            original = WithdrawalRequest.objects.get(pk=self.pk)
            if original.status not in ['pending', 'needs_review']:
                if self.status != original.status:
                    raise ValidationError("Status cannot be changed after completion or failure.")

        if self.status == 'completed' and self.processed_at is None:
            from django.utils import timezone
            self.processed_at = timezone.now()
        elif self.status != 'completed':
            self.processed_at = None

        super().save(*args, **kwargs)

    # 🔑 IDEMPOTENCY HELPER METHODS
    def has_processed_callback(self, callback_id):
        """Check if a callback ID has already been processed."""
        return bool(callback_id and callback_id in self.processed_callbacks)

    def mark_callback_processed(self, callback_id):
        """Safely add a callback ID to the processed list."""
        if callback_id and callback_id not in self.processed_callbacks:
            self.processed_callbacks.append(callback_id)
            self.save(update_fields=['processed_callbacks'])

    def __str__(self):
        return f"{self.user.email} - {self.amount} ({self.status})"