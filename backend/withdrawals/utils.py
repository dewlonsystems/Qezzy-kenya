# withdrawals/utils.py
from users.utils import send_withdrawal_completed_email
import logging

logger = logging.getLogger(__name__)

def notify_user_withdrawal_completed(withdrawal):
    if withdrawal.status != 'completed':
        return

    try:
        # Determine destination display
        if withdrawal.method == 'mobile':
            destination = withdrawal.mobile_phone
        else:
            destination = f"{withdrawal.bank_name} ({withdrawal.account_number})"

        # Build recipient name
        user = withdrawal.user
        recipient_name = (
            f"{user.first_name} {user.last_name}".strip()
            or user.email
        )

        # Call email function with full context
        send_withdrawal_completed_email(
            user=user,
            amount=withdrawal.amount,
            method=withdrawal.method,
            destination=destination,
            processed_at=withdrawal.processed_at,
            receipt_number=getattr(withdrawal, 'mpesa_receipt_number', None),
            reference_code=getattr(withdrawal, 'reference_code', None),
            recipient_name=recipient_name
        )
    except Exception as e:
        logger.warning(f"Failed to send withdrawal email to {withdrawal.user.email}: {e}")