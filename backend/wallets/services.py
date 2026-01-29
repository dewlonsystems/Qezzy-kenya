# wallets/services.py
from django.db import transaction
from django.core.exceptions import ValidationError
from .models import WalletTransaction
from withdraws.models import WithdrawalRequest


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