import logging
from datetime import timedelta

from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import (
    GRACE_PERIOD_DAYS,
    SubscriptionEmailLog,
    SubscriptionReceipt,
    SubscriptionTransaction,
    UserSubscription,
)
from .utils import generate_receipt_pdf, send_subscription_email

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# UserSubscription signals
# ---------------------------------------------------------------------------

@receiver(pre_save, sender=UserSubscription)
def cache_pre_save_state(sender, instance, **kwargs):
    """
    Capture the subscription's current DB state BEFORE the save occurs.
    Stored on the instance so the post_save signal can detect real changes.

    This is the correct pattern for change-detection in Django signals.
    Reading from the DB inside post_save always returns the NEW values
    because the write has already committed.
    """
    if instance.pk:
        try:
            previous = UserSubscription.objects.get(pk=instance.pk)
            instance._pre_save_status = previous.status
            instance._pre_save_end_date = previous.end_date
        except UserSubscription.DoesNotExist:
            instance._pre_save_status = None
            instance._pre_save_end_date = None
    else:
        # New record being created — no previous state.
        instance._pre_save_status = None
        instance._pre_save_end_date = None


@receiver(pre_save, sender=UserSubscription)
def recalculate_grace_period(sender, instance, **kwargs):
    """
    Always keep grace_end_date exactly GRACE_PERIOD_DAYS after end_date.
    Runs on every save so that admin edits, extensions, and cancellations
    always produce a consistent grace_end_date.

    Note: immediate cancellations explicitly set grace_end_date=None in
    UserSubscription.cancel(immediate=True), which is preserved here.
    """
    if instance.end_date and not (instance.status == 'cancelled' and instance.grace_end_date is None):
        instance.grace_end_date = instance.end_date + timedelta(days=GRACE_PERIOD_DAYS)


@receiver(post_save, sender=UserSubscription)
def handle_subscription_lifecycle_emails(sender, instance, created, **kwargs):
    """
    Send notification emails when subscription status transitions.

    Uses _pre_save_status (set by cache_pre_save_state) to detect genuine
    transitions. Without this, reading status from the DB in post_save
    always returns the current (already-written) value, making change
    detection impossible.

    Email deduplication:
        SubscriptionEmailLog.already_sent() prevents duplicate sends even
        if this signal fires multiple times (e.g. admin re-saves a record).
    """
    old_status = getattr(instance, '_pre_save_status', None)
    new_status = instance.status

    # No real status change — nothing to do.
    if old_status == new_status and not created:
        return

    # New record: treat as transition from None → new_status.
    if created:
        old_status = None

    try:
        _route_lifecycle_email(instance, old_status, new_status)
    except Exception as e:
        logger.error(
            f"Failed to send lifecycle email for subscription {instance.id} "
            f"({old_status} → {new_status}): {e}",
            exc_info=True,
        )


def _route_lifecycle_email(subscription, old_status, new_status):
    """
    Determine which email (if any) to send for a given status transition.
    Extracted from the signal receiver for testability.
    """
    if new_status == 'active' and old_status in (None, 'pending'):
        # Guard: don't send if we already sent an activation notice recently.
        if SubscriptionEmailLog.already_sent(subscription, 'activation_notice', within_hours=1):
            logger.debug(f"Activation email already sent for sub {subscription.id}; skipping.")
            return
        send_subscription_email(
            subscription=subscription,
            email_type='activation_notice',
            subject=f'Your {subscription.plan.get_name_display()} Subscription is Active',
            template_name='emails/subscription_activated.html',
            context={
                'plan_name': subscription.plan.get_name_display(),
                'start_date': subscription.start_date.strftime('%d %b %Y'),
                'end_date': subscription.end_date.strftime('%d %b %Y'),
                'is_trial': subscription.is_trial,
            }
        )

    elif new_status == 'cancelled':
        if SubscriptionEmailLog.already_sent(subscription, 'cancelled_notice', within_hours=1):
            logger.debug(f"Cancellation email already sent for sub {subscription.id}; skipping.")
            return
        # Determine whether the cancellation was immediate (end_date is now/past).
        immediate = subscription.end_date <= timezone.now()
        send_subscription_email(
            subscription=subscription,
            email_type='cancelled_notice',
            subject='Your Qezzy Subscription Has Been Cancelled',
            template_name='emails/subscription_cancelled.html',
            context={
                'immediate': immediate,
                'end_date': subscription.end_date.strftime('%d %b %Y') if subscription.end_date else 'N/A',
                'grace_end_date': (
                    subscription.grace_end_date.strftime('%d %b %Y')
                    if subscription.grace_end_date else None
                ),
            }
        )

    elif new_status == 'expired':
        if SubscriptionEmailLog.already_sent(subscription, 'expired_notice', within_hours=1):
            logger.debug(f"Expired email already sent for sub {subscription.id}; skipping.")
            return
        send_subscription_email(
            subscription=subscription,
            email_type='expired_notice',
            subject='Your Qezzy Subscription Has Expired',
            template_name='emails/subscription_expired.html',
            context={'plan_name': subscription.plan.get_name_display()}
        )


# ---------------------------------------------------------------------------
# SubscriptionTransaction signals
# ---------------------------------------------------------------------------

@receiver(pre_save, sender=SubscriptionTransaction)
def cache_transaction_pre_save_status(sender, instance, **kwargs):
    """Cache previous transaction status for change detection in post_save."""
    if instance.pk:
        try:
            instance._pre_save_tx_status = SubscriptionTransaction.objects.filter(
                pk=instance.pk
            ).values_list('status', flat=True).first()
        except Exception:
            instance._pre_save_tx_status = None
    else:
        instance._pre_save_tx_status = None


@receiver(post_save, sender=SubscriptionTransaction)
def ensure_receipt_on_completion(sender, instance, created, **kwargs):
    """
    Fallback receipt generator for completed transactions.

    Acts as a safety net if the Daraja callback flow is interrupted after
    marking the transaction completed but before generating the receipt.
    Only runs when status genuinely transitions to 'completed'.
    """
    old_status = getattr(instance, '_pre_save_tx_status', None)

    # Only trigger on genuine pending→completed transitions, not on creation
    # of already-completed records (e.g. free plan, admin activation).
    if instance.status != 'completed':
        return
    if old_status == 'completed':
        return  # Already processed; idempotent.

    # Check if receipt already exists (callback may have created it).
    if SubscriptionReceipt.objects.filter(transaction=instance).exists():
        return

    try:
        with transaction.atomic():
            pdf_buffer = generate_receipt_pdf(instance)
            SubscriptionReceipt.objects.create(
                transaction=instance,
                pdf_file=pdf_buffer,
            )
        logger.info(f"Signal generated fallback receipt for transaction {instance.id}")
    except Exception as e:
        logger.error(
            f"Fallback receipt generation failed for transaction {instance.id}: {e}",
            exc_info=True,
        )