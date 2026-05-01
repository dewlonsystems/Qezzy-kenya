import logging
from datetime import datetime, timedelta
from decimal import Decimal

from django.apps import apps
from django.conf import settings
from django.db import IntegrityError, transaction
from django.db.models import Sum
from django.http import FileResponse, HttpResponse
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .daraja import generate_stk_push, normalize_phone
from .models import (
    SubscriptionPlan,
    SubscriptionReceipt,
    SubscriptionTransaction,
    UserSubscription,
)
from .utils import (
    generate_receipt_pdf,
    get_active_subscription,
    send_subscription_email,
)
from users.utils import send_welcome_aboard_email

logger = logging.getLogger(__name__)

# Safaricom's production IP ranges for Daraja callbacks.
# Add their sandbox IPs during development.
SAFARICOM_CALLBACK_IPS = getattr(
    settings,
    'SAFARICOM_CALLBACK_IPS',
    [
        '196.201.214.200', '196.201.214.206', '196.201.213.114',
        '196.201.214.207', '196.201.214.208', '196.201.213.44',
        '196.201.212.127', '196.201.212.138', '196.201.212.129',
        '196.201.212.136', '196.201.212.74', '196.201.212.69',
    ]
)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _get_client_ip(request) -> str:
    """Extract real IP from request, respecting X-Forwarded-For if set."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def _cancel_existing_active_subscription(user, reason: str = ''):
    """
    Cancel any existing active subscription for a user.
    Must be called inside an atomic block.
    Returns the cancelled subscription, or None.
    """
    existing = (
        UserSubscription.objects
        .select_for_update()
        .filter(user=user, status='active')
        .first()
    )
    if existing:
        existing.status = 'cancelled'
        existing.cancelled_at = timezone.now()
        existing.auto_renew = False
        existing.save()
        logger.info(
            f"Cancelled existing active subscription {existing.id} for user {user.email}. "
            f"Reason: {reason or 'plan change'}"
        )
    return existing


# ---------------------------------------------------------------------------
# Public views
# ---------------------------------------------------------------------------

class ListSubscriptionPlansView(APIView):
    """
    GET /api/subscriptions/plans/
    List all active subscription plans in tier order (Free → Elite).
    Public endpoint — no authentication required.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by('tier_level')
        data = [
            {
                'id': plan.id,
                'name': plan.get_name_display(),
                'tier_level': plan.tier_level,
                'price_kes': str(plan.price_kes),
                'duration_days': plan.duration_days,
                'trial_days': plan.trial_days,
                'description': plan.description,
                'features': plan.features,
                'is_free': plan.name == 'free',
            }
            for plan in plans
        ]
        return Response({'plans': data}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Payment initiation
# ---------------------------------------------------------------------------

class InitiateSubscriptionPaymentView(APIView):
    """
    POST /api/subscriptions/subscribe/
    Initiate STK Push for subscription payment.

    Flow:
        1. Validate plan & eligibility.
        2. For free plans: activate immediately.
        3. For paid plans: create pending subscription + temp transaction,
           then fire STK Push. Replace temp checkout ID with Daraja's ID.
        4. If STK Push fails: roll back subscription + transaction atomically.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        if not getattr(settings, 'PAYMENTS_ENABLED', True):
            return Response(
                {'error': 'Payments are temporarily disabled. Please try again later.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        plan_id = request.data.get('plan_id')
        phone_number = request.data.get('phone_number', '').strip()
        use_trial = bool(request.data.get('use_trial', False))

        if not plan_id:
            return Response({'error': 'plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not phone_number:
            return Response({'error': 'phone_number is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': 'Invalid or inactive subscription plan'},
                status=status.HTTP_404_NOT_FOUND
            )

        # ----------------------------------------------------------------
        # Free plan: activate immediately, no payment needed.
        # ----------------------------------------------------------------
        if plan.name == 'free':
            return self._activate_free_plan(user, plan, phone_number)

        # ----------------------------------------------------------------
        # Paid plan: validate trial eligibility.
        # ----------------------------------------------------------------
        if use_trial:
            if plan.trial_days <= 0:
                return Response(
                    {'error': 'Trial not available for this plan'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            already_trialled = UserSubscription.objects.filter(
                user=user, plan=plan, is_trial=True
            ).exists()
            if already_trialled:
                return Response(
                    {'error': 'Trial period already used for this plan'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # ----------------------------------------------------------------
        # Normalize phone number before doing anything else.
        # ----------------------------------------------------------------
        try:
            phone = normalize_phone(phone_number)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # ----------------------------------------------------------------
        # Idempotency: if a pending STK Push already exists for this
        # user+plan, return its checkout ID instead of firing a new one.
        # This prevents double-charges when users tap "Subscribe" twice.
        # ----------------------------------------------------------------
        existing_pending = (
            SubscriptionTransaction.objects
            .filter(
                user=user,
                status='pending',
                subscription__plan=plan,
                subscription__status='pending',
            )
            .exclude(checkout_request_id__startswith='TEMP-')  # Only real Daraja IDs
            .order_by('-created_at')
            .first()
        )
        if existing_pending:
            return Response(
                {
                    'message': 'Payment already pending. Complete the STK Push on your phone.',
                    'checkout_request_id': existing_pending.checkout_request_id,
                    'transaction_id': existing_pending.id,
                },
                status=status.HTTP_200_OK
            )

        # ----------------------------------------------------------------
        # Create pending subscription + transaction atomically.
        # Use select_for_update to prevent concurrent duplicate subscriptions.
        # ----------------------------------------------------------------
        now = timezone.now()
        duration = plan.trial_days if use_trial else plan.duration_days
        start_date = now
        end_date = now + timedelta(days=duration)

        try:
            with transaction.atomic():
                # Lock the user's active subs row to prevent race conditions.
                UserSubscription.objects.select_for_update().filter(
                    user=user, status='active'
                ).exists()  # Acquires the lock without fetching data unnecessarily.

                subscription = UserSubscription.objects.create(
                    user=user,
                    plan=plan,
                    status='pending',
                    start_date=start_date,
                    end_date=end_date,
                    is_trial=use_trial,
                    auto_renew=True,
                )
                # Use a unique temporary ID to satisfy the unique constraint.
                # This is replaced with the real Daraja ID after the STK call.
                transaction_record = SubscriptionTransaction.objects.create(
                    user=user,
                    subscription=subscription,
                    amount=plan.price_kes,
                    phone_number=phone,
                    status='pending',
                    checkout_request_id=SubscriptionTransaction.generate_temp_checkout_id(),
                )
        except IntegrityError as e:
            logger.error(f"DB error creating pending subscription for {user.email}: {e}")
            return Response(
                {'error': 'Could not initiate subscription. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ----------------------------------------------------------------
        # Initiate STK Push (outside the atomic block to avoid holding
        # DB locks during the network call).
        # ----------------------------------------------------------------
        daraja_response = generate_stk_push(
            phone_number=phone,
            amount=int(plan.price_kes),  # M-Pesa uses whole KES amounts (no cents).
            account_reference=f"SUB-{subscription.id}",
            transaction_desc=f"{plan.get_name_display()} Subscription"
        )

        if 'error' in daraja_response or 'CheckoutRequestID' not in daraja_response:
            error_msg = daraja_response.get('error', 'Unknown Daraja error')
            logger.error(
                f"STK Push failed for user {user.email} (sub {subscription.id}): {error_msg}"
            )
            # Roll back: delete the pending subscription (cascades to transaction).
            with transaction.atomic():
                subscription.delete()
            return Response(
                {'error': 'Failed to initiate payment. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ----------------------------------------------------------------
        # Update transaction with the real Daraja IDs.
        # ----------------------------------------------------------------
        transaction_record.checkout_request_id = daraja_response['CheckoutRequestID']
        transaction_record.merchant_request_id = daraja_response.get('MerchantRequestID', '')
        transaction_record.save()

        logger.info(
            f"STK Push initiated for user {user.email} "
            f"(sub {subscription.id}, tx {transaction_record.id}): "
            f"{transaction_record.checkout_request_id}"
        )

        return Response(
            {
                'message': 'STK Push sent. Complete payment on your phone.',
                'checkout_request_id': transaction_record.checkout_request_id,
                'transaction_id': transaction_record.id,
                'amount': str(plan.price_kes),
                'plan': plan.get_name_display(),
                'is_trial': use_trial,
                'expires_in_minutes': 5,  # Daraja STK Push timeout.
            },
            status=status.HTTP_201_CREATED
        )

    def _activate_free_plan(self, user, plan, phone_number):
        """
        Activate the free plan immediately without payment.
        Cancels any existing active subscription first.
        """
        try:
            phone = normalize_phone(phone_number)
        except ValueError:
            # For free plan, phone is non-critical; fall back gracefully.
            phone = normalize_phone(getattr(user, 'phone_number', None) or '254700000000')

        now = timezone.now()
        end_date = now + timedelta(days=plan.duration_days)

        with transaction.atomic():
            _cancel_existing_active_subscription(user, reason='switching to free plan')

            subscription = UserSubscription.objects.create(
                user=user,
                plan=plan,
                status='active',
                start_date=now,
                end_date=end_date,
                is_trial=False,
                auto_renew=False,
            )
            SubscriptionTransaction.objects.create(
                user=user,
                subscription=subscription,
                amount=Decimal('0.00'),
                checkout_request_id=f'FREE-{user.id}-{now.timestamp()}',
                phone_number=phone,
                status='completed',
                transaction_date=now,
            )

        logger.info(f"Free plan activated for user {user.email} (sub {subscription.id})")
        return Response(
            {
                'message': 'Free plan activated successfully.',
                'subscription_id': subscription.id,
                'end_date': subscription.end_date.isoformat(),
            },
            status=status.HTTP_201_CREATED
        )


# ---------------------------------------------------------------------------
# Daraja callback (webhook)
# ---------------------------------------------------------------------------

@method_decorator(csrf_exempt, name='dispatch')
class SubscriptionCallbackView(APIView):
    """
    POST /api/subscriptions/callback/daraja/
    Daraja STK Push result webhook.

    Security:
        - IP allowlist checked against SAFARICOM_CALLBACK_IPS.
        - Payload is matched to a known checkout_request_id (no spoofing
          without knowing a valid ID).
        - Idempotent: duplicate callbacks for the same checkout_request_id
          are acknowledged without re-processing.

    Contract with Daraja:
        Return HTTP 200 for ALL outcomes (success, failure, unknown).
        Non-200 causes Daraja to retry indefinitely.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # ------------------------------------------------------------------
        # IP allowlist — block callbacks from unknown sources.
        # ------------------------------------------------------------------
        if getattr(settings, 'ENFORCE_DARAJA_IP_ALLOWLIST', not settings.DEBUG):
            client_ip = _get_client_ip(request)
            if client_ip not in SAFARICOM_CALLBACK_IPS:
                logger.warning(f"Daraja callback rejected: unknown IP {client_ip}")
                return HttpResponse('FORBIDDEN', status=403)

        data = request.data
        logger.info(f"Daraja subscription callback received: {data}")

        try:
            result = data.get('Body', {}).get('stkCallback', {})
            checkout_id = result.get('CheckoutRequestID')
            result_code = result.get('ResultCode')

            if not checkout_id:
                logger.error("Daraja callback missing CheckoutRequestID")
                return HttpResponse('OK')  # Acknowledge to stop retries.

            # ------------------------------------------------------------------
            # Look up the transaction.
            # ------------------------------------------------------------------
            try:
                tx = SubscriptionTransaction.objects.select_related(
                    'subscription__plan', 'subscription__user'
                ).get(checkout_request_id=checkout_id)
            except SubscriptionTransaction.DoesNotExist:
                logger.warning(f"Callback for unknown CheckoutRequestID: {checkout_id}")
                return HttpResponse('OK')

            # ------------------------------------------------------------------
            # Idempotency: already processed.
            # ------------------------------------------------------------------
            if tx.status == 'completed':
                logger.info(f"Duplicate callback for completed tx {checkout_id}; ignoring.")
                return HttpResponse('OK')
            if tx.status == 'failed':
                logger.info(f"Duplicate callback for failed tx {checkout_id}; ignoring.")
                return HttpResponse('OK')

            subscription = tx.subscription
            user = subscription.user

            # ------------------------------------------------------------------
            # Payment successful.
            # ------------------------------------------------------------------
            if result_code == 0:
                return self._handle_payment_success(request, tx, subscription, user, result)

            # ------------------------------------------------------------------
            # Payment failed or cancelled by user.
            # ------------------------------------------------------------------
            else:
                return self._handle_payment_failure(tx, subscription, result)

        except Exception as e:
            logger.error(f"Unexpected error in Daraja callback: {e}", exc_info=True)
            # Return OK to stop Daraja retries; we log for manual resolution.
            return HttpResponse('OK')

    def _handle_payment_success(self, request, tx, subscription, user, result):
        """Process a successful STK Push result."""
        # Extract M-Pesa metadata from callback.
        callback_metadata = result.get('CallbackMetadata', {}).get('Item', [])
        mpesa_receipt = None
        trans_date_str = None

        for item in callback_metadata:
            name = item.get('Name')
            value = item.get('Value')
            if name == 'MpesaReceiptNumber':
                mpesa_receipt = str(value)
            elif name == 'TransactionDate':
                trans_date_str = str(value)

        try:
            trans_date = datetime.strptime(trans_date_str, '%Y%m%d%H%M%S') if trans_date_str else timezone.now()
        except ValueError:
            trans_date = timezone.now()

        with transaction.atomic():
            # ------------------------------------------------------------------
            # 1. Mark transaction as completed.
            # ------------------------------------------------------------------
            tx.status = 'completed'
            tx.mpesa_receipt_number = mpesa_receipt or ''
            tx.transaction_date = trans_date
            tx.save()

            # ------------------------------------------------------------------
            # 2. Cancel any currently active subscription (handles plan switches).
            # ------------------------------------------------------------------
            if not subscription.upgraded_from:
                # Regular subscription: cancel any existing active plan first.
                _cancel_existing_active_subscription(
                    user, reason=f'replaced by subscription {subscription.id}'
                )

            # ------------------------------------------------------------------
            # 3. Activate the subscription.
            # ------------------------------------------------------------------
            subscription.status = 'active'
            # Recalculate end_date for trials to be precise from activation time.
            if subscription.is_trial and subscription.plan.trial_days > 0:
                subscription.end_date = subscription.start_date + timedelta(
                    days=subscription.plan.trial_days
                )
            subscription.save()

            # ------------------------------------------------------------------
            # 4. Generate PDF receipt.
            # ------------------------------------------------------------------
            if not SubscriptionReceipt.objects.filter(transaction=tx).exists():
                try:
                    pdf_buffer = generate_receipt_pdf(tx)
                    SubscriptionReceipt.objects.create(
                        transaction=tx,
                        pdf_file=pdf_buffer,
                    )
                except Exception as e:
                    logger.error(f"Receipt generation failed for tx {tx.id}: {e}")
                    # Non-fatal: receipt can be generated on download.

            # ------------------------------------------------------------------
            # 5. Send welcome email on first paid subscription.
            # ------------------------------------------------------------------
            if not subscription.is_trial:
                has_paid_before = UserSubscription.objects.filter(
                    user=user,
                    is_trial=False,
                    status='active',
                ).exclude(id=subscription.id).exists()

                if not has_paid_before:
                    try:
                        send_welcome_aboard_email(user, subscription)
                    except Exception as e:
                        logger.warning(f"Welcome email failed for {user.email}: {e}")

        logger.info(
            f"Subscription {subscription.id} activated for {user.email} "
            f"(M-Pesa receipt: {mpesa_receipt})"
        )
        return HttpResponse('OK')

    def _handle_payment_failure(self, tx, subscription, result):
        """Process a failed or cancelled STK Push result."""
        result_desc = result.get('ResultDesc', 'Unknown error')
        logger.warning(
            f"STK Push failed for subscription {subscription.id}: {result_desc}"
        )

        with transaction.atomic():
            tx.status = 'failed'
            tx.error_message = result_desc
            tx.save()

            if subscription.status == 'pending':
                subscription.status = 'cancelled'
                subscription.cancelled_at = timezone.now()
                subscription.save()

        return HttpResponse('OK')


# ---------------------------------------------------------------------------
# User-facing subscription views
# ---------------------------------------------------------------------------

class UserSubscriptionStatusView(APIView):
    """
    GET /api/subscriptions/status/
    Return the current active subscription for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        subscription = get_active_subscription(user)

        if not subscription:
            return Response(
                {
                    'has_active_subscription': False,
                    'current_tier': 'free',
                    'tier_level': 0,
                    'end_date': None,
                    'grace_end_date': None,
                    'is_trial': False,
                    'auto_renew': False,
                },
                status=status.HTTP_200_OK
            )

        now = timezone.now()
        return Response(
            {
                'has_active_subscription': True,
                'subscription_id': subscription.id,
                'plan': {
                    'id': subscription.plan.id,
                    'name': subscription.plan.get_name_display(),
                    'tier_level': subscription.plan.tier_level,
                    'price_kes': str(subscription.plan.price_kes),
                    'features': subscription.plan.features,
                },
                'status': subscription.status,
                'start_date': subscription.start_date.isoformat(),
                'end_date': subscription.end_date.isoformat(),
                'grace_end_date': (
                    subscription.grace_end_date.isoformat()
                    if subscription.grace_end_date else None
                ),
                'is_trial': subscription.is_trial,
                'auto_renew': subscription.auto_renew,
                'can_access_tier': subscription.plan.tier_level,
                'days_remaining': subscription.days_remaining,
                'is_in_grace_period': (
                    subscription.end_date < now < (subscription.grace_end_date or subscription.end_date)
                ),
            },
            status=status.HTTP_200_OK
        )


class SubscriptionHistoryView(APIView):
    """
    GET /api/subscriptions/history/
    Return full subscription and payment history for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        subscriptions = (
            UserSubscription.objects
            .filter(user=user)
            .select_related('plan')
            .prefetch_related('transactions')
            .order_by('-start_date')
        )
        subs_data = []
        for sub in subscriptions:
            # Sum only completed transactions — Sum() returns None when no rows match.
            completed_total = (
                sub.transactions.filter(status='completed')
                .aggregate(total=Sum('amount'))['total']
                or Decimal('0.00')
            )
            subs_data.append(
                {
                    'id': sub.id,
                    'plan_name': sub.plan.get_name_display(),
                    'tier_level': sub.plan.tier_level,
                    'status': sub.status,
                    'start_date': sub.start_date.isoformat(),
                    'end_date': sub.end_date.isoformat(),
                    'is_trial': sub.is_trial,
                    'amount_paid': str(completed_total),
                }
            )

        transactions_qs = (
            SubscriptionTransaction.objects
            .filter(user=user)
            .select_related('subscription__plan')
            .order_by('-created_at')
        )
        tx_data = []
        for tx in transactions_qs:
            tx_data.append(
                {
                    'id': tx.id,
                    'subscription_id': tx.subscription.id,
                    'plan_name': tx.subscription.plan.get_name_display(),
                    'amount': str(tx.amount),
                    'currency': tx.currency,
                    'status': tx.status,
                    'mpesa_receipt': tx.mpesa_receipt_number or None,
                    'transaction_date': (
                        tx.transaction_date.isoformat() if tx.transaction_date else None
                    ),
                    'created_at': tx.created_at.isoformat(),
                    'receipt_available': SubscriptionReceipt.objects.filter(transaction=tx).exists(),
                }
            )

        return Response(
            {'subscriptions': subs_data, 'transactions': tx_data},
            status=status.HTTP_200_OK
        )


class ReceiptDownloadView(APIView):
    """
    GET /api/subscriptions/receipt/<transaction_id>/
    Download the PDF receipt for a completed transaction.
    Requires ownership and completed status.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        user = request.user

        try:
            tx = SubscriptionTransaction.objects.get(
                id=transaction_id,
                user=user,
                status='completed',
            )
        except SubscriptionTransaction.DoesNotExist:
            raise NotFound('Receipt not found or transaction not completed.')

        # Fetch or generate receipt on the fly.
        try:
            receipt = tx.receipt
        except SubscriptionReceipt.DoesNotExist:
            try:
                pdf_buffer = generate_receipt_pdf(tx)
                receipt = SubscriptionReceipt.objects.create(
                    transaction=tx,
                    pdf_file=pdf_buffer,
                )
            except Exception as e:
                logger.error(f"On-demand receipt generation failed for tx {tx.id}: {e}")
                return Response(
                    {'error': 'Receipt generation failed. Contact support.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        receipt.increment_download()

        import io
        pdf_buffer = io.BytesIO(receipt.pdf_file.read())
        return FileResponse(
            pdf_buffer,
            content_type='application/pdf',
            as_attachment=True,
            filename=f"Qezzy_Receipt_{receipt.receipt_number}.pdf",
        )


# ---------------------------------------------------------------------------
# Upgrade & cancellation
# ---------------------------------------------------------------------------

class UpgradeSubscriptionView(APIView):
    """
    POST /api/subscriptions/upgrade/
    Upgrade to a higher-tier plan.

    The upgrade subscription starts when the current subscription ends
    (next billing cycle). Payment is collected now via STK Push.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_plan_id = request.data.get('plan_id')
        phone_number = request.data.get('phone_number', '').strip()

        if not new_plan_id or not phone_number:
            return Response(
                {'error': 'plan_id and phone_number are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            new_plan = SubscriptionPlan.objects.get(id=new_plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Invalid plan'}, status=status.HTTP_404_NOT_FOUND)

        current_sub = get_active_subscription(user)
        if not current_sub:
            return Response(
                {'error': 'No active subscription to upgrade from. Subscribe first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if current_sub.status not in ('active',):
            return Response(
                {'error': 'Current subscription is not active. Cannot upgrade.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_plan.tier_level <= current_sub.plan.tier_level:
            return Response(
                {'error': 'Can only upgrade to a higher-tier plan.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for an already-pending upgrade from this subscription.
        pending_upgrade = UserSubscription.objects.filter(
            user=user,
            status='pending',
            upgraded_from=current_sub,
        ).exists()
        if pending_upgrade:
            return Response(
                {'error': 'An upgrade is already pending. Complete payment on your phone.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            phone = normalize_phone(phone_number)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Upgrade starts when the current plan ends.
        start_date = current_sub.end_date
        end_date = start_date + timedelta(days=new_plan.duration_days)

        try:
            with transaction.atomic():
                upgrade_sub = UserSubscription.objects.create(
                    user=user,
                    plan=new_plan,
                    status='pending',
                    start_date=start_date,
                    end_date=end_date,
                    is_trial=False,
                    auto_renew=True,
                    upgraded_from=current_sub,
                )
                transaction_record = SubscriptionTransaction.objects.create(
                    user=user,
                    subscription=upgrade_sub,
                    amount=new_plan.price_kes,
                    phone_number=phone,
                    status='pending',
                    checkout_request_id=SubscriptionTransaction.generate_temp_checkout_id(),
                )
        except IntegrityError as e:
            logger.error(f"DB error creating upgrade subscription for {user.email}: {e}")
            return Response(
                {'error': 'Could not initiate upgrade. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        daraja_response = generate_stk_push(
            phone_number=phone,
            amount=int(new_plan.price_kes),
            account_reference=f"UPGRADE-{upgrade_sub.id}",
            transaction_desc=f"Upgrade to {new_plan.get_name_display()}"
        )

        if 'error' in daraja_response or 'CheckoutRequestID' not in daraja_response:
            error_msg = daraja_response.get('error', 'Unknown Daraja error')
            logger.error(f"Upgrade STK failed for user {user.email}: {error_msg}")
            with transaction.atomic():
                upgrade_sub.delete()  # Cascades to transaction_record.
            return Response(
                {'error': 'Failed to initiate upgrade payment. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        transaction_record.checkout_request_id = daraja_response['CheckoutRequestID']
        transaction_record.merchant_request_id = daraja_response.get('MerchantRequestID', '')
        transaction_record.save()

        logger.info(
            f"Upgrade STK Push initiated for user {user.email}: "
            f"{current_sub.plan.get_name_display()} → {new_plan.get_name_display()}"
        )

        return Response(
            {
                'message': 'Upgrade payment initiated. Complete on your phone.',
                'checkout_request_id': transaction_record.checkout_request_id,
                'current_plan': current_sub.plan.get_name_display(),
                'new_plan': new_plan.get_name_display(),
                'effective_date': start_date.isoformat(),
                'amount': str(new_plan.price_kes),
            },
            status=status.HTTP_201_CREATED
        )


class CancelSubscriptionView(APIView):
    """
    POST /api/subscriptions/cancel/
    Cancel auto-renewal. Access continues until end of paid period + grace.

    The post_save signal on UserSubscription handles the cancellation email
    automatically — no need to send it here.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        immediate = bool(request.data.get('immediate', False))

        subscription = get_active_subscription(user)
        if not subscription:
            return Response(
                {'error': 'No active subscription to cancel.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if subscription.status == 'cancelled':
            return Response(
                {'message': 'Subscription is already cancelled.'},
                status=status.HTTP_200_OK
            )

        # cancel() is atomic and triggers the post_save signal for email.
        subscription.cancel(immediate=immediate)

        message = (
            'Subscription cancelled immediately.'
            if immediate
            else 'Subscription cancelled. Access continues until the end of your paid period.'
        )

        return Response(
            {
                'message': message,
                'end_date': subscription.end_date.isoformat(),
                'grace_end_date': (
                    subscription.grace_end_date.isoformat()
                    if subscription.grace_end_date else None
                ),
            },
            status=status.HTTP_200_OK
        )


# ---------------------------------------------------------------------------
# Admin actions
# ---------------------------------------------------------------------------

class AdminSubscriptionActionView(APIView):
    """
    POST /api/subscriptions/admin/action/
    Staff-only: manually activate, extend, or revoke a user's subscription.
    Requires is_staff. All actions are logged via the standard subscription audit trail.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            raise PermissionDenied('Staff access required.')

        target_user_id = request.data.get('user_id')
        action = request.data.get('action')   # 'activate' | 'extend' | 'revoke'
        plan_id = request.data.get('plan_id')  # Required for 'activate'
        days = request.data.get('days', 30)    # Used by 'extend'

        if not target_user_id or not action:
            return Response(
                {'error': 'user_id and action are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Resolve AUTH_USER_MODEL properly.
        try:
            User = apps.get_model(settings.AUTH_USER_MODEL)
            target_user = User.objects.get(id=target_user_id)
        except (LookupError, User.DoesNotExist):
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'activate':
            return self._admin_activate(request, target_user, plan_id)
        elif action == 'extend':
            return self._admin_extend(request, target_user, days)
        elif action == 'revoke':
            return self._admin_revoke(request, target_user)
        else:
            return Response(
                {'error': f"Invalid action '{action}'. Use: activate, extend, revoke."},
                status=status.HTTP_400_BAD_REQUEST
            )

    def _admin_activate(self, request, target_user, plan_id):
        if not plan_id:
            return Response(
                {'error': 'plan_id is required for activate'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        with transaction.atomic():
            _cancel_existing_active_subscription(
                target_user,
                reason=f'admin activation by {request.user.email}'
            )
            subscription = UserSubscription.objects.create(
                user=target_user,
                plan=plan,
                status='active',
                start_date=now,
                end_date=now + timedelta(days=plan.duration_days),
                is_trial=False,
                auto_renew=True,
            )
            phone = normalize_phone(
                getattr(target_user, 'phone_number', None) or '254700000000'
            )
            SubscriptionTransaction.objects.create(
                user=target_user,
                subscription=subscription,
                amount=Decimal('0.00'),
                checkout_request_id=f'ADMIN-ACTIVATE-{subscription.id}',
                phone_number=phone,
                status='completed',
                transaction_date=now,
            )

        logger.info(
            f"Admin {request.user.email} manually activated "
            f"{plan.get_name_display()} for {target_user.email} (sub {subscription.id})"
        )
        return Response(
            {
                'message': f'{plan.get_name_display()} activated for {target_user.email}.',
                'subscription_id': subscription.id,
                'end_date': subscription.end_date.isoformat(),
            },
            status=status.HTTP_201_CREATED
        )

    def _admin_extend(self, request, target_user, days):
        subscription = get_active_subscription(target_user)
        if not subscription:
            return Response(
                {'error': 'No active subscription to extend.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            days = int(days)
            if days <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response(
                {'error': 'days must be a positive integer'},
                status=status.HTTP_400_BAD_REQUEST
            )

        subscription.extend(days=days)
        logger.info(
            f"Admin {request.user.email} extended subscription {subscription.id} "
            f"for {target_user.email} by {days} days."
        )
        return Response(
            {
                'message': f'Subscription extended by {days} days.',
                'new_end_date': subscription.end_date.isoformat(),
                'grace_end_date': (
                    subscription.grace_end_date.isoformat()
                    if subscription.grace_end_date else None
                ),
            },
            status=status.HTTP_200_OK
        )

    def _admin_revoke(self, request, target_user):
        subscription = get_active_subscription(target_user)
        if not subscription:
            return Response(
                {'error': 'No active subscription to revoke.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        subscription.cancel(immediate=True)
        logger.info(
            f"Admin {request.user.email} revoked subscription {subscription.id} "
            f"for {target_user.email}."
        )
        return Response(
            {
                'message': 'Subscription revoked immediately.',
                'revoked_at': subscription.cancelled_at.isoformat(),
            },
            status=status.HTTP_200_OK
        )