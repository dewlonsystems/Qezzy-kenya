# wallets/services.py
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import WalletTransaction
from withdrawals.models import WithdrawalRequest


def reverse_completed_withdrawal(withdrawal_request, reversed_by_user, reason=""):
    """
    Reverses a completed withdrawal by creating a compensating credit transaction.
    """
    if withdrawal_request.status != 'completed':
        raise ValidationError("Only completed withdrawals can be reversed.")

    # Prevent double-reversal
    if WalletTransaction.objects.filter(
        linked_withdrawal=withdrawal_request,
        transaction_type='withdrawal_reversal'
    ).exists():
        raise ValidationError("This withdrawal has already been reversed.")

    with transaction.atomic():
        reversal_tx = WalletTransaction.objects.create(
            user=withdrawal_request.user,
            wallet_type=withdrawal_request.wallet_type,
            transaction_type='withdrawal_reversal',
            amount=withdrawal_request.amount,
            description=(
                f"Reversal of withdrawal {withdrawal_request.reference_code}. "
                f"Reason: {reason or 'Admin request'}. "
                f"Reversed by: {reversed_by_user.email}"
            ),
            linked_withdrawal=withdrawal_request
        )
        return reversal_tx


def reverse_pending_withdrawal(withdrawal_request, reason=""):
    """
    Reverses a pending (or needs_review) withdrawal by crediting the wallet.
    Used when Daraja fails, times out, or ops cancel a pending request.
    """
    if withdrawal_request.status not in ['pending', 'needs_review']:
        raise ValidationError("Only pending or needs_review withdrawals can be reversed.")

    # Find the pending transaction
    try:
        pending_tx = WalletTransaction.objects.get(
            linked_withdrawal=withdrawal_request,
            transaction_type='withdrawal_pending'
        )
    except WalletTransaction.DoesNotExist:
        raise ValidationError("No pending transaction found to reverse.")

    # Check if already reversed (idempotency)
    if WalletTransaction.objects.filter(
        linked_withdrawal=withdrawal_request,
        transaction_type='withdrawal_reversal'
    ).exists():
        raise ValidationError("This withdrawal has already been reversed.")

    with transaction.atomic():
        # Create reversal transaction
        reversal_tx = WalletTransaction.objects.create(
            user=withdrawal_request.user,
            wallet_type=withdrawal_request.wallet_type,
            transaction_type='withdrawal_reversal',
            amount=withdrawal_request.amount,
            description=(
                f"Reversal of failed/timeout withdrawal {withdrawal_request.reference_code}. "
                f"Reason: {reason or 'Daraja failure'}"
            ),
            linked_withdrawal=withdrawal_request
        )

        # Optionally update withdrawal status to 'reversed' (optional — current status is fine)
        # withdrawal_request.status = 'reversed'
        # withdrawal_request.save(update_fields=['status'])

        return reversal_tx