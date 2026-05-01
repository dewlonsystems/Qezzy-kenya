import io
import logging
from datetime import timedelta, datetime
from decimal import Decimal

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .models import (
    UserSubscription,
    SubscriptionTransaction,
    SubscriptionReceipt,
    SubscriptionEmailLog,
    SubscriptionPlan,
)

logger = logging.getLogger(__name__)


# ========================
# ACCESS & TIER UTILITIES
# ========================

def get_active_subscription(user):
    """
    Return the user's currently active subscription (including grace period).
    Returns None if no active or grace-period subscription exists.
    """
    now = timezone.now()
    # Query active subscriptions first
    subs = UserSubscription.objects.filter(user=user, status='active').order_by('-start_date')
    for sub in subs:
        if sub.is_active_with_grace():
            return sub
    return None


def can_access_tier(user, target_tier_level: int) -> bool:
    """
    Check if a user's subscription grants access to a specific tier level.
    Free tier = 0. Higher tier_level = more access.
    """
    sub = get_active_subscription(user)
    if not sub:
        return target_tier_level == 0  # Only free tier accessible without subscription
    return sub.can_access_tier(target_tier_level)


def get_accessible_jobs_queryset(user, job_queryset):
    """
    Filter a Job queryset to only include items accessible by the user's subscription tier.
    Assumes jobs have a `tier_level` integer field.
    Usage: accessible_jobs = get_accessible_jobs_queryset(request.user, SurveyJob.objects.all())
    """
    sub = get_active_subscription(user)
    if not sub:
        return job_queryset.filter(tier_level=0)  # Free only
    return job_queryset.filter(tier_level__lte=sub.plan.tier_level)


# ========================
# EMAIL UTILITIES
# ========================

def _should_send_email(user, email_type: str) -> bool:
    """
    Determine if an email should be sent based on user preferences.
    Critical emails (grace/expired) bypass opt-outs but are still logged.
    """
    if email_type in ('grace_period_warning', 'expired_notice'):
        return True  # Always send critical access notices

    # Respect promotional opt-out for reminders & upgrades
    if hasattr(user, 'receive_promotional_emails') and not user.receive_promotional_emails:
        return False
    return True


def send_subscription_email(subscription: UserSubscription, email_type: str, subject: str, template_name: str, context: dict = None):
    """
    Send a subscription-related email, log it, and prevent duplicates within 1 hour.
    Mirrors the preference-respecting pattern in users/utils.py.
    """
    user = subscription.user
    context = context or {}

    if not _should_send_email(user, email_type):
        logger.info(f"Skipped {email_type} email for {user.email} (preference opt-out)")
        return False

    # Idempotency: check if already sent recently
    recent_log = SubscriptionEmailLog.objects.filter(
        subscription=subscription,
        email_type=email_type,
        sent_at__gte=timezone.now() - timedelta(hours=1)
    ).exists()
    if recent_log:
        logger.info(f"Duplicate {email_type} email suppressed for {user.email}")
        return False

    # Build context
    preferences_url = user.get_preferences_url() if hasattr(user, 'get_preferences_url') else None
    base_context = {
        'first_name': user.first_name.title() or 'User',
        'email': user.email,
        'plan_name': subscription.plan.get_name_display(),
        'amount': str(subscription.plan.price_kes),
        'duration_days': subscription.plan.duration_days,
        'next_billing_date': subscription.end_date.strftime('%d %b %Y') if subscription.end_date else 'N/A',
        'end_date': subscription.end_date.strftime('%d %b %Y') if subscription.end_date else 'N/A',
        'grace_end_date': subscription.grace_end_date.strftime('%d %b %Y') if subscription.grace_end_date else None,
        'features': subscription.plan.features,
        'max_reward': '500',
        'preferences_url': preferences_url,
        'unsubscribe_url': f"{preferences_url}?auto_unsubscribe=upgrade_updates" if preferences_url else None,
    }
    context.update(base_context)

    # Render templates
    html_content = render_to_string(template_name, context)
    text_content = strip_tags(html_content)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_content,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email]
    )
    msg.attach_alternative(html_content, "text/html")

    try:
        msg.send()
        # Log successful send
        SubscriptionEmailLog.objects.create(
            subscription=subscription,
            email_type=email_type,
            sent_at=timezone.now(),
            delivered=True,
            recipient_email=user.email
        )
        logger.info(f"Sent {email_type} email to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send {email_type} email to {user.email}: {str(e)}")
        SubscriptionEmailLog.objects.create(
            subscription=subscription,
            email_type=email_type,
            sent_at=timezone.now(),
            delivered=False,
            error_message=str(e),
            recipient_email=user.email
        )
        return False


# ========================
# PDF RECEIPT GENERATOR
# ========================

def generate_receipt_pdf(transaction: SubscriptionTransaction) -> io.BytesIO:
    """
    Generate a clean, professional PDF receipt for a completed subscription transaction.
    Returns an io.BytesIO buffer ready for Django FileField storage.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
    elements = []
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle('ReceiptTitle', parent=styles['Title'], fontSize=18, textColor=colors.HexColor('#8B5E00'), spaceAfter=10)
    subtitle_style = ParagraphStyle('SubTitle', parent=styles['Normal'], fontSize=12, textColor=colors.gray, spaceAfter=15)
    label_style = ParagraphStyle('Label', parent=styles['Normal'], fontSize=10, textColor=colors.gray)
    value_style = ParagraphStyle('Value', parent=styles['Normal'], fontSize=11, textColor=colors.black)
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, textColor=colors.gray, alignment=1)

    # Header
    elements.append(Paragraph('Qezzy Kenya', title_style))
    elements.append(Paragraph('Subscription Payment Receipt', subtitle_style))

    # Transaction Details Table
    data = [
        [Paragraph('Receipt Number', label_style), Paragraph(transaction.receipt.receipt_number, value_style)] if hasattr(transaction, 'receipt') else ['Receipt Number', 'PENDING'],
        [Paragraph('Date', label_style), Paragraph(transaction.transaction_date.strftime('%d %b %Y, %H:%M'), value_style) if transaction.transaction_date else ['Date', 'Pending']],
        [Paragraph('Plan', label_style), Paragraph(transaction.subscription.plan.get_name_display(), value_style)],
        [Paragraph('Amount', label_style), Paragraph(f'KES {transaction.amount:.2f}', value_style)],
        [Paragraph('M-Pesa Reference', label_style), Paragraph(transaction.mpesa_receipt_number or 'N/A', value_style)],
        [Paragraph('Status', label_style), Paragraph(transaction.status.upper(), value_style)],
    ]

    table = Table(data, colWidths=[60*mm, 100*mm])
    table.setStyle(TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f9f9f9')),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(table)
    elements.append(Spacer(1, 20))

    # Footer
    elements.append(Paragraph('Thank you for your payment. This receipt serves as proof of subscription activation.', styles['Italic']))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph('© Qezzy Kenya • www.qezzykenya.company • Support: support@qezzykenya.company', footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer


# ========================
# DAILY EXPIRY PROCESSOR
# ========================

def process_daily_subscription_tasks():
    """
    Run this function daily via cron, Celery beat, or django-q.
    Handles:
      1. Sending 3-day expiry reminders
      2. Sending grace period warnings (day 1 & 2 after expiry)
      3. Updating expired subscriptions status
    """
    now = timezone.now()
    tomorrow = now + timedelta(days=1)

    # 1. 3-Day Expiry Reminders
    subscriptions_expiring_soon = UserSubscription.objects.filter(
        status='active',
        end_date__gt=now,
        end_date__lte=tomorrow + timedelta(days=3)
    )
    for sub in subscriptions_expiring_soon:
        days_left = (sub.end_date - now).days
        if days_left == 3:
            send_subscription_email(
                subscription=sub,
                email_type='expiry_reminder_3day',
                subject=f'Your {sub.plan.get_name_display()} Subscription Expires in 3 Days',
                template_name='emails/subscription_expiry_reminder.html',
                context={'days_remaining': 3}
            )

    # 2. Grace Period Warnings & Status Updates
    expired_subscriptions = UserSubscription.objects.filter(
        status='active',
        end_date__lt=now
    )
    for sub in expired_subscriptions:
        if sub.is_active_with_grace():
            # Still in grace period: warn user
            grace_days_left = (sub.grace_end_date - now).days if sub.grace_end_date else 0
            if grace_days_left in (2, 1):
                send_subscription_email(
                    subscription=sub,
                    email_type='grace_period_warning',
                    subject=f'Grace Period: {grace_days_left} Days Left to Renew',
                    template_name='emails/subscription_grace_warning.html',
                    context={'grace_days_remaining': grace_days_left}
                )
        else:
            # Grace period fully over: expire and restrict
            with transaction.atomic():
                sub.status = 'expired'
                sub.save()
                send_subscription_email(
                    subscription=sub,
                    email_type='expired_notice',
                    subject='Your Qezzy Subscription Has Expired',
                    template_name='emails/subscription_expired_notice.html',
                    context={'plan_name': sub.plan.get_name_display()}
                )

    logger.info(f"Processed {len(subscriptions_expiring_soon)} upcoming expiries, {len(expired_subscriptions)} grace/expired updates.")
    return {
        'reminders_sent': len(subscriptions_expiring_soon),
        'grace_updated': len(expired_subscriptions)
    }

