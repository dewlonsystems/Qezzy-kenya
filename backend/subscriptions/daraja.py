import base64
import requests
from datetime import datetime
from django.conf import settings
import logging
from decouple import config

logger = logging.getLogger(__name__)

DARAJA_CONSUMER_KEY = config('DARAJA_CONSUMER_KEY')
DARAJA_CONSUMER_SECRET = config('DARAJA_CONSUMER_SECRET')

DARAJA_SHORTCODE = config('DARAJA_SHORTCODE', default='174379')

DARAJA_PASSKEY = config('DARAJA_PASSKEY')
DARAJA_CALLBACK_URL = config('DARAJA_CALLBACK_URL')

DARAJA_TILL_NUMBER = config('DARAJA_TILL_NUMBER')


def get_access_token():
    """
    Fetch Daraja OAuth2 access token using consumer key + secret.
    Returns the token string, or None on failure.
    """
    api_url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    credentials = base64.b64encode(
        f"{DARAJA_CONSUMER_KEY}:{DARAJA_CONSUMER_SECRET}".encode()
    ).decode()
    headers = {"Authorization": f"Basic {credentials}"}
    try:
        response = requests.get(api_url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json().get('access_token')
    except Exception as e:
        logger.error(f"Failed to retrieve Daraja access token: {str(e)}")
        return None


def normalize_phone(phone: str) -> str:
    """
    Convert any common Kenyan phone format to the 254XXXXXXXXX format
    required by Daraja.

    Accepts: 07XXXXXXXX, +2547XXXXXXXX, 2547XXXXXXXX
    Raises ValueError for anything that doesn't normalise correctly.
    """
    phone = phone.strip()

    if phone.startswith('+'):
        phone = phone[1:]

    if phone.startswith('0'):
        phone = '254' + phone[1:]
    elif phone.startswith('254'):
        pass
    else:
        raise ValueError(
            "Invalid phone number format. Use 07XXXXXXXX, 2547XXXXXXXX, or +2547XXXXXXXX."
        )

    if not (phone.isdigit() and len(phone) == 12 and phone.startswith('254')):
        raise ValueError(
            f"Phone number '{phone}' failed validation after normalisation. "
            "Expected 12 digits starting with 254."
        )

    return phone


def generate_stk_push(
    phone_number: str,
    amount: int,
    account_reference: str,
    transaction_desc: str = "Subscription Payment",
) -> dict:
 
    access_token = get_access_token()
    if not access_token:
        return {"error": "Unable to authenticate with Daraja. Check consumer key/secret."}

    api_url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')

    password = base64.b64encode(
        f"{DARAJA_SHORTCODE}{DARAJA_PASSKEY}{timestamp}".encode()
    ).decode()

    safe_reference = account_reference[:12]

    payload = {
        "BusinessShortCode": DARAJA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerBuyGoodsOnline",
        "Amount": amount,
        "PartyA": phone_number,
        "PartyB": DARAJA_TILL_NUMBER,
        "PhoneNumber": phone_number,
        "CallBackURL": DARAJA_CALLBACK_URL,
        "AccountReference": safe_reference,
        "TransactionDesc": transaction_desc,
    }

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    try:
        response = requests.post(api_url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        result = response.json()
        logger.info(
            f"STK Push sent to {phone_number} for {safe_reference}: "
            f"CheckoutRequestID={result.get('CheckoutRequestID')}"
        )
        return result
    except requests.exceptions.Timeout:
        logger.error("STK Push timed out — Daraja did not respond within 30 s")
        return {"error": "Daraja API timed out. Please try again."}
    except requests.exceptions.HTTPError as e:
        logger.error(f"STK Push HTTP error: {e.response.status_code} — {e.response.text}")
        return {"error": f"Daraja returned HTTP {e.response.status_code}"}
    except requests.exceptions.RequestException as e:
        logger.error(f"STK Push request failed: {str(e)}")
        return {"error": "Failed to reach Daraja API. Check network connectivity."}