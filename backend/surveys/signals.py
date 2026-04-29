import logging
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import UserSurveySubmission

logger = logging.getLogger('surveys')


@receiver(post_save, sender=UserSurveySubmission)
def credit_wallet_on_approval(sender, instance, created, update_fields=None, **kwargs):
    """
    Automatically credits the user's main wallet when a survey submission is approved.
    Idempotent: checks for existing transactions to prevent duplicate payments.
    """
    # Skip on initial creation or if status wasn't touched
    if created:
        return
    if update_fields and 'status' not in update_fields:
        return

    # Only trigger on approval
    if instance.status == 'approved':
        # Lazy import to avoid circular dependencies with wallets app
        try:
            from wallets.models import WalletTransaction
        except ImportError:
            logger.error("WalletTransaction model not found. Skipping wallet credit.")
            return

        try:
            with transaction.atomic():
                # Idempotency check: ensure we haven't already credited this submission
                if WalletTransaction.objects.filter(
                    user=instance.user,
                    transaction_type='survey_earning',
                    description__contains=f"Submission ID: {instance.id}"
                ).exists():
                    return

                # Create wallet transaction
                # This automatically triggers your existing running_balance update logic
                WalletTransaction.objects.create(
                    user=instance.user,
                    wallet_type='main',
                    transaction_type='survey_earning',
                    amount=instance.category.amount_kes,
                    description=f"Payment for approved survey: {instance.category.name} (Submission ID: {instance.id})"
                )
                
                logger.info(f"✅ Credited {instance.category.amount_kes} KES to {instance.user.email} for survey submission {instance.id}")
                
        except Exception as e:
            logger.error(f"❌ Failed to credit wallet for submission {instance.id}: {str(e)}", exc_info=True)
            # Note: Approval status is preserved. Admin can manually retry via Django shell if needed.