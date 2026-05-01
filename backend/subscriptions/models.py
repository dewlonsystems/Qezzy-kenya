from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils import timezone
from decimal import Decimal
import secrets
import string


class SubscriptionPlan(models.Model):
    """
    Defines the 5-tier subscription hierarchy: Free, Basic, Standard, Premium, Elite.
    Tier level determines access: higher tiers unlock lower-tier content.
    """
    TIER_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),
        ('standard', 'Standard'),
        ('premium', 'Premium'),
        ('elite', 'Elite'),
    ]

    name = models.CharField(max_length=20, choices=TIER_CHOICES, unique=True)
    price_kes = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    duration_days = models.PositiveIntegerField(default=30)
    # trial_days is kept for DB compatibility but is no longer used in business logic.
    # All paid plans use duration_days. Free tier serves as the trial alternative.
    trial_days = models.PositiveIntegerField(default=0)
    tier_level = models.PositiveSmallIntegerField(unique=True)  # 0=Free, 1=Basic, ..., 4=Elite
    description = models.TextField(blank=True)
    features = models.JSONField(default=list, blank=True, help_text="List of feature descriptions")
    is_active = models.BooleanField(default=True, help_text="Hide plan from selection if False")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['tier_level']
        verbose_name = "Subscription Plan"
        verbose_name_plural = "Subscription Plans"

    def __str__(self):
        return f"{self.get_name_display()} (Ksh {self.price_kes})"

    @classmethod
    def get_plan_by_tier(cls, tier_name: str):
        """Safely retrieve a plan by its tier name (case-insensitive)."""
        try:
            return cls.objects.get(name=tier_name.lower())
        except cls.DoesNotExist:
            return None

    @classmethod
    def get_free_plan(cls):
        return cls.objects.filter(name='free', is_active=True).first()

    @classmethod
    def get_paid_plans(cls):
        return cls.objects.exclude(name='free').filter(is_active=True)


class UserSubscription(models.Model):
    """
    Tracks a user's active subscription instance.
    One user can have many historical subscriptions, but only ONE active at a time.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('pending', 'Pending'),
        ('cancelled', 'Cancelled'),
        ('suspended', 'Suspended'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscriptions'
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name='user_subscriptions'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    grace_end_date = models.DateTimeField(null=True, blank=True)  # end_date + 2 days
    is_trial = models.BooleanField(default=False)
    auto_renew = models.BooleanField(default=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    upgraded_from = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='upgraded_to',
        help_text="Previous subscription if this is an upgrade"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['end_date', 'status']),
            models.Index(fields=['grace_end_date']),
        ]
        constraints = [
            # Ensure only one active subscription per user at a time
            models.UniqueConstraint(
                fields=['user'],
                condition=models.Q(status='active'),
                name='one_active_subscription_per_user'
            )
        ]
        ordering = ['-start_date']
        verbose_name = "User Subscription"
        verbose_name_plural = "User Subscriptions"

    def __str__(self):
        return f"{self.user.email} - {self.plan.get_name_display()} ({self.status})"

    def save(self, *args, **kwargs):
        """Auto-set grace_end_date when end_date is set or updated."""
        if self.end_date and not self.grace_end_date:
            from datetime import timedelta
            self.grace_end_date = self.end_date + timedelta(days=2)
        super().save(*args, **kwargs)

    def is_active_with_grace(self):
        """
        Check if subscription is active OR within 2-day grace period.
        Used for access control decisions.
        """
        now = timezone.now()
        if self.status == 'active' and self.end_date >= now:
            return True
        if self.status == 'active' and self.grace_end_date and self.grace_end_date >= now:
            return True
        return False

    def can_access_tier(self, target_tier_level: int) -> bool:
        """
        Check if this subscription grants access to a given tier level.
        Higher tier_level = more access (Elite=4 can access all below).
        """
        if not self.is_active_with_grace():
            return False
        return self.plan.tier_level >= target_tier_level

    def cancel(self, immediate: bool = False):
        """
        Cancel subscription.
        If immediate=False (default), access continues until end_date.
        If immediate=True, access is revoked now.
        """
        from django.db import transaction
        with transaction.atomic():
            self.status = 'cancelled'
            self.cancelled_at = timezone.now()
            self.auto_renew = False
            if immediate:
                self.end_date = timezone.now()
                self.grace_end_date = None
            self.save()

    def extend(self, days: int):
        """Extend subscription end_date by given days (admin action)."""
        from datetime import timedelta
        from django.db import transaction
        with transaction.atomic():
            self.end_date = self.end_date + timedelta(days=days)
            if self.grace_end_date:
                self.grace_end_date = self.end_date + timedelta(days=2)
            self.save()


class SubscriptionTransaction(models.Model):
    """
    Records every M-Pesa transaction for subscription payments.
    Idempotent design: checkout_request_id is unique to prevent duplicates.
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='subscription_transactions'
    )
    subscription = models.ForeignKey(
        UserSubscription,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    currency = models.CharField(max_length=3, default='KES')
    mpesa_receipt_number = models.CharField(max_length=50, blank=True)
    checkout_request_id = models.CharField(max_length=100, unique=True)
    merchant_request_id = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15)  # Normalized 254... format
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_date = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True, help_text="Daraja error description if failed")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['checkout_request_id']),
            models.Index(fields=['user', 'status']),
            models.Index(fields=['transaction_date']),
        ]
        verbose_name = "Subscription Transaction"
        verbose_name_plural = "Subscription Transactions"

    def __str__(self):
        return f"{self.user.email} - {self.amount} {self.currency} ({self.status})"

    def is_duplicate(self, checkout_request_id: str) -> bool:
        """Check if a transaction with this checkout_request_id already exists."""
        return SubscriptionTransaction.objects.filter(
            checkout_request_id=checkout_request_id
        ).exclude(id=self.id).exists()


class SubscriptionReceipt(models.Model):
    """
    Auto-generated receipt for completed subscription transactions.
    PDF is stored securely; download count is tracked.
    """
    transaction = models.OneToOneField(
        SubscriptionTransaction,
        on_delete=models.CASCADE,
        related_name='receipt'
    )
    receipt_number = models.CharField(max_length=50, unique=True, editable=False)
    pdf_file = models.FileField(
        upload_to='receipts/subscriptions/%Y/%m/',
        help_text="Password-protected PDF receipt"
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    downloaded_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Subscription Receipt"
        verbose_name_plural = "Subscription Receipts"

    def __str__(self):
        return f"Receipt {self.receipt_number} for {self.transaction.user.email}"

    def save(self, *args, **kwargs):
        """Auto-generate receipt number if not set."""
        if not self.receipt_number:
            prefix = 'RCP'
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            random_suffix = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            self.receipt_number = f"{prefix}-{timestamp}-{random_suffix}"
        super().save(*args, **kwargs)

    def increment_download(self):
        """Thread-safe increment of download count."""
        from django.db.models import F
        SubscriptionReceipt.objects.filter(id=self.id).update(
            downloaded_count=F('downloaded_count') + 1
        )


class SubscriptionEmailLog(models.Model):
    """
    Tracks all subscription-related emails (expiry reminders, grace warnings).
    Prevents duplicate sends and aids debugging.
    """
    EMAIL_TYPE_CHOICES = [
        # --- Lifecycle notices ---
        ('activation_notice', 'Subscription Activated'),       # FIX: was missing, caused signal crash
        ('cancelled_notice', 'Subscription Cancelled'),
        # --- Expiry flow ---
        ('expiry_reminder_3day', '3-Day Expiry Reminder'),
        ('grace_period_warning', 'Grace Period Warning'),
        ('expired_notice', 'Expired Notice'),
        # --- Other ---
        ('trial_ending', 'Trial Ending Soon'),
        ('upgrade_offer', 'Upgrade Opportunity'),
    ]

    subscription = models.ForeignKey(
        UserSubscription,
        on_delete=models.CASCADE,
        related_name='email_logs'
    )
    email_type = models.CharField(max_length=30, choices=EMAIL_TYPE_CHOICES)
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered = models.BooleanField(default=False, help_text="Confirmed by email backend")
    error_message = models.TextField(blank=True)
    recipient_email = models.EmailField()

    class Meta:
        indexes = [
            models.Index(fields=['subscription', 'email_type']),
            models.Index(fields=['sent_at']),
        ]
        constraints = [
            # Prevent duplicate sends of same email type within 1 hour
            models.UniqueConstraint(
                fields=['subscription', 'email_type'],
                condition=models.Q(sent_at__gte=timezone.now() - timezone.timedelta(hours=1)),
                name='no_duplicate_email_within_hour'
            )
        ]
        verbose_name = "Subscription Email Log"
        verbose_name_plural = "Subscription Email Logs"

    def __str__(self):
        return f"{self.get_email_type_display()} for {self.subscription.user.email}"