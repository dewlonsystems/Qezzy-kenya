import base64
import requests
from datetime import datetime
from django.conf import settings
from decouple import config

# Daraja credentials (add to .env later)
DARAJA_CONSUMER_KEY = config('DARAJA_CONSUMER_KEY', default='your-key')
DARAJA_CONSUMER_SECRET = config('DARAJA_CONSUMER_SECRET', default='your-secret')
DARAJA_SHORTCODE = config('DARAJA_SHORTCODE', default='174379')
DARAJA_PASSKEY = config('DARAJA_PASSKEY', default='your-passkey')
DARAJA_CALLBACK_URL = config('DARAJA_CALLBACK_URL', default='http://localhost:8000/api/activation/daraja/callback/')

def get_access_token():
    api_url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    credentials = base64.b64encode(f"{DARAJA_CONSUMER_KEY}:{DARAJA_CONSUMER_SECRET}".encode()).decode()
    headers = {"Authorization": f"Basic {credentials}"}
    response = requests.get(api_url, headers=headers)
    return response.json().get('access_token')

def generate_stk_push(phone_number, amount, account_reference, transaction_desc="Account Activation"):
    access_token = get_access_token()
    if not access_token:
        return None

    api_url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(f"{DARAJA_SHORTCODE}{DARAJA_PASSKEY}{timestamp}".encode()).decode()

    payload = {
        "BusinessShortCode": DARAJA_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": phone_number,
        "PartyB": DARAJA_SHORTCODE,
        "PhoneNumber": phone_number,
        "CallBackURL": DARAJA_CALLBACK_URL,
        "AccountReference": account_reference,
        "TransactionDesc": transaction_desc
    }

    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    response = requests.post(api_url, json=payload, headers=headers)
    return response.json()