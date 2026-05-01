import logging
from datetime import timedelta

from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone

from .models import UserSubscription, SubscriptionTransaction, SubscriptionReceipt, SubscriptionEmailLog
from .utils import send_subscription_email, generate_receipt_pdf

logger = logging.getLogger(__name__)


@receiver(pre_save, sender=UserSubscription)
def auto_calculate_grace_period(sender, instance, **kwargs):
    """
    Automatically set grace_end_date to exactly 2 days after end_date.
    Runs before every save. Also recalculates if end_date changed (e.g. after renewal).
    """
    if instance.end_date:
        # Recalculate any time end_date is set so renewals update the grace window.
        instance.grace_end_date = instance.end_date + timedelta(days=2)


@receiver(post_save, sender=UserSubscription)
def handle_subscription_lifecycle_emails(sender, instance, created, update_fields=None, **kwargs):
    """
    Send appropriate notification emails when subscription status changes.
    Idempotent: respects SubscriptionEmailLog constraints to prevent duplicates.
    """
    # Skip if status field wasn't part of this save
    if update_fields is not None and 'status' not in update_fields:
        return

    # Safely determine the previous status from the DB.
    # On creation there is no previous row, so old_status is None.
    old_status = None
    if not created:
        try:
            old_status = (
                UserSubscription.objects
                .filter(pk=instance.pk)
                .values_list('status', flat=True)
                .first()
            )
        except Exception:
            old_status = None

    # Nothing changed — skip to avoid spurious emails on unrelated field saves.
    if old_status == instance.status and not created:
        return

    try:
        if instance.status == 'active' and old_status in ('pending', None):
            # Subscription just activated (post payment or admin action)
            send_subscription_email(
                subscription=instance,
                email_type='activation_notice',   # now present in EMAIL_TYPE_CHOICES
                subject=f'Your {instance.plan.get_name_display()} Subscription is Now Active',
                template_name='emails/subscription_activated.html',
                context={
                    'start_date': instance.start_date.strftime('%d %b %Y'),
                    'end_date': instance.end_date.strftime('%d %b %Y'),
                }
            )

        elif instance.status == 'cancelled':
            send_subscription_email(
                subscription=instance,
                email_type='cancelled_notice',
                subject='Subscription Cancelled — Access Continues Until End of Period',
                template_name='emails/subscription_cancelled.html',
                context={
                    'end_date': instance.end_date.strftime('%d %b %Y') if instance.end_date else 'N/A',
                    'grace_end_date': (
                        instance.grace_end_date.strftime('%d %b %Y')
                        if instance.grace_end_date else 'N/A'
                    ),
                }
            )

        elif instance.status == 'expired':
            send_subscription_email(
                subscription=instance,
                email_type='expired_notice',
                subject='Your Qezzy Subscription Has Expired',
                template_name='emails/subscription_expired.html',
                context={'plan_name': instance.plan.get_name_display()}
            )

    except Exception as e:
        logger.error(
            f"Failed to send lifecycle email for subscription {instance.id}: {str(e)}"
        )


@receiver(post_save, sender=SubscriptionTransaction)
def ensure_receipt_on_completion(sender, instance, created, update_fields=None, **kwargs):
    """
    Fallback receipt generator for completed transactions.
    Acts as a safety net if the Daraja callback flow is interrupted mid-way.
    Only triggers when the status field transitions to 'completed' on an update
    (not on initial creation, which always starts as 'pending').
    """
    if created:
        return  # New transactions are always pending; nothing to do yet.

    if instance.status != 'completed':
        return

    # Only act when 'status' was explicitly part of this save
    if update_fields is not None and 'status' not in update_fields:
        return

    has_receipt = SubscriptionReceipt.objects.filter(transaction=instance).exists()
    if has_receipt:
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
            f"Fallback receipt generation failed for transaction {instance.id}: {str(e)}"
        )