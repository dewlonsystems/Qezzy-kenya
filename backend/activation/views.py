# activation/views.py
import logging
from django.db import transaction
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import ActivationPayment
from .daraja import generate_stk_push, normalize_phone
from users.models import User
from referrals.models import ReferralTransaction
from wallets.utils import create_transaction
from django.conf import settings
from users.utils import send_welcome_aboard_email

logger = logging.getLogger(__name__)


class InitiateActivationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not getattr(settings, 'PAYMENTS_ENABLED', True):
            return Response({'error': 'Payments are temporarily disabled. Please try again later, or contact admin for manual account activation.'}, status=503)       

        if user.is_active:
            return Response({'error': 'Account already active'}, status=400)

        if not user.is_onboarded:
            return Response({'error': 'Complete onboarding first'}, status=400)

        raw_phone = request.data.get('phone_number', '').strip()
        if not raw_phone:
            return Response({'error': 'Phone number required'}, status=400)

        try:
            phone = normalize_phone(raw_phone)
        except ValueError as e:
            return Response({'error': str(e)}, status=400)

        existing_payment = ActivationPayment.objects.filter(user=user).first()
        if existing_payment:
            if existing_payment.status == 'completed':
                return Response({'error': 'Activation already paid'}, status=400)
            if existing_payment.status == 'pending':
                logger.info(f"Retrying STK for user {user.email} with existing pending payment")

        payment, created = ActivationPayment.objects.get_or_create(
            user=user,
            defaults={
                'phone_number': phone,
                'status': 'pending',
                'amount': 300.00
            }
        )
        if not created:
            payment.phone_number = phone
            payment.status = 'pending'
            payment.save()

        daraja_response = generate_stk_push(
            phone_number=phone,
            amount=300,
            account_reference=user.email
        )

        if 'error' in daraja_response or 'CheckoutRequestID' not in daraja_response:
            error_msg = daraja_response.get('error', 'Unknown Daraja error')
            logger.error(f"STK Push failed for {user.email}: {error_msg}")
            return Response({'error': 'Failed to initiate payment'}, status=500)

        payment.checkout_request_id = daraja_response['CheckoutRequestID']
        payment.merchant_request_id = daraja_response.get('MerchantRequestID', '')
        payment.save()

        return Response({
            'message': 'STK Push sent successfully',
            'checkout_request_id': payment.checkout_request_id
        })


@method_decorator(csrf_exempt, name='dispatch')
class DarajaCallbackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        logger.info(f"Daraja callback received: {data}")

        try:
            result = data.get('Body', {}).get('stkCallback', {})
            checkout_id = result.get('CheckoutRequestID')
            result_code = result.get('ResultCode')

            if not checkout_id:
                logger.error("Missing CheckoutRequestID in callback")
                return HttpResponse('ERROR', status=400)

            payment = ActivationPayment.objects.get(checkout_request_id=checkout_id)

            if result_code == 0:
                callback_metadata = result.get('CallbackMetadata', {}).get('Item', [])
                receipt = None
                trans_date = None

                for item in callback_metadata:
                    name = item.get('Name')
                    value = item.get('Value')
                    if name == 'MpesaReceiptNumber':
                        receipt = str(value)
                    elif name == 'TransactionDate':
                        trans_date = str(value)

                with transaction.atomic():
                    user = payment.user
                    user.is_active = True
                    user.save()

                    try:
                        send_welcome_aboard_email(user)
                    except Exception as e:
                        logger.warning(f"Failed to send welcome aboard email to {user.email}: {e}")

                    payment.status = 'completed'
                    payment.mpesa_receipt_number = receipt
                    if trans_date:
                        from datetime import datetime
                        payment.transaction_date = datetime.strptime(trans_date, '%Y%m%d%H%M%S')
                    payment.save()                    
                   
                    if user.referred_by:
                        try:
                            ref_trans = ReferralTransaction.objects.get(
                                referrer=user.referred_by,
                                referred_user=user,
                                status='pending'
                            )
                            ref_trans.status = 'completed'
                            ref_trans.completed_at = payment.transaction_date or payment.updated_at
                            ref_trans.save()

                            create_transaction(
                                user=user.referred_by,
                                wallet_type='referral',
                                transaction_type='referral_bonus',
                                amount=50.00,
                                status='completed',
                                description=f"Referral bonus for {user.email}"
                            )
                        except ReferralTransaction.DoesNotExist:
                            pass

                return HttpResponse('OK')

            else:
                result_desc = result.get('ResultDesc', 'Unknown error')
                logger.warning(f"STK failed for {checkout_id}: {result_desc}")
                payment.status = 'failed'
                payment.save()
                return HttpResponse('OK')

        except ActivationPayment.DoesNotExist:
            logger.error(f"Callback for unknown CheckoutRequestID: {checkout_id}")
            return HttpResponse('OK')
        except Exception as e:
            logger.error(f"Unexpected error in Daraja callback: {str(e)}", exc_info=True)
            return HttpResponse('ERROR', status=500)


class ActivationStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            payment = user.activation_payment
            data = {
                'is_active': user.is_active,
                'payment_status': payment.status,
                'created_at': payment.created_at.isoformat(),
                'completed_at': payment.transaction_date.isoformat() if payment.transaction_date else None,
                'receipt': payment.mpesa_receipt_number or None
            }
        except ActivationPayment.DoesNotExist:
            data = {
                'is_active': user.is_active,
                'payment_status': 'not_initiated'
            }
        return Response(data)


class SkipActivationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.is_active:
            return Response({'error': 'Already active'}, status=400)
        return Response({'message': 'Activation skipped'})