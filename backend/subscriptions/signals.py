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
    Runs before every save to ensure consistency even if updated manually.
    """
    if instance.end_date and not instance.grace_end_date:
        instance.grace_end_date = instance.end_date + timedelta(days=2)


@receiver(post_save, sender=UserSubscription)
def handle_subscription_lifecycle_emails(sender, instance, created, update_fields=None, **kwargs):
    """
    Send appropriate notification emails when subscription status changes.
    Idempotent: respects SubscriptionEmailLog constraints to prevent duplicates.
    """
    # Skip if status field wasn't touched
    if update_fields and 'status' not in update_fields:
        return

    # Determine if this is a status transition
    try:
        old_status = UserSubscription.objects.filter(pk=instance.pk).values_list('status', flat=True).first()
    except Exception:
        old_status = None

    if created:
        old_status = None

    # Only trigger if status actually changed
    if old_status == instance.status:
        return

    # Route email based on new status
    try:
        if instance.status == 'active' and old_status in ('pending', None):
            send_subscription_email(
                subscription=instance,
                email_type='activation_notice',
                subject=f'Your {instance.plan.get_name_display()} Subscription is Active',
                template_name='emails/subscription_activated.html',
                context={
                    'start_date': instance.start_date.strftime('%d %b %Y'),
                    'end_date': instance.end_date.strftime('%d %b %Y')
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
                    'grace_end_date': instance.grace_end_date.strftime('%d %b %Y') if instance.grace_end_date else 'N/A'
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
        logger.error(f"Failed to send lifecycle email for subscription {instance.id}: {str(e)}")


@receiver(post_save, sender=SubscriptionTransaction)
def ensure_receipt_on_completion(sender, instance, created, update_fields=None, **kwargs):
    """
    Fallback receipt generator & audit logger for completed transactions.
    Acts as a safety net if the Daraja callback flow is interrupted.
    """
    if not created and instance.status == 'completed' and 'status' in (update_fields or []):
        # Check if receipt already exists
        has_receipt = SubscriptionReceipt.objects.filter(transaction=instance).exists()
        if not has_receipt:
            try:
                with transaction.atomic():
                    pdf_buffer = generate_receipt_pdf(instance)
                    SubscriptionReceipt.objects.create(
                        transaction=instance,
                        pdf_file=pdf_buffer
                    )
                logger.info(f"Signal generated fallback receipt for transaction {instance.id}")
            except Exception as e:
                logger.error(f"Fallback receipt generation failed for transaction {instance.id}: {str(e)}")