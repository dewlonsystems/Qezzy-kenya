"""
Daraja M-Pesa STK Push integration.

Configuration (all in Django settings, sourced from environment):
    DARAJA_CONSUMER_KEY       — Safaricom app consumer key
    DARAJA_CONSUMER_SECRET    — Safaricom app consumer secret
    DARAJA_SHORTCODE          — Business shortcode (also used as BusinessShortCode)
    DARAJA_PASSKEY            — Lipa Na M-Pesa online passkey
    DARAJA_CALLBACK_URL       — Public HTTPS URL Safaricom POSTs results to
    DARAJA_TILL_NUMBER        — Till number (PartyB for CustomerBuyGoodsOnline)
    DARAJA_ENV                — 'sandbox' or 'production' (default: 'sandbox')

Token caching:
    Access tokens are cached in Django's cache backend for 3,400 seconds
    (tokens last 3,600 s; we refresh 200 s early). A cache miss triggers
    a live OAuth call; all subsequent calls within the window are free.
    If you're running multiple worker processes, use a shared cache backend
    (Redis, Memcached) to share the token across processes.
"""

import base64
import logging
from datetime import datetime

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# M-Pesa field length limits. Values that exceed these are truncated with
# a warning rather than passed through (Safaricom silently rejects long values).
MPESA_ACCOUNT_REF_MAX_LEN = 12
MPESA_TX_DESC_MAX_LEN = 13

# Access token is valid for 3,600 s. We cache it for 3,400 s to ensure
# it never expires between being fetched and being used.
_TOKEN_CACHE_KEY = 'daraja_access_token'
_TOKEN_TTL_SECONDS = 3_400

# Safaricom API base URLs, keyed by environment.
_DARAJA_URLS = {
    'sandbox': {
        'oauth': 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        'stk_push': 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    },
    'production': {
        'oauth': 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        'stk_push': 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    },
}

# M-Pesa timestamps must be in East Africa Time (UTC+3), regardless of
# the server's local timezone. We import ZoneInfo (Python ≥ 3.9) and fall
# back to a fixed-offset timezone for older environments.
try:
    from zoneinfo import ZoneInfo
    _NAIROBI_TZ = ZoneInfo('Africa/Nairobi')
except ImportError:
    from datetime import timezone, timedelta
    _NAIROBI_TZ = timezone(timedelta(hours=3), name='EAT')


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_setting(name: str, default=None):
    """
    Read a Daraja config value from Django settings.
    Raises ImproperlyConfigured with a clear message if a required key is absent.
    """
    value = getattr(settings, name, default)
    if value is None:
        from django.core.exceptions import ImproperlyConfigured
        raise ImproperlyConfigured(
            f"Missing required Daraja setting: {name}. "
            f"Add it to your Django settings (e.g. via environment variable)."
        )
    return value


def _daraja_env() -> str:
    env = getattr(settings, 'DARAJA_ENV', 'sandbox').lower()
    if env not in _DARAJA_URLS:
        logger.warning(f"Unknown DARAJA_ENV '{env}'; defaulting to 'sandbox'.")
        return 'sandbox'
    return env


def _get_url(endpoint: str) -> str:
    return _DARAJA_URLS[_daraja_env()][endpoint]


def _nairobi_timestamp() -> str:
    """
    Return the current time in Africa/Nairobi (EAT, UTC+3) formatted as
    YYYYMMDDHHmmss. M-Pesa validates the password using this timestamp,
    so using any other timezone causes silent authentication failures.
    """
    return datetime.now(tz=_NAIROBI_TZ).strftime('%Y%m%d%H%M%S')


def _log_response_error(response: requests.Response, context: str):
    """Log a non-2xx Safaricom response with as much context as possible."""
    try:
        body = response.json()
    except Exception:
        body = response.text[:500]  # Avoid logging huge HTML error pages.
    logger.error(
        f"Daraja {context} failed — "
        f"status={response.status_code}, body={body}"
    )


def _truncate(value: str, max_len: int, field_name: str) -> str:
    """
    Truncate a string to M-Pesa's field limit with a warning.
    Silently passing a long value causes Safaricom to reject the request
    with a generic error that's hard to trace back to this root cause.
    """
    if len(value) > max_len:
        truncated = value[:max_len]
        logger.warning(
            f"Daraja field '{field_name}' truncated from {len(value)} to "
            f"{max_len} chars: '{value}' → '{truncated}'"
        )
        return truncated
    return value


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def normalize_phone(phone: str) -> str:
    """
    Normalize a Kenyan phone number to the 254XXXXXXXXX (12-digit) format
    required by Daraja.

    Accepted input formats:
        0712345678   → 254712345678
        +254712345678 → 254712345678
        254712345678  → 254712345678
        712345678    → 254712345678  (9-digit, no leading zero)

    Raises ValueError if the result is not a valid 12-digit Kenyan number.
    """
    phone = phone.strip().replace(' ', '').replace('-', '')

    if phone.startswith('+'):
        phone = phone[1:]

    if phone.startswith('254'):
        pass  # Already in the right prefix form.
    elif phone.startswith('0') and len(phone) == 10:
        phone = '254' + phone[1:]
    elif len(phone) == 9 and phone[0] in ('7', '1'):
        # 9-digit format without leading zero, e.g. 712345678
        phone = '254' + phone
    else:
        raise ValueError(
            f"Unrecognised phone number format: '{phone}'. "
            "Use 0712345678, 254712345678, +254712345678, or 712345678."
        )

    if not (phone.isdigit() and len(phone) == 12 and phone.startswith('254')):
        raise ValueError(
            f"Phone number '{phone}' is not a valid 12-digit Kenyan number "
            "(must start with 254 and contain 12 digits)."
        )

    return phone


def get_access_token() -> str | None:
    """
    Retrieve a valid Daraja OAuth2 access token.

    Tokens are cached in Django's cache backend for _TOKEN_TTL_SECONDS so
    that only one HTTP call is made per token lifetime across all requests.
    A cache miss triggers a live OAuth call; subsequent calls are instant.

    Returns the token string on success, None on failure (error is logged).
    """
    cached_token = cache.get(_TOKEN_CACHE_KEY)
    if cached_token:
        logger.debug("Daraja: using cached access token.")
        return cached_token

    consumer_key = _get_setting('DARAJA_CONSUMER_KEY')
    consumer_secret = _get_setting('DARAJA_CONSUMER_SECRET')
    url = _get_url('oauth')

    try:
        response = requests.get(
            url,
            auth=(consumer_key, consumer_secret),  # requests handles Basic auth encoding.
            timeout=10,
        )
        if not response.ok:
            _log_response_error(response, 'OAuth token fetch')
            return None

        token = response.json().get('access_token')
        if not token:
            logger.error(f"Daraja OAuth response missing 'access_token': {response.json()}")
            return None

        cache.set(_TOKEN_CACHE_KEY, token, _TOKEN_TTL_SECONDS)
        logger.info(
            f"Daraja: new access token fetched and cached "
            f"(env={_daraja_env()}, ttl={_TOKEN_TTL_SECONDS}s)."
        )
        return token

    except requests.exceptions.Timeout:
        logger.error("Daraja OAuth timed out after 10 s.")
        return None
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Daraja OAuth connection error: {e}")
        return None
    except Exception as e:
        logger.error(f"Daraja OAuth unexpected error: {e}", exc_info=True)
        return None


def generate_stk_push(
    phone_number: str,
    amount: int,
    account_reference: str,
    transaction_desc: str = "Subscription",
) -> dict:
    """
    Initiate a Lipa Na M-Pesa Online (STK Push) payment request.

    Args:
        phone_number:       Customer's phone number (any Kenyan format; auto-normalised).
        amount:             Amount in whole KES (minimum 1). M-Pesa does not use cents.
        account_reference:  Short identifier shown on the customer's phone (max 12 chars).
        transaction_desc:   Brief description shown on the customer's phone (max 13 chars).

    Returns:
        dict — Daraja API response on success:
            {
              'MerchantRequestID': '...',
              'CheckoutRequestID': '...',
              'ResponseCode': '0',
              'ResponseDescription': 'Success. Request accepted for processing',
              'CustomerMessage': 'Success. Request accepted for processing',
            }

        dict — Error payload on failure:
            {'error': '<human-readable reason>'}
    """
    # ------------------------------------------------------------------
    # Input validation
    # ------------------------------------------------------------------
    if not isinstance(amount, int) or amount < 1:
        logger.error(f"STK Push rejected: invalid amount={amount!r} (must be int ≥ 1 KES).")
        return {'error': f"Amount must be a whole number of KES ≥ 1, got: {amount!r}"}

    try:
        phone_number = normalize_phone(phone_number)
    except ValueError as e:
        logger.error(f"STK Push rejected: phone normalization failed — {e}")
        return {'error': str(e)}

    # Truncate fields that M-Pesa enforces length limits on.
    account_reference = _truncate(account_reference, MPESA_ACCOUNT_REF_MAX_LEN, 'AccountReference')
    transaction_desc = _truncate(transaction_desc, MPESA_TX_DESC_MAX_LEN, 'TransactionDesc')

    # ------------------------------------------------------------------
    # Fetch (or reuse cached) access token
    # ------------------------------------------------------------------
    access_token = get_access_token()
    if not access_token:
        return {'error': 'Unable to authenticate with Daraja. Check credentials and network.'}

    # ------------------------------------------------------------------
    # Build STK Push payload
    # ------------------------------------------------------------------
    shortcode = _get_setting('DARAJA_SHORTCODE')
    passkey = _get_setting('DARAJA_PASSKEY')
    till_number = _get_setting('DARAJA_TILL_NUMBER')
    callback_url = _get_setting('DARAJA_CALLBACK_URL')

    timestamp = _nairobi_timestamp()
    # Password = Base64(shortcode + passkey + timestamp)
    password = base64.b64encode(
        f"{shortcode}{passkey}{timestamp}".encode()
    ).decode()

    payload = {
        "BusinessShortCode": shortcode,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerBuyGoodsOnline",
        "Amount": amount,                     # Whole KES — no cents.
        "PartyA": phone_number,               # Customer's phone.
        "PartyB": till_number,                # Merchant's till number.
        "PhoneNumber": phone_number,          # Phone that receives STK prompt.
        "CallBackURL": callback_url,
        "AccountReference": account_reference,
        "TransactionDesc": transaction_desc,
    }

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # ------------------------------------------------------------------
    # Send request
    # ------------------------------------------------------------------
    url = _get_url('stk_push')
    logger.info(
        f"Daraja STK Push → phone={phone_number}, amount={amount} KES, "
        f"ref={account_reference!r}, env={_daraja_env()}"
    )

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)

        if not response.ok:
            _log_response_error(response, 'STK Push')
            # Surface Safaricom's error message if present.
            try:
                safaricom_err = response.json().get('errorMessage', 'Unknown Safaricom error')
            except Exception:
                safaricom_err = f"HTTP {response.status_code}"
            return {'error': f"Daraja rejected the request: {safaricom_err}"}

        result = response.json()
        response_code = result.get('ResponseCode')

        if response_code != '0':
            # Safaricom returned 200 OK but with a business-logic error.
            err_desc = result.get('ResponseDescription', 'Unknown error')
            logger.error(f"Daraja STK Push business error — code={response_code}, desc={err_desc}")
            return {'error': f"Daraja error ({response_code}): {err_desc}"}

        logger.info(
            f"Daraja STK Push accepted — "
            f"CheckoutRequestID={result.get('CheckoutRequestID')}"
        )
        return result

    except requests.exceptions.Timeout:
        logger.error("Daraja STK Push timed out after 30 s.")
        return {'error': 'Daraja API timed out. Please try again.'}
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Daraja STK Push connection error: {e}")
        return {'error': 'Could not reach Daraja API. Check network connectivity.'}
    except Exception as e:
        logger.error(f"Daraja STK Push unexpected error: {e}", exc_info=True)
        return {'error': 'An unexpected error occurred initiating payment.'}


def invalidate_token_cache():
    """
    Force the next get_access_token() call to fetch a fresh token.
    Useful after rotating Daraja credentials or in tests.
    """
    cache.delete(_TOKEN_CACHE_KEY)
    logger.info("Daraja: access token cache invalidated.")