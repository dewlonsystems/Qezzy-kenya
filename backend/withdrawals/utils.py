# withdrawals/utils.py
from users.utils import send_withdrawal_completed_email
import logging

logger = logging.getLogger(__name__)

def notify_user_withdrawal_completed(withdrawal):
    if withdrawal.status != 'completed':
        return
    try:
        destination = (
            withdrawal.mobile_phone
            if withdrawal.method == 'mobile'
            else f"{withdrawal.bank_name} ({withdrawal.account_number})"
        )
        send_withdrawal_completed_email(
            user=withdrawal.user,
            amount=withdrawal.amount,
            method=withdrawal.method,
            destination=destination,
            processed_at=withdrawal.processed_at
        )
    except Exception as e:
        logger.warning(f"Failed to send withdrawal email to {withdrawal.user.email}: {e}")