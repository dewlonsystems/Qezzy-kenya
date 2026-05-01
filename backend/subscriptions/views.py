import logging
import uuid
from datetime import timedelta
from decimal import Decimal

from django.db import transaction, IntegrityError
from django.http import HttpResponse, HttpResponseForbidden
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.core.exceptions import ValidationError

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.exceptions import PermissionDenied, NotFound

from .models import (
    SubscriptionPlan,
    UserSubscription,
    SubscriptionTransaction,
    SubscriptionReceipt,
    SubscriptionEmailLog,
)
from .utils import (
    send_subscription_email,
    generate_receipt_pdf,
    get_active_subscription,
)
from .daraja import generate_stk_push, normalize_phone
from users.utils import send_welcome_aboard_email

logger = logging.getLogger(__name__)


class ListSubscriptionPlansView(APIView):
    """
    GET /api/subscriptions/plans/
    List all active subscription plans in tier order (Free → Elite).
    Public endpoint — no authentication required.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        plans = SubscriptionPlan.objects.filter(is_active=True).order_by('tier_level')
        data = []
        for plan in plans:
            data.append({
                'id': plan.id,
                'name': plan.get_name_display(),
                'tier_level': plan.tier_level,
                'price_kes': str(plan.price_kes),
                'duration_days': plan.duration_days,
                'description': plan.description,
                'features': plan.features,
                'is_free': plan.name == 'free',
            })
        return Response({'plans': data}, status=status.HTTP_200_OK)


class InitiateSubscriptionPaymentView(APIView):
    """
    POST /api/subscriptions/subscribe/
    Initiate STK Push for a subscription payment.

    Rules:
    - Free plan is activated immediately (no payment).
    - Paid plan: initiates M-Pesa STK Push. Package activates only on callback success.
    - Trial logic is fully removed. Free tier is the no-cost entry point.
    - A user CANNOT buy a paid plan they already have an active subscription for.
      They must wait for it to expire or cancel first.
    - A user CAN buy a different (higher/lower) paid plan at any time — payment
      confirms the switch and the old active sub is expired automatically in the callback.
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

        # --- Input validation ---
        if not plan_id:
            return Response({'error': 'plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not phone_number:
            return Response({'error': 'phone_number is required'}, status=status.HTTP_400_BAD_REQUEST)

        # --- Fetch plan ---
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Invalid or inactive subscription plan'}, status=status.HTTP_404_NOT_FOUND)

        # --- Free plan: activate immediately, no payment needed ---
        if plan.name == 'free':
            with transaction.atomic():
                # Expire any existing active subscription
                UserSubscription.objects.filter(
                    user=user, status='active'
                ).update(status='expired', updated_at=timezone.now())

                now = timezone.now()
                subscription = UserSubscription.objects.create(
                    user=user,
                    plan=plan,
                    status='active',
                    start_date=now,
                    end_date=now + timedelta(days=plan.duration_days),
                    is_trial=False,
                    auto_renew=False,
                )
                SubscriptionTransaction.objects.create(
                    user=user,
                    subscription=subscription,
                    amount=Decimal('0.00'),
                    checkout_request_id=f'FREE-{user.id}-{now.timestamp()}',
                    phone_number=normalize_phone(user.phone_number or phone_number),
                    status='completed',
                    transaction_date=now,
                )
            return Response({
                'message': 'Free plan activated successfully.',
                'subscription_id': subscription.id,
                'end_date': subscription.end_date.isoformat(),
            }, status=status.HTTP_201_CREATED)

        # --- Paid plan: guard against re-buying an already active plan ---
        current_sub = get_active_subscription(user)
        if current_sub and current_sub.plan_id == plan.id:
            days_left = max((current_sub.end_date - timezone.now()).days, 0)
            return Response(
                {
                    'error': (
                        f'You already have an active {plan.get_name_display()} subscription '
                        f'with {days_left} day(s) remaining. '
                        f'You can renew once it expires or switch to a different plan.'
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Normalize phone ---
        try:
            phone = normalize_phone(phone_number)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # --- Stale pending cleanup ---
        # Daraja STK Push expires after 5 minutes. Any pending transaction older
        # than that will never get a callback - auto-cancel it so it doesn't
        # permanently block the user from trying again.
        stk_window = timezone.now() - timedelta(minutes=5)
        stale_qs = SubscriptionTransaction.objects.filter(
            user=user,
            status='pending',
            subscription__plan=plan,
            created_at__lt=stk_window,
        ).select_related('subscription')

        for stale_tx in stale_qs:
            stale_tx.status = 'failed'
            stale_tx.error_message = 'STK Push window expired (5 min). Auto-cancelled.'
            stale_tx.save(update_fields=['status', 'error_message', 'updated_at'])
            if stale_tx.subscription.status == 'pending':
                stale_tx.subscription.status = 'cancelled'
                stale_tx.subscription.cancelled_at = timezone.now()
                stale_tx.subscription.save(update_fields=['status', 'cancelled_at', 'updated_at'])
            logger.info(f'Auto-expired stale pending transaction {stale_tx.id} for user {user.email}')

        # --- Idempotency ---
        # Only reuse a pending transaction if the STK Push was sent within the
        # active 5-minute Daraja window AND the real CheckoutRequestID is stored
        # (not the PINIT- placeholder which means the push never fired).
        existing_pending = SubscriptionTransaction.objects.filter(
            user=user,
            status='pending',
            subscription__plan=plan,
            subscription__status='pending',
            created_at__gte=stk_window,
        ).exclude(
            checkout_request_id__startswith='PINIT-'
        ).order_by('-created_at').first()

        if existing_pending:
            return Response({
                'message': 'A payment for this plan is already in progress. '
                           'Complete the STK Push prompt on your phone.',
                'checkout_request_id': existing_pending.checkout_request_id,
                'transaction_id': existing_pending.id,
            }, status=status.HTTP_200_OK)

        # --- Create pending subscription + transaction ---
        # checkout_request_id gets a unique temporary value so the unique=True
        # constraint never collides when two users pay simultaneously.
        # It is replaced with the real Daraja CheckoutRequestID immediately after
        # the STK Push succeeds.
        temp_checkout_id = f"PINIT-{uuid.uuid4().hex}"

        now = timezone.now()
        start_date = now
        end_date = now + timedelta(days=plan.duration_days)

        with transaction.atomic():
            pending_sub = UserSubscription.objects.create(
                user=user,
                plan=plan,
                status='pending',
                start_date=start_date,
                end_date=end_date,
                is_trial=False,
                auto_renew=True,
            )
            transaction_record = SubscriptionTransaction.objects.create(
                user=user,
                subscription=pending_sub,
                amount=plan.price_kes,
                phone_number=phone,
                status='pending',
                checkout_request_id=temp_checkout_id,   # replaced after STK response
            )

        # --- Initiate STK Push ---
        daraja_response = generate_stk_push(
            phone_number=phone,
            amount=int(plan.price_kes),
            account_reference=f"SUB-{pending_sub.id}",
            transaction_desc=f"{plan.get_name_display()} Subscription",
        )

        if 'error' in daraja_response or 'CheckoutRequestID' not in daraja_response:
            error_msg = daraja_response.get('error', 'Unknown Daraja error')
            logger.error(
                f"STK Push failed for user {user.email} (sub {pending_sub.id}): {error_msg}"
            )
            # Clean up the pending records so the user can try again
            with transaction.atomic():
                transaction_record.delete()
                pending_sub.delete()
            return Response(
                {'error': 'Failed to initiate payment. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        # --- Persist Daraja IDs ---
        transaction_record.checkout_request_id = daraja_response['CheckoutRequestID']
        transaction_record.merchant_request_id = daraja_response.get('MerchantRequestID', '')
        transaction_record.save()

        logger.info(
            f"STK Push initiated for user {user.email} "
            f"(sub {pending_sub.id}): {transaction_record.checkout_request_id}"
        )

        return Response({
            'message': 'STK Push sent. Complete the payment prompt on your phone.',
            'checkout_request_id': transaction_record.checkout_request_id,
            'transaction_id': transaction_record.id,
            'amount': str(plan.price_kes),
            'plan': plan.get_name_display(),
            'expires_in_minutes': 5,
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class SubscriptionCallbackView(APIView):
    """
    POST /api/subscriptions/callback/daraja/
    Daraja webhook callback handler.

    On successful payment:
      1. Marks the transaction as completed.
      2. Expires any other active subscription the user has (prevents UniqueConstraint violation).
      3. Activates the pending subscription.
      4. Generates a receipt and sends a welcome email if applicable.

    Idempotent: safe to receive duplicate callbacks.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data
        logger.info(f"Subscription Daraja callback received: {data}")

        try:
            result = data.get('Body', {}).get('stkCallback', {})
            checkout_id = result.get('CheckoutRequestID')
            result_code = result.get('ResultCode')

            if not checkout_id:
                logger.error("Missing CheckoutRequestID in subscription callback")
                return HttpResponse('ERROR', status=status.HTTP_400_BAD_REQUEST)

            # --- Lookup transaction ---
            try:
                transaction_record = SubscriptionTransaction.objects.select_related(
                    'subscription', 'subscription__plan', 'subscription__user'
                ).get(checkout_request_id=checkout_id)
            except SubscriptionTransaction.DoesNotExist:
                logger.warning(f"Callback for unknown CheckoutRequestID: {checkout_id}")
                return HttpResponse('OK')   # Acknowledge so Daraja stops retrying

            # --- Idempotency: already processed ---
            if transaction_record.status == 'completed':
                logger.info(f"Duplicate callback for completed transaction {checkout_id}")
                return HttpResponse('OK')

            subscription = transaction_record.subscription
            user = subscription.user

            # ----------------------------------------------------------------
            # PAYMENT SUCCESS
            # ----------------------------------------------------------------
            if result_code == 0:
                callback_metadata = result.get('CallbackMetadata', {}).get('Item', [])
                receipt_number = None
                trans_date = None

                for item in callback_metadata:
                    name = item.get('Name')
                    value = item.get('Value')
                    if name == 'MpesaReceiptNumber':
                        receipt_number = str(value)
                    elif name == 'TransactionDate':
                        trans_date = str(value)

                with transaction.atomic():
                    # 1. Mark transaction as completed
                    transaction_record.status = 'completed'
                    transaction_record.mpesa_receipt_number = receipt_number or ''
                    if trans_date:
                        from datetime import datetime
                        try:
                            transaction_record.transaction_date = datetime.strptime(
                                trans_date, '%Y%m%d%H%M%S'
                            )
                        except ValueError:
                            transaction_record.transaction_date = timezone.now()
                    else:
                        transaction_record.transaction_date = timezone.now()
                    transaction_record.save()

                    # 2. Expire any OTHER active subscription for this user.
                    #    This is the fix for the UniqueConstraint violation and ensures
                    #    the user is seamlessly moved from their old plan to the new one.
                    old_subs = UserSubscription.objects.filter(
                        user=user,
                        status='active',
                    ).exclude(id=subscription.id)

                    if old_subs.exists():
                        logger.info(
                            f"Expiring {old_subs.count()} old active subscription(s) "
                            f"for user {user.email} before activating sub {subscription.id}"
                        )
                        old_subs.update(status='expired', updated_at=timezone.now())

                    # 3. Activate the newly paid subscription
                    now = timezone.now()
                    subscription.status = 'active'
                    subscription.start_date = now
                    subscription.end_date = now + timedelta(days=subscription.plan.duration_days)
                    # Reset grace_end_date so the model.save() recalculates it
                    subscription.grace_end_date = None
                    subscription.save()

                    # 4. Generate PDF receipt (non-blocking: failure doesn't abort activation)
                    try:
                        pdf_buffer = generate_receipt_pdf(transaction_record)
                        SubscriptionReceipt.objects.create(
                            transaction=transaction_record,
                            pdf_file=pdf_buffer,
                        )
                    except Exception as e:
                        logger.error(
                            f"Failed to generate receipt for transaction {transaction_record.id}: {e}"
                        )

                    # 5. Welcome email on first paid purchase
                    has_paid_before = UserSubscription.objects.filter(
                        user=user,
                        is_trial=False,
                        status='active',
                    ).exclude(id=subscription.id).exists()

                    if not has_paid_before:
                        try:
                            send_welcome_aboard_email(user, subscription)
                        except Exception as e:
                            logger.warning(
                                f"Failed to send welcome email to {user.email}: {e}"
                            )

                logger.info(
                    f"Subscription {subscription.id} activated for user {user.email} "
                    f"(plan: {subscription.plan.get_name_display()}, "
                    f"expires: {subscription.end_date.date()})"
                )
                return HttpResponse('OK')

            # ----------------------------------------------------------------
            # PAYMENT FAILED
            # ----------------------------------------------------------------
            else:
                result_desc = result.get('ResultDesc', 'Unknown error')
                logger.warning(
                    f"STK failed for subscription {checkout_id}: {result_desc}"
                )

                with transaction.atomic():
                    transaction_record.status = 'failed'
                    transaction_record.error_message = result_desc
                    transaction_record.save()

                    # Cancel the pending subscription so the user can try again cleanly
                    if subscription.status == 'pending':
                        subscription.status = 'cancelled'
                        subscription.cancelled_at = timezone.now()
                        subscription.save()

                return HttpResponse('OK')

        except IntegrityError as e:
            logger.error(f"Database integrity error in callback: {str(e)}", exc_info=True)
            return HttpResponse('ERROR', status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            logger.error(f"Unexpected error in subscription callback: {str(e)}", exc_info=True)
            return HttpResponse('ERROR', status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UserSubscriptionStatusView(APIView):
    """
    GET /api/subscriptions/status/
    Return current active subscription details for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        subscription = get_active_subscription(user)

        if not subscription:
            # Also surface any pending subscription so the frontend can show
            # "payment in progress" rather than nothing.
            pending_sub = UserSubscription.objects.filter(
                user=user, status='pending'
            ).order_by('-created_at').first()

            if pending_sub:
                return Response({
                    'has_active_subscription': False,
                    'pending_payment': True,
                    'pending_plan': pending_sub.plan.get_name_display(),
                    'pending_since': pending_sub.created_at.isoformat(),
                    'current_tier': None,
                    'tier_level': 0,
                }, status=status.HTTP_200_OK)

            return Response({
                'has_active_subscription': False,
                'pending_payment': False,
                'current_tier': None,
                'tier_level': 0,
                'end_date': None,
                'grace_end_date': None,
                'is_trial': False,
                'auto_renew': False,
            }, status=status.HTTP_200_OK)

        now = timezone.now()
        return Response({
            'has_active_subscription': True,
            'pending_payment': False,
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
                subscription.grace_end_date.isoformat() if subscription.grace_end_date else None
            ),
            'is_trial': subscription.is_trial,
            'auto_renew': subscription.auto_renew,
            'can_access_tier': subscription.plan.tier_level,
            'days_remaining': max((subscription.end_date - now).days, 0),
        }, status=status.HTTP_200_OK)


class SubscriptionHistoryView(APIView):
    """
    GET /api/subscriptions/history/
    Return full payment and subscription history for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        subscriptions = UserSubscription.objects.filter(user=user).order_by('-start_date')
        subs_data = []
        for sub in subscriptions:
            from django.db.models import Sum
            subs_data.append({
                'id': sub.id,
                'plan_name': sub.plan.get_name_display(),
                'tier_level': sub.plan.tier_level,
                'status': sub.status,
                'start_date': sub.start_date.isoformat(),
                'end_date': sub.end_date.isoformat(),
                'is_trial': sub.is_trial,
                'amount_paid': str(
                    sub.transactions.filter(status='completed').aggregate(
                        total=Sum('amount')
                    )['total'] or Decimal('0.00')
                ),
            })

        transactions = SubscriptionTransaction.objects.filter(
            user=user
        ).select_related('subscription__plan').order_by('-created_at')
        tx_data = []
        for tx in transactions:
            tx_data.append({
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
                'receipt_available': hasattr(tx, 'receipt'),
            })

        return Response({
            'subscriptions': subs_data,
            'transactions': tx_data,
        }, status=status.HTTP_200_OK)


class ReceiptDownloadView(APIView):
    """
    GET /api/subscriptions/receipt/<transaction_id>/
    Download PDF receipt for a completed subscription transaction.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        user = request.user

        try:
            transaction_record = SubscriptionTransaction.objects.get(
                id=transaction_id,
                user=user,
                status='completed',
            )
        except SubscriptionTransaction.DoesNotExist:
            raise NotFound('Receipt not found or transaction not completed')

        try:
            receipt = transaction_record.receipt
        except SubscriptionReceipt.DoesNotExist:
            try:
                pdf_buffer = generate_receipt_pdf(transaction_record)
                receipt = SubscriptionReceipt.objects.create(
                    transaction=transaction_record,
                    pdf_file=pdf_buffer,
                )
            except Exception as e:
                logger.error(f"Failed to generate receipt on download: {e}")
                return Response(
                    {'error': 'Receipt generation failed. Contact support.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        receipt.increment_download()

        from django.http import FileResponse
        import io
        pdf_buffer = io.BytesIO(receipt.pdf_file.read())
        response = FileResponse(
            pdf_buffer,
            content_type='application/pdf',
            as_attachment=True,
            filename=f"Qezzy_Receipt_{receipt.receipt_number}.pdf",
        )
        return response


class UpgradeSubscriptionView(APIView):
    """
    POST /api/subscriptions/upgrade/
    Upgrade to a higher-tier plan. STK Push is initiated immediately;
    on payment confirmation the old plan is expired and the new one activated.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        new_plan_id = request.data.get('plan_id')
        phone_number = request.data.get('phone_number', '').strip()

        if not new_plan_id or not phone_number:
            return Response(
                {'error': 'plan_id and phone_number are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_plan = SubscriptionPlan.objects.get(id=new_plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Invalid plan'}, status=status.HTTP_404_NOT_FOUND)

        current_sub = get_active_subscription(user)
        if not current_sub:
            return Response(
                {'error': 'No active subscription to upgrade from.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_plan.tier_level <= current_sub.plan.tier_level:
            return Response(
                {'error': 'Can only upgrade to a higher-tier plan.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Guard: don't allow a duplicate pending upgrade
        pending_upgrade = UserSubscription.objects.filter(
            user=user,
            status='pending',
            upgraded_from=current_sub,
        ).exists()
        if pending_upgrade:
            return Response(
                {'error': 'Upgrade already pending. Complete the payment on your phone first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            phone = normalize_phone(phone_number)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Upgrade subscription starts NOW (immediate upgrade on payment).
        # The callback will expire the old sub and activate this one.
        now = timezone.now()
        start_date = now
        end_date = start_date + timedelta(days=new_plan.duration_days)

        temp_checkout_id = f"PINIT-{uuid.uuid4().hex}"

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
                checkout_request_id=temp_checkout_id,  # replaced after STK response
            )

        daraja_response = generate_stk_push(
            phone_number=phone,
            amount=int(new_plan.price_kes),
            account_reference=f"UPGRADE-{upgrade_sub.id}",
            transaction_desc=f"Upgrade to {new_plan.get_name_display()}",
        )

        if 'error' in daraja_response or 'CheckoutRequestID' not in daraja_response:
            error_msg = daraja_response.get('error', 'Unknown Daraja error')
            logger.error(f"Upgrade STK failed for user {user.email}: {error_msg}")
            with transaction.atomic():
                transaction_record.delete()
                upgrade_sub.delete()
            return Response(
                {'error': 'Failed to initiate upgrade payment. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        transaction_record.checkout_request_id = daraja_response['CheckoutRequestID']
        transaction_record.merchant_request_id = daraja_response.get('MerchantRequestID', '')
        transaction_record.save()

        logger.info(
            f"Upgrade STK initiated for user {user.email}: "
            f"{current_sub.plan.get_name_display()} → {new_plan.get_name_display()}"
        )

        return Response({
            'message': 'Upgrade payment initiated. Complete the prompt on your phone.',
            'checkout_request_id': transaction_record.checkout_request_id,
            'from_plan': current_sub.plan.get_name_display(),
            'to_plan': new_plan.get_name_display(),
            'amount': str(new_plan.price_kes),
            'effective_immediately_on_payment': True,
        }, status=status.HTTP_201_CREATED)


class CancelSubscriptionView(APIView):
    """
    POST /api/subscriptions/cancel/
    Cancel auto-renewal. Access continues until end of paid period.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        immediate = request.data.get('immediate', False)

        subscription = get_active_subscription(user)
        if not subscription:
            return Response(
                {'error': 'No active subscription to cancel.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if subscription.status == 'cancelled':
            return Response(
                {'message': 'Subscription is already cancelled.'},
                status=status.HTTP_200_OK,
            )

        subscription.cancel(immediate=immediate)

        if not immediate:
            try:
                send_subscription_email(
                    subscription=subscription,
                    email_type='cancelled_notice',
                    subject='Subscription Cancelled — Access Continues',
                    template_name='emails/subscription_cancelled.html',
                    context={
                        'end_date': subscription.end_date.strftime('%d %b %Y'),
                        'grace_end_date': (
                            subscription.grace_end_date.strftime('%d %b %Y')
                            if subscription.grace_end_date else None
                        ),
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to send cancellation email to {user.email}: {e}")

        return Response({
            'message': (
                'Subscription cancelled. Access continues until end of paid period.'
                if not immediate else
                'Subscription cancelled immediately.'
            ),
            'end_date': subscription.end_date.isoformat(),
            'grace_end_date': (
                subscription.grace_end_date.isoformat() if subscription.grace_end_date else None
            ),
        }, status=status.HTTP_200_OK)


class AdminSubscriptionActionView(APIView):
    """
    POST /api/subscriptions/admin/action/
    Admin-only: manually activate, extend, or revoke a user's subscription.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.is_staff:
            raise PermissionDenied('Staff access required')

        target_user_id = request.data.get('user_id')
        action = request.data.get('action')   # 'activate', 'extend', 'revoke'
        plan_id = request.data.get('plan_id')
        days = request.data.get('days', 30)

        if not target_user_id or not action:
            return Response(
                {'error': 'user_id and action are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            from django.apps import apps
            User = apps.get_model(settings.AUTH_USER_MODEL)
            target_user = User.objects.get(id=target_user_id)
        except Exception:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            if action == 'activate':
                if not plan_id:
                    return Response(
                        {'error': 'plan_id required for activate'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                try:
                    plan = SubscriptionPlan.objects.get(id=plan_id)
                except SubscriptionPlan.DoesNotExist:
                    return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

                # Expire any existing active sub
                UserSubscription.objects.filter(
                    user=target_user, status='active'
                ).update(status='expired', updated_at=timezone.now())

                now = timezone.now()
                subscription = UserSubscription.objects.create(
                    user=target_user,
                    plan=plan,
                    status='active',
                    start_date=now,
                    end_date=now + timedelta(days=plan.duration_days),
                    is_trial=False,
                    auto_renew=True,
                )
                SubscriptionTransaction.objects.create(
                    user=target_user,
                    subscription=subscription,
                    amount=Decimal('0.00'),
                    checkout_request_id=f'ADMIN-ACTIVATE-{subscription.id}',
                    phone_number=normalize_phone(
                        getattr(target_user, 'phone_number', None) or '254700000000'
                    ),
                    status='completed',
                    transaction_date=now,
                )
                return Response({
                    'message': f'{plan.get_name_display()} activated for {target_user.email}',
                    'subscription_id': subscription.id,
                    'end_date': subscription.end_date.isoformat(),
                }, status=status.HTTP_201_CREATED)

            elif action == 'extend':
                subscription = get_active_subscription(target_user)
                if not subscription:
                    return Response(
                        {'error': 'No active subscription to extend'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                subscription.extend(days=int(days))
                return Response({
                    'message': f'Subscription extended by {days} days',
                    'new_end_date': subscription.end_date.isoformat(),
                    'grace_end_date': (
                        subscription.grace_end_date.isoformat()
                        if subscription.grace_end_date else None
                    ),
                }, status=status.HTTP_200_OK)

            elif action == 'revoke':
                subscription = get_active_subscription(target_user)
                if not subscription:
                    return Response(
                        {'error': 'No active subscription to revoke'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                subscription.cancel(immediate=True)
                return Response({
                    'message': 'Subscription revoked immediately',
                    'revoked_at': subscription.cancelled_at.isoformat(),
                }, status=status.HTTP_200_OK)

            else:
                return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
            


class PaymentStatusView(APIView):
    """
    GET /api/subscriptions/payment-status/<transaction_id>/

    Frontend polls this after initiating an STK Push to find out whether
    the payment completed, is still pending, or failed.

    Returns a self-contained response the frontend can act on directly:
      - status: 'pending' | 'completed' | 'failed'
      - If completed: full subscription details so the frontend doesn't
        need a second call to /status/.
      - If pending + STK expired (> 5 min): auto-marks as failed so the
        user gets a clear error instead of polling forever.

    Poll interval recommendation: every 3 seconds, stop after 'completed'
    or 'failed', timeout client-side at ~3 minutes.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        user = request.user

        try:
            tx = SubscriptionTransaction.objects.select_related(
                'subscription', 'subscription__plan'
            ).get(id=transaction_id, user=user)
        except SubscriptionTransaction.DoesNotExist:
            raise NotFound('Payment transaction not found.')

        logger.info(
            f"PaymentStatusView: Found transaction {transaction_id} for user {user.email}. "
            f"Status: {tx.status}, Created: {tx.created_at}"
        )

        # ------------------------------------------------------------------
        # Auto-expire: if still pending and the 5-minute STK window has
        # passed, Daraja will never call back. Mark it failed now so the
        # frontend stops polling and shows the user a clear error.
        # ------------------------------------------------------------------
        if tx.status == 'pending':
            stk_expired = (timezone.now() - tx.created_at).total_seconds() > 300  # 5 min
            if stk_expired:
                with transaction.atomic():
                    tx.status = 'failed'
                    tx.error_message = 'STK Push timed out. No payment received within 5 minutes.'
                    tx.save(update_fields=['status', 'error_message', 'updated_at'])

                    sub = tx.subscription
                    if sub.status == 'pending':
                        sub.status = 'cancelled'
                        sub.cancelled_at = timezone.now()
                        sub.save(update_fields=['status', 'cancelled_at', 'updated_at'])

                logger.info(
                    f"PaymentStatusView auto-expired transaction {tx.id} "
                    f"for user {user.email} (STK window exceeded)"
                )

                return Response({
                    'transaction_id': tx.id,
                    'status': 'failed',
                    'reason': 'Payment was not completed within 5 minutes. Please try again.',
                    'subscription': None,
                }, status=status.HTTP_200_OK)

        # ------------------------------------------------------------------
        # Pending — still within the 5-minute window
        # ------------------------------------------------------------------
        if tx.status == 'pending':
            elapsed = int((timezone.now() - tx.created_at).total_seconds())
            return Response({
                'transaction_id': tx.id,
                'status': 'pending',
                'elapsed_seconds': elapsed,
                'expires_in_seconds': max(300 - elapsed, 0),
                'message': 'Waiting for M-Pesa payment confirmation.',
                'subscription': None,
            }, status=status.HTTP_200_OK)

        # ------------------------------------------------------------------
        # Completed — payment confirmed by Daraja callback
        # ------------------------------------------------------------------
        if tx.status == 'completed':
            sub = tx.subscription
            now = timezone.now()
            return Response({
                'transaction_id': tx.id,
                'status': 'completed',
                'mpesa_receipt': tx.mpesa_receipt_number or None,
                'amount': str(tx.amount),
                'transaction_date': tx.transaction_date.isoformat() if tx.transaction_date else None,
                'subscription': {
                    'id': sub.id,
                    'plan_name': sub.plan.get_name_display(),
                    'tier_level': sub.plan.tier_level,
                    'status': sub.status,
                    'start_date': sub.start_date.isoformat(),
                    'end_date': sub.end_date.isoformat(),
                    'days_remaining': max((sub.end_date - now).days, 0),
                    'features': sub.plan.features,
                },
            }, status=status.HTTP_200_OK)

        # ------------------------------------------------------------------
        # Failed — either Daraja reported failure or we auto-expired it
        # ------------------------------------------------------------------
        return Response({
            'transaction_id': tx.id,
            'status': 'failed',
            'reason': tx.error_message or 'Payment failed. Please try again.',
            'subscription': None,
        }, status=status.HTTP_200_OK)