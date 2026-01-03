import base64
import requests
from datetime import datetime
from decouple import config

DARAJA_CONSUMER_KEY = config('DARAJA_CONSUMER_KEY')
DARAJA_CONSUMER_SECRET = config('DARAJA_CONSUMER_SECRET')
DARAJA_SHORTCODE = config('DARAJA_SHORTCODE')
DARAJA_PASSKEY = config('DARAJA_PASSKEY')

def get_access_token():
    url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    credentials = base64.b64encode(f"{DARAJA_CONSUMER_KEY}:{DARAJA_CONSUMER_SECRET}".encode()).decode()
    headers = {"Authorization": f"Basic {credentials}"}
    response = requests.get(url, headers=headers)
    return response.json().get('access_token')

def send_b2c_payment(phone_number, amount, remarks="Withdrawal payout"):
    access_token = get_access_token()
    if not access_token:
        return None

    url = "https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest"
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode(f"{DARAJA_SHORTCODE}{DARAJA_PASSKEY}{timestamp}".encode()).decode()

    payload = {
        "InitiatorName": "testapi",  # Replace with real initiator in production
        "SecurityCredential": password,
        "CommandID": "BusinessPayment",
        "Amount": int(amount),
        "PartyA": DARAJA_SHORTCODE,
        "PartyB": phone_number,
        "Remarks": remarks,
        "QueueTimeOutURL": config('DARAJA_TIMEOUT_URL', default='https://example.com/timeout'),
        "ResultURL": config('DARAJA_RESULT_URL', default='https://example.com/result'),
        "Occasion": "Withdrawal"
    }

    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}
    response = requests.post(url, json=payload, headers=headers)
    return response.json()