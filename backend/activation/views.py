import logging
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import ActivationPayment

logger = logging.getLogger(__name__)


class InitiateActivationView(APIView):
    """
    DEPRECATED: Legacy activation endpoint.
    Users now auto-assign to Free tier post-onboarding.
    Redirects frontend to the new subscription selection flow.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        logger.info(f"Legacy activation requested by {user.email}. Redirecting to new flow.")
        return Response({
            'message': 'Upfront activation is no longer required. You are automatically on the Free plan.',
            'redirect_to': '/api/subscriptions/plans/',
            'note': 'Use /api/subscriptions/subscribe/ to upgrade to a paid tier.'
        }, status=status.HTTP_200_OK)


class SkipActivationView(APIView):
    """
    DEPRECATED: No longer blocks onboarding or main app access.
    Returns success for backward compatibility with legacy frontend builds.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        logger.info(f"Legacy skip activation called by {user.email}.")
        return Response({
            'message': 'Activation skipped. You are on the Free plan.',
            'current_tier': 'free',
            'note': 'Access is now subscription-based.'
        }, status=status.HTTP_200_OK)


class ActivationStatusView(APIView):
    """
    Returns legacy activation status for historical reference.
    Access control is now fully handled by the subscriptions app.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            payment = user.activation_payment
            data = {
                'legacy_activation_status': payment.status,
                'payment_date': payment.transaction_date.isoformat() if payment.transaction_date else None,
                'mpesa_receipt': payment.mpesa_receipt_number or None,
                'note': 'Active access is managed by subscriptions. Check /api/subscriptions/status/.'
            }
        except ActivationPayment.DoesNotExist:
            data = {
                'legacy_activation_status': 'not_initiated',
                'note': 'Active access is managed by subscriptions. Check /api/subscriptions/status/.'
            }
        return Response(data, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class DarajaCallbackView(APIView):
    """
    DEPRECATED: Legacy callback handler for KES 300 activation.
    New subscription payments use /api/subscriptions/callback/daraja/
    Kept active to safely acknowledge historical/legacy Daraja retries.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        checkout_id = data.get('Body', {}).get('stkCallback', {}).get('CheckoutRequestID', 'unknown')
        logger.warning(f"Legacy Daraja callback received (ID: {checkout_id}). "
                       f"New flow uses /api/subscriptions/callback/daraja/")
        # Return OK to prevent Daraja from retrying indefinitely
        return HttpResponse('OK')