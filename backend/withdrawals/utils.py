# withdrawals/utils.py
import ipaddress
from functools import wraps
from django.http import HttpResponseForbidden
from users.utils import send_withdrawal_completed_email
import logging

logger = logging.getLogger(__name__)

# Official Safaricom Daraja B2C callback IP ranges (as of 2026)
SAFE_DARAJA_IP_RANGES = [
    "196.201.212.69", "196.201.212.74", "196.201.212.127",
    "196.201.212.129", "196.201.212.136", "196.201.212.138",
    "196.201.213.44", "196.201.213.114",
    "196.201.214.200", "196.201.214.206", "196.201.214.207", "196.201.214.208",  
]

def is_safaricom_ip(ip_str):
    """Check if IP belongs to Safaricom's Daraja callback ranges."""
    try:
        ip = ipaddress.ip_address(ip_str)
        for cidr in SAFE_DARAJA_IP_RANGES:
            if ip in ipaddress.ip_network(cidr):
                return True
    except ValueError:
        pass
    return False

def require_safaricom_ip(view_func):
    """
    Decorator to allow only Safaricom Daraja IPs.
    Returns 403 Forbidden for non-whitelisted IPs.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # Get real client IP (support X-Forwarded-For if behind proxy)
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded_for:
            client_ip = forwarded_for.split(',')[0].strip()
        else:
            client_ip = request.META.get('REMOTE_ADDR', '')

        if not is_safaricom_ip(client_ip):
            logger.warning(f"Daraja callback from non-whitelisted IP: {client_ip}")
            return HttpResponseForbidden("Access denied")

        return view_func(request, *args, **kwargs)
    return _wrapped_view


# Keep your existing utility
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