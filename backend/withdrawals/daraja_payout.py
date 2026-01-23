import base64
import requests
from datetime import datetime
from decouple import config

MPESA_B2C_CONSUMER_KEY = config('MPESA_B2C_CONSUMER_KEY')
MPESA_B2C_CONSUMER_SECRET = config('MPESA_B2C_CONSUMER_SECRET')
MPESA_B2C_INITIATOR_NAME = config('MPESA_B2C_INITIATOR_NAME')
MPESA_B2C_SECURITY_CREDENTIAL = config('MPESA_B2C_SECURITY_CREDENTIAL')
MPESA_B2C_SHORTCODE = config('MPESA_B2C_SHORTCODE')

MPESA_B2C_TIMEOUT_URL = config('MPESA_B2C_TIMEOUT_URL').strip()
MPESA_B2C_RESULT_URL = config('MPESA_B2C_RESULT_URL').strip()


def get_access_token():
    url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    credentials = base64.b64encode(
        f"{MPESA_B2C_CONSUMER_KEY}:{MPESA_B2C_CONSUMER_SECRET}".encode()
    ).decode()

    headers = {
        "Authorization": f"Basic {credentials}"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json().get("access_token")
    except requests.exceptions.RequestException as e:
        print(f"Access token error: {e}")
        return None


def normalize_phone_number(phone_number: str):
    phone_number = phone_number.strip()

    if phone_number.startswith("0"):
        return "254" + phone_number[1:]
    if phone_number.startswith("+254"):
        return phone_number[1:]
    if phone_number.startswith("254"):
        return phone_number

    return None


def send_b2c_payment(phone_number, amount, remarks="Withdrawal payout", originator_id=None):
    phone_number = normalize_phone_number(phone_number)
    if not phone_number:
        return {"error": "Invalid phone number format"}

    try:
        amount = int(float(amount))
        if amount < 10:
            return {"error": "Amount must be at least KES 10"}
    except (ValueError, TypeError):
        return {"error": "Invalid amount"}

    remarks = remarks.strip()
    if len(remarks) < 2:
        remarks = "Withdrawal payout"
    remarks = remarks[:100]

    access_token = get_access_token()
    if not access_token:
        return {"error": "Failed to authenticate your request"}

    if originator_id:
        originator_id = str(originator_id)[:20]
    else:
        originator_id = f"B2C{int(datetime.now().timestamp())}"[:20]

    url = "https://api.safaricom.co.ke/mpesa/b2c/v3/paymentrequest"

    payload = {
        "OriginatorConversationID": originator_id,
        "InitiatorName": MPESA_B2C_INITIATOR_NAME,
        "SecurityCredential": MPESA_B2C_SECURITY_CREDENTIAL,
        "CommandID": "SalaryPayment",
        "Amount": amount,
        "PartyA": str(MPESA_B2C_SHORTCODE),
        "PartyB": phone_number,
        "Remarks": remarks,
        "QueueTimeOutURL": MPESA_B2C_TIMEOUT_URL,
        "ResultURL": MPESA_B2C_RESULT_URL,
        "Occasion": remarks
    }

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()

    except requests.exceptions.HTTPError:
        return {
            "error": "B2C request failed",
            "status_code": response.status_code,
            "response": response.text
        }
    except requests.exceptions.RequestException as e:
        return {
            "error": "Request exception",
            "details": str(e)
        }