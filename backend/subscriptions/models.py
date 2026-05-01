import secrets
import string
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone


GRACE_PERIOD_DAYS = 2  # Single source of truth for grace period length


class SubscriptionPlan(models.Model):
    """
    Defines the 5-tier subscription hierarchy: Free → Basic → Standard → Premium → Elite.
    Tier level determines access: higher tiers unlock all lower-tier content.
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
    Tracks a user's subscription instance.
    One user can have many historical subscriptions, but only ONE active at a time.

    State machine:
        pending  ──(payment confirmed)──► active ──(expired)──► expired
                 ──(payment failed)────► cancelled
        active   ──(cancel)────────────► cancelled
        active   ──(admin revoke)──────► cancelled (immediate)
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
    grace_end_date = models.DateTimeField(
        null=True, blank=True,
        help_text=f"end_date + {GRACE_PERIOD_DAYS} days. Access continues in grace period."
    )
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
            # Enforce at the DB level: only one active subscription per user at a time.
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
        return f"{self.user.email} — {self.plan.get_name_display()} ({self.status})"

    def save(self, *args, **kwargs):
        """
        Always recalculate grace_end_date from end_date on every save.
        This ensures grace_end_date stays in sync when end_date is extended.
        NOTE: The pre_save signal also does this, so this is a belt-and-suspenders
        safeguard for direct model saves (e.g. shell, management commands).
        """
        if self.end_date:
            self.grace_end_date = self.end_date + timedelta(days=GRACE_PERIOD_DAYS)
        super().save(*args, **kwargs)

    # ------------------------------------------------------------------
    # Access-control helpers
    # ------------------------------------------------------------------

    def is_within_access_window(self) -> bool:
        """
        True if subscription is active OR within the grace period.
        Use this for all access-control decisions, NOT just status=='active'.
        """
        now = timezone.now()
        if self.status not in ('active', 'cancelled'):
            return False
        # cancelled subscriptions still grant access until end_date/grace
        cutoff = self.grace_end_date or self.end_date
        return cutoff >= now

    def can_access_tier(self, target_tier_level: int) -> bool:
        """
        True if this subscription grants access to content at the given tier level.
        Elite (4) can access tiers 0–4; Basic (1) can only access 0–1.
        """
        if not self.is_within_access_window():
            return False
        return self.plan.tier_level >= target_tier_level

    @property
    def days_remaining(self) -> int:
        """Days remaining before end_date. 0 if already past."""
        now = timezone.now()
        if not self.end_date or self.end_date <= now:
            return 0
        return (self.end_date - now).days

    # ------------------------------------------------------------------
    # Lifecycle actions
    # ------------------------------------------------------------------

    def cancel(self, immediate: bool = False):
        """
        Cancel subscription.
        - immediate=False (default): access continues until end_date/grace.
        - immediate=True: access revoked right now.
        Always call this instead of setting status directly.
        """
        with transaction.atomic():
            self.status = 'cancelled'
            self.cancelled_at = timezone.now()
            self.auto_renew = False
            if immediate:
                self.end_date = timezone.now()
                self.grace_end_date = None
            self.save()

    def activate(self):
        """
        Mark subscription as active. Called after payment confirmation.
        Automatically recalculates grace_end_date via save().
        """
        with transaction.atomic():
            self.status = 'active'
            self.save()

    def extend(self, days: int):
        """
        Extend subscription end_date by N days (admin action).
        Grace period is automatically recalculated by save().
        """
        with transaction.atomic():
            self.end_date = self.end_date + timedelta(days=days)
            # Explicitly clear grace_end_date so save() recalculates it.
            self.grace_end_date = None
            self.save()

    def mark_expired(self):
        """Transition active subscription to expired. Called by Celery expiry task."""
        with transaction.atomic():
            self.status = 'expired'
            self.save()


class SubscriptionTransaction(models.Model):
    """
    Records every M-Pesa STK Push attempt for subscription payments.

    Design notes:
    - checkout_request_id is unique to prevent duplicate processing.
    - Temporary IDs (prefixed TEMP-) are assigned at creation and replaced
      with the real Daraja CheckoutRequestID once the STK push succeeds.
    - Idempotent: the callback handler checks status before processing.
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
    # Unique: prevents duplicate processing of the same STK Push.
    # TEMP-<uuid> is used until the real Daraja ID is confirmed.
    checkout_request_id = models.CharField(max_length=100, unique=True)
    merchant_request_id = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15)  # Normalized 254XXXXXXXXX format
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
        return f"{self.user.email} — {self.amount} {self.currency} ({self.status})"

    @staticmethod
    def generate_temp_checkout_id() -> str:
        """
        Generate a guaranteed-unique temporary checkout ID used before
        the STK Push is initiated. Replaced with the real Daraja ID on success.
        """
        import uuid
        return f"TEMP-{uuid.uuid4().hex}"

    def is_temp_checkout_id(self) -> bool:
        return self.checkout_request_id.startswith('TEMP-')


class SubscriptionReceipt(models.Model):
    """
    Auto-generated receipt for completed subscription transactions.
    PDF stored in file storage; download count tracked for audit.
    """
    transaction = models.OneToOneField(
        SubscriptionTransaction,
        on_delete=models.CASCADE,
        related_name='receipt'
    )
    receipt_number = models.CharField(max_length=50, unique=True, editable=False)
    pdf_file = models.FileField(
        upload_to='receipts/subscriptions/%Y/%m/',
        help_text="PDF receipt file"
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    downloaded_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Subscription Receipt"
        verbose_name_plural = "Subscription Receipts"

    def __str__(self):
        return f"Receipt {self.receipt_number} for {self.transaction.user.email}"

    def save(self, *args, **kwargs):
        if not self.receipt_number:
            prefix = 'RCP'
            timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
            random_suffix = ''.join(
                secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6)
            )
            self.receipt_number = f"{prefix}-{timestamp}-{random_suffix}"
        super().save(*args, **kwargs)

    def increment_download(self):
        """Thread-safe increment using DB-level F() expression."""
        from django.db.models import F
        SubscriptionReceipt.objects.filter(id=self.id).update(
            downloaded_count=F('downloaded_count') + 1
        )


class SubscriptionEmailLog(models.Model):
    """
    Tracks all subscription-related emails sent to users.
    Used to prevent duplicate sends and provide an audit trail.

    Deduplication is enforced at the application layer (see already_sent()),
    not at the DB constraint layer, because DB constraints cannot use dynamic
    datetime expressions.
    """
    # Keep this exhaustive — every email_type used anywhere must be listed here.
    EMAIL_TYPE_CHOICES = [
        # Transactional
        ('activation_notice', 'Subscription Activated'),
        ('cancelled_notice', 'Subscription Cancelled'),
        ('expired_notice', 'Subscription Expired'),
        # Reminders (sent by Celery)
        ('expiry_reminder_7day', '7-Day Expiry Reminder'),
        ('expiry_reminder_3day', '3-Day Expiry Reminder'),
        ('grace_period_warning', 'Grace Period Warning'),
        ('trial_ending', 'Trial Ending Soon'),
        # Upsell
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
        # No DB-level dedup constraint here because constraints can't use
        # dynamic timezone.now() values. Use already_sent() instead.
        verbose_name = "Subscription Email Log"
        verbose_name_plural = "Subscription Email Logs"

    def __str__(self):
        return f"{self.get_email_type_display()} → {self.subscription.user.email}"

    @classmethod
    def already_sent(cls, subscription, email_type: str, within_hours: int = 24) -> bool:
        """
        Check if this email type was already sent for this subscription
        within the given window. Use before every send to prevent duplicates.

        Usage:
            if not SubscriptionEmailLog.already_sent(sub, 'expiry_reminder_3day'):
                send_subscription_email(...)
        """
        cutoff = timezone.now() - timedelta(hours=within_hours)
        return cls.objects.filter(
            subscription=subscription,
            email_type=email_type,
            sent_at__gte=cutoff,
        ).exists()