import logging
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
from activation.daraja import generate_stk_push, normalize_phone
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
                'trial_days': plan.trial_days,
                'description': plan.description,
                'features': plan.features,
                'is_free': plan.name == 'free',
            })
        return Response({'plans': data}, status=status.HTTP_200_OK)


class InitiateSubscriptionPaymentView(APIView):
    """
    POST /api/subscriptions/subscribe/
    Initiate STK Push for subscription payment.
    Requires authentication. Validates plan availability and user eligibility.
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
        use_trial = request.data.get('use_trial', False)

        # Validate inputs
        if not plan_id:
            return Response({'error': 'plan_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        if not phone_number:
            return Response({'error': 'phone_number is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Fetch plan
        try:
            plan = SubscriptionPlan.objects.get(id=plan_id, is_active=True)
        except SubscriptionPlan.DoesNotExist:
            return Response({'error': 'Invalid or inactive subscription plan'}, status=status.HTTP_404_NOT_FOUND)

        # Free plan: activate immediately without payment
        if plan.name == 'free':
            with transaction.atomic():
                # Cancel any existing active subscription first
                existing = UserSubscription.objects.filter(user=user, status='active').first()
                if existing:
                    existing.status = 'cancelled'
                    existing.cancelled_at = timezone.now()
                    existing.auto_renew = False
                    existing.save()

                # Create new free subscription
                now = timezone.now()
                end_date = now + timedelta(days=plan.duration_days)
                subscription = UserSubscription.objects.create(
                    user=user,
                    plan=plan,
                    status='active',
                    start_date=now,
                    end_date=end_date,
                    is_trial=False,
                    auto_renew=False,
                )
                # Log transaction as completed (zero amount)
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
                'message': 'Free plan activated successfully',
                'subscription_id': subscription.id,
                'end_date': subscription.end_date.isoformat()
            }, status=status.HTTP_201_CREATED)

        # Paid plan: validate trial eligibility
        if use_trial and plan.trial_days > 0:
            # Check if user already used trial for this plan
            used_trial = UserSubscription.objects.filter(
                user=user,
                plan=plan,
                is_trial=True
            ).exists()
            if used_trial:
                return Response(
                    {'error': 'Trial period already used for this plan'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif use_trial:
            return Response(
                {'error': 'Trial not available for this plan'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Normalize phone number
        try:
            phone = normalize_phone(phone_number)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Check for existing pending transaction for this user+plan
        existing_pending = SubscriptionTransaction.objects.filter(
            user=user,
            status='pending',
            subscription__plan=plan
        ).order_by('-created_at').first()

        if existing_pending:
            # Return existing checkout request to avoid duplicate STK pushes
            return Response({
                'message': 'Pending payment found. Complete existing STK Push.',
                'checkout_request_id': existing_pending.checkout_request_id,
                'transaction_id': existing_pending.id
            }, status=status.HTTP_200_OK)

        # Calculate billing details
        amount = plan.price_kes
        duration = plan.trial_days if use_trial else plan.duration_days
        is_trial = use_trial

        # Create subscription record (status=pending until payment confirmed)
        now = timezone.now()
        start_date = now
        end_date = now + timedelta(days=duration)

        with transaction.atomic():
            subscription = UserSubscription.objects.create(
                user=user,
                plan=plan,
                status='pending',
                start_date=start_date,
                end_date=end_date,
                is_trial=is_trial,
                auto_renew=True,
            )

            transaction_record = SubscriptionTransaction.objects.create(
                user=user,
                subscription=subscription,
                amount=amount,
                phone_number=phone,
                status='pending',
                checkout_request_id='',  # Will be updated after STK initiation
            )

        # Initiate STK Push using existing daraja utilities
        daraja_response = generate_stk_push(
            phone_number=phone,
            amount=int(amount),  # Daraja expects integer cents
            account_reference=f"SUB-{subscription.id}",
            transaction_desc=f"{plan.get_name_display()} Subscription"
        )

        if 'error' in daraja_response or 'CheckoutRequestID' not in daraja_response:
            error_msg = daraja_response.get('error', 'Unknown Daraja error')
            logger.error(f"STK Push failed for user {user.email} (sub {subscription.id}): {error_msg}")
            # Rollback: delete pending subscription and transaction
            subscription.delete()
            return Response(
                {'error': 'Failed to initiate payment. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Update transaction with Daraja IDs
        transaction_record.checkout_request_id = daraja_response['CheckoutRequestID']
        transaction_record.merchant_request_id = daraja_response.get('MerchantRequestID', '')
        transaction_record.save()

        logger.info(f"STK Push initiated for user {user.email} (sub {subscription.id}): {transaction_record.checkout_request_id}")

        return Response({
            'message': 'STK Push sent successfully. Complete payment on your phone.',
            'checkout_request_id': transaction_record.checkout_request_id,
            'transaction_id': transaction_record.id,
            'amount': str(amount),
            'plan': plan.get_name_display(),
            'is_trial': is_trial,
            'expires_in_minutes': 5  # STK Push timeout
        }, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name='dispatch')
class SubscriptionCallbackView(APIView):
    """
    POST /api/subscriptions/callback/daraja/
    Daraja webhook callback handler.
    Public endpoint (AllowAny) but validates payload signature implicitly via checkout_request_id.
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

            # Fetch transaction (idempotent lookup)
            try:
                transaction_record = SubscriptionTransaction.objects.get(
                    checkout_request_id=checkout_id
                )
            except SubscriptionTransaction.DoesNotExist:
                logger.warning(f"Callback for unknown CheckoutRequestID: {checkout_id}")
                return HttpResponse('OK')  # Acknowledge to prevent Daraja retries

            # Idempotency check: if already completed, just acknowledge
            if transaction_record.status == 'completed':
                logger.info(f"Duplicate callback for completed transaction {checkout_id}")
                return HttpResponse('OK')

            subscription = transaction_record.subscription
            user = subscription.user

            if result_code == 0:
                # Payment successful: extract metadata
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
                    # Update transaction
                    transaction_record.status = 'completed'
                    transaction_record.mpesa_receipt_number = receipt
                    if trans_date:
                        from datetime import datetime
                        transaction_record.transaction_date = datetime.strptime(trans_date, '%Y%m%d%H%M%S')
                    else:
                        transaction_record.transaction_date = timezone.now()
                    transaction_record.save()

                    # Activate subscription
                    subscription.status = 'active'
                    # If trial, set proper end_date (trial period from start)
                    if subscription.is_trial and subscription.plan.trial_days > 0:
                        subscription.end_date = subscription.start_date + timedelta(days=subscription.plan.trial_days)
                    subscription.save()

                    # Generate receipt
                    try:
                        pdf_buffer = generate_receipt_pdf(transaction_record)
                        SubscriptionReceipt.objects.create(
                            transaction=transaction_record,
                            pdf_file=pdf_buffer
                        )
                    except Exception as e:
                        logger.error(f"Failed to generate receipt for transaction {transaction_record.id}: {e}")
                        # Continue even if receipt generation fails

                    # Send welcome email if first paid subscription
                    if not subscription.is_trial:
                        has_paid_before = UserSubscription.objects.filter(
                            user=user,
                            is_trial=False,
                            status='active'
                        ).exclude(id=subscription.id).exists()
                        if not has_paid_before:
                            try:
                                send_welcome_aboard_email(user)
                            except Exception as e:
                                logger.warning(f"Failed to send welcome email to {user.email}: {e}")

                    # Log email reminder schedule (handled by celery task separately)
                    # Just mark that reminder is due 3 days before end_date

                logger.info(f"Subscription activated for user {user.email} (sub {subscription.id})")
                return HttpResponse('OK')

            else:
                # Payment failed
                result_desc = result.get('ResultDesc', 'Unknown error')
                logger.warning(f"STK failed for subscription {checkout_id}: {result_desc}")

                with transaction.atomic():
                    transaction_record.status = 'failed'
                    transaction_record.error_message = result_desc
                    transaction_record.save()

                    # Mark subscription as cancelled if payment failed
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
    Return current active subscription details for authenticated user.
    Includes grace period status and accessible tier level.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        subscription = get_active_subscription(user)

        if not subscription:
            return Response({
                'has_active_subscription': False,
                'current_tier': None,
                'tier_level': 0,  # Free tier default
                'end_date': None,
                'grace_end_date': None,
                'is_trial': False,
                'auto_renew': False,
            }, status=status.HTTP_200_OK)

        return Response({
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
            'grace_end_date': subscription.grace_end_date.isoformat() if subscription.grace_end_date else None,
            'is_trial': subscription.is_trial,
            'auto_renew': subscription.auto_renew,
            'can_access_tier': subscription.plan.tier_level,  # Helper for frontend
            'days_remaining': (subscription.end_date - timezone.now()).days if subscription.end_date > timezone.now() else 0,
        }, status=status.HTTP_200_OK)


class SubscriptionHistoryView(APIView):
    """
    GET /api/subscriptions/history/
    Return full payment and subscription history for authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Subscription history
        subscriptions = UserSubscription.objects.filter(user=user).order_by('-start_date')
        subs_data = []
        for sub in subscriptions:
            subs_data.append({
                'id': sub.id,
                'plan_name': sub.plan.get_name_display(),
                'tier_level': sub.plan.tier_level,
                'status': sub.status,
                'start_date': sub.start_date.isoformat(),
                'end_date': sub.end_date.isoformat(),
                'is_trial': sub.is_trial,
                'amount_paid': str(sub.transactions.filter(status='completed').aggregate(
                    total=models.Sum('amount')
                )['total'] or Decimal('0.00')),
            })

        # Transaction history
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
                'transaction_date': tx.transaction_date.isoformat() if tx.transaction_date else None,
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
    Requires ownership and completed status.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, transaction_id):
        user = request.user

        try:
            transaction_record = SubscriptionTransaction.objects.get(
                id=transaction_id,
                user=user,
                status='completed'
            )
        except SubscriptionTransaction.DoesNotExist:
            raise NotFound('Receipt not found or transaction not completed')

        try:
            receipt = transaction_record.receipt
        except SubscriptionReceipt.DoesNotExist:
            # Generate on-the-fly if missing (fallback)
            try:
                pdf_buffer = generate_receipt_pdf(transaction_record)
                receipt = SubscriptionReceipt.objects.create(
                    transaction=transaction_record,
                    pdf_file=pdf_buffer
                )
            except Exception as e:
                logger.error(f"Failed to generate receipt on download: {e}")
                return Response(
                    {'error': 'Receipt generation failed. Contact support.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        # Increment download count
        receipt.increment_download()

        # Return file response
        from django.http import FileResponse
        import io
        pdf_buffer = io.BytesIO(receipt.pdf_file.read())
        response = FileResponse(
            pdf_buffer,
            content_type='application/pdf',
            as_attachment=True,
            filename=f"Qezzy_Receipt_{receipt.receipt_number}.pdf"
        )
        return response


class UpgradeSubscriptionView(APIView):
    """
    POST /api/subscriptions/upgrade/
    Upgrade to a higher-tier plan. Change takes effect on next billing cycle.
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
                {'error': 'No active subscription to upgrade from'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate upgrade: new tier must be higher
        if new_plan.tier_level <= current_sub.plan.tier_level:
            return Response(
                {'error': 'Can only upgrade to a higher-tier plan'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for pending upgrade already
        pending_upgrade = UserSubscription.objects.filter(
            user=user,
            status='pending',
            upgraded_from=current_sub
        ).exists()
        if pending_upgrade:
            return Response(
                {'error': 'Upgrade already pending. Complete payment first.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Normalize phone
        try:
            phone = normalize_phone(phone_number)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Create pending upgrade subscription
        now = timezone.now()
        # New subscription starts when current one ends (cycle-aware)
        start_date = current_sub.end_date
        end_date = start_date + timedelta(days=new_plan.duration_days)

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
                checkout_request_id='',
            )

        # Initiate STK Push
        daraja_response = generate_stk_push(
            phone_number=phone,
            amount=int(new_plan.price_kes),
            account_reference=f"UPGRADE-{upgrade_sub.id}",
            transaction_desc=f"Upgrade to {new_plan.get_name_display()}"
        )

        if 'error' in daraja_response or 'CheckoutRequestID' not in daraja_response:
            error_msg = daraja_response.get('error', 'Unknown Daraja error')
            logger.error(f"Upgrade STK failed for user {user.email}: {error_msg}")
            upgrade_sub.delete()
            return Response(
                {'error': 'Failed to initiate upgrade payment'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        transaction_record.checkout_request_id = daraja_response['CheckoutRequestID']
        transaction_record.merchant_request_id = daraja_response.get('MerchantRequestID', '')
        transaction_record.save()

        return Response({
            'message': 'Upgrade payment initiated. Complete on your phone.',
            'checkout_request_id': transaction_record.checkout_request_id,
            'new_plan': new_plan.get_name_display(),
            'effective_date': start_date.isoformat(),  # When upgrade takes effect
            'amount': str(new_plan.price_kes),
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
                {'error': 'No active subscription to cancel'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if subscription.status == 'cancelled':
            return Response(
                {'message': 'Subscription already cancelled'},
                status=status.HTTP_200_OK
            )

        subscription.cancel(immediate=immediate)

        # Log cancellation email if not immediate (reminder that access continues)
        if not immediate:
            try:
                send_subscription_email(
                    subscription=subscription,
                    email_type='cancelled_notice',
                    subject='Subscription Cancelled — Access Continues',
                    template_name='emails/subscription_cancelled.html',
                    context={
                        'end_date': subscription.end_date.strftime('%d %b %Y'),
                        'grace_end_date': subscription.grace_end_date.strftime('%d %b %Y') if subscription.grace_end_date else None,
                    }
                )
            except Exception as e:
                logger.warning(f"Failed to send cancellation email to {user.email}: {e}")

        return Response({
            'message': 'Subscription cancelled. Access continues until end of paid period.' if not immediate else 'Subscription cancelled immediately.',
            'end_date': subscription.end_date.isoformat(),
            'grace_end_date': subscription.grace_end_date.isoformat() if subscription.grace_end_date else None,
        }, status=status.HTTP_200_OK)


class AdminSubscriptionActionView(APIView):
    """
    POST /api/subscriptions/admin/action/
    Admin-only: manually activate, extend, or revoke a user's subscription.
    Requires is_staff permission.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if not user.is_staff:
            raise PermissionDenied('Staff access required')

        target_user_id = request.data.get('user_id')
        action = request.data.get('action')  # 'activate', 'extend', 'revoke'
        plan_id = request.data.get('plan_id')  # for activate
        days = request.data.get('days', 30)  # for extend

        if not target_user_id or not action:
            return Response(
                {'error': 'user_id and action are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            target_user = settings.AUTH_USER_MODEL.split('.')[-1]
            from django.apps import apps
            User = apps.get_model(settings.AUTH_USER_MODEL)
            target_user = User.objects.get(id=target_user_id)
        except Exception:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            if action == 'activate':
                if not plan_id:
                    return Response({'error': 'plan_id required for activate'}, status=status.HTTP_400_BAD_REQUEST)
                try:
                    plan = SubscriptionPlan.objects.get(id=plan_id)
                except SubscriptionPlan.DoesNotExist:
                    return Response({'error': 'Plan not found'}, status=status.HTTP_404_NOT_FOUND)

                # Cancel existing active sub if any
                existing = UserSubscription.objects.filter(user=target_user, status='active').first()
                if existing:
                    existing.status = 'cancelled'
                    existing.cancelled_at = timezone.now()
                    existing.save()

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
                # Log as manual activation
                SubscriptionTransaction.objects.create(
                    user=target_user,
                    subscription=subscription,
                    amount=Decimal('0.00'),
                    checkout_request_id=f'ADMIN-ACTIVATE-{subscription.id}',
                    phone_number=normalize_phone(target_user.phone_number or '254700000000'),
                    status='completed',
                    transaction_date=now,
                )
                return Response({
                    'message': f'{plan.get_name_display()} activated for {target_user.email}',
                    'subscription_id': subscription.id,
                    'end_date': subscription.end_date.isoformat()
                }, status=status.HTTP_201_CREATED)

            elif action == 'extend':
                subscription = get_active_subscription(target_user)
                if not subscription:
                    return Response({'error': 'No active subscription to extend'}, status=status.HTTP_400_BAD_REQUEST)
                subscription.extend(days=int(days))
                return Response({
                    'message': f'Subscription extended by {days} days',
                    'new_end_date': subscription.end_date.isoformat(),
                    'grace_end_date': subscription.grace_end_date.isoformat() if subscription.grace_end_date else None
                }, status=status.HTTP_200_OK)

            elif action == 'revoke':
                subscription = get_active_subscription(target_user)
                if not subscription:
                    return Response({'error': 'No active subscription to revoke'}, status=status.HTTP_400_BAD_REQUEST)
                subscription.cancel(immediate=True)
                return Response({
                    'message': 'Subscription revoked immediately',
                    'revoked_at': subscription.cancelled_at.isoformat()
                }, status=status.HTTP_200_OK)

            else:
                return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)