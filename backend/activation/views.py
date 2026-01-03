import logging
from django.db import transaction
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ActivationPayment
from .daraja import generate_stk_push
from users.models import User
from referrals.models import ReferralTransaction
from wallets.utils import create_transaction

logger = logging.getLogger(__name__)

class InitiateActivationView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if user.is_active:
            return Response({'error': 'Account already active'}, status=400)

        if not user.is_onboarded:
            return Response({'error': 'Complete onboarding first'}, status=400)

        phone = request.data.get('phone_number', '').strip()
        if not phone:
            return Response({'error': 'Phone number required'}, status=400)

        # Create or get pending activation record
        payment, created = ActivationPayment.objects.get_or_create(
            user=user,
            defaults={'phone_number': phone, 'status': 'pending'}
        )
        if not created:
            if payment.status == 'completed':
                return Response({'error': 'Already paid'}, status=400)
            # Allow retry if failed or still pending

        # Generate unique account reference (e.g., user email)
        account_ref = user.email

        # Trigger STK push
        daraja_response = generate_stk_push(
            phone_number=phone,
            amount=300,
            account_reference=account_ref
        )

        if not daraja_response or 'CheckoutRequestID' not in daraja_response:
            return Response({'error': 'Failed to initiate payment'}, status=500)

        # Save Daraja IDs
        payment.checkout_request_id = daraja_response['CheckoutRequestID']
        payment.merchant_request_id = daraja_response.get('MerchantRequestID', '')
        payment.save()

        return Response({
            'message': 'STK Push sent',
            'checkout_request_id': payment.checkout_request_id
        })


@method_decorator(csrf_exempt, name='dispatch')
class DarajaCallbackView(APIView):
    """
    Receives async callback from Safaricom Daraja
    """
    def post(self, request):
        data = request.data
        logger.info(f"Daraja callback received: {data}")

        # Extract result
        try:
            result = data['Body']['stkCallback']
            checkout_id = result['CheckoutRequestID']
            result_code = result['ResultCode']

            if result_code == 0:
                # Success
                payment = ActivationPayment.objects.get(checkout_request_id=checkout_id)
                callback_metadata = result['CallbackMetadata']['Item']
                receipt = None
                trans_date = None

                for item in callback_metadata:
                    if item['Name'] == 'MpesaReceiptNumber':
                        receipt = item['Value']
                    elif item['Name'] == 'TransactionDate':
                        trans_date = item['Value']

                with transaction.atomic():
                    # Activate user
                    user = payment.user
                    user.is_active = True
                    user.save()

                    # Mark payment as completed
                    payment.status = 'completed'
                    payment.mpesa_receipt_number = receipt
                    if trans_date:
                        from datetime import datetime
                        payment.transaction_date = datetime.strptime(str(trans_date), '%Y%m%d%H%M%S')
                    payment.save()

                    # Record activation payment as debit in main wallet
                    create_transaction(
                        user=user,
                        wallet_type='main',
                        transaction_type='activation_payment',
                        amount=-300.00,  # Debit
                        description=f"Account activation payment (Receipt: {receipt})"
                    )

                    # Trigger referral reward if applicable
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

                            # Credit referrer's referral wallet
                            create_transaction(
                                user=user.referred_by,
                                wallet_type='referral',
                                transaction_type='referral_bonus',
                                amount=50.00,
                                description=f"Referral bonus for {user.email}"
                            )
                        except ReferralTransaction.DoesNotExist:
                            pass  # No pending reward

                return HttpResponse('OK')
            else:
                # Failure
                payment = ActivationPayment.objects.get(checkout_request_id=checkout_id)
                payment.status = 'failed'
                payment.save()
                return HttpResponse('OK')

        except Exception as e:
            logger.error(f"Daraja callback error: {str(e)}")
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
                'completed_at': payment.transaction_date.isoformat() if payment.transaction_date else None
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
        # Allow skip – no action needed; frontend handles redirect
        return Response({'message': 'Activation skipped'})