import logging
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.html import strip_tags

from subscriptions.models import UserSubscription, SubscriptionEmailLog
from subscriptions.utils import send_subscription_email, process_daily_subscription_tasks

logger = logging.getLogger('subscriptions.management')


class Command(BaseCommand):
    help = 'Processes daily subscription expiry checks, reminders, and grace period updates.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate processing without sending emails or updating database.'
        )
        parser.add_argument(
            '--force-expiry',
            action='store_true',
            help='Force expire subscriptions past grace period regardless of email send status.'
        )

    def handle(self, *args, **options):
        verbosity = options.get('verbosity', 1)
        dry_run = options.get('dry_run', False)
        force_expiry = options.get('force_expiry', False)

        if dry_run:
            self.stdout.write(self.style.WARNING('⚠️  DRY RUN MODE: No database updates or emails will be sent.'))
            self.stdout.write()

        now = timezone.now()
        self.stdout.write(f'🕒 Starting daily subscription processor at {now.strftime("%Y-%m-%d %H:%M:%S %Z")}...')

        reminders_sent = 0
        grace_updated = 0
        errors = 0

        try:
            # ========================
            # 1. 3-DAY EXPIRY REMINDERS
            # ========================
            three_days_from_now = now + timedelta(days=3)
            upcoming_expiries = UserSubscription.objects.filter(
                status='active',
                end_date__gt=now,
                end_date__lte=three_days_from_now
            )

            for sub in upcoming_expiries:
                days_left = (sub.end_date - now).days
                if days_left != 3:
                    continue

                if dry_run:
                    self.stdout.write(f'  📧 [DRY] Would send 3-day reminder to {sub.user.email} ({sub.plan.get_name_display()})')
                    reminders_sent += 1
                    continue

                try:
                    success = send_subscription_email(
                        subscription=sub,
                        email_type='expiry_reminder_3day',
                        subject=f'Your {sub.plan.get_name_display()} Subscription Expires in 3 Days',
                        template_name='emails/subscription_expiry_reminder.html',
                        context={'days_remaining': 3}
                    )
                    if success:
                        reminders_sent += 1
                except Exception as e:
                    logger.error(f"Failed to send 3-day reminder for sub {sub.id}: {str(e)}")
                    errors += 1

            # ========================
            # 2. GRACE PERIOD & EXPIRY PROCESSING
            # ========================
            expired_candidates = UserSubscription.objects.filter(
                status='active',
                end_date__lt=now
            )

            for sub in expired_candidates:
                if sub.is_active_with_grace():
                    # Still in grace period: warn user
                    grace_days_left = (sub.grace_end_date - now).days if sub.grace_end_date else 0
                    if grace_days_left in (2, 1):
                        if dry_run:
                            self.stdout.write(f'  📧 [DRY] Would send grace warning ({grace_days_left} days) to {sub.user.email}')
                            grace_updated += 1
                            continue

                        try:
                            success = send_subscription_email(
                                subscription=sub,
                                email_type='grace_period_warning',
                                subject=f'Grace Period: {grace_days_left} Days Left to Renew',
                                template_name='emails/subscription_grace_warning.html',
                                context={'grace_days_remaining': grace_days_left}
                            )
                            if success:
                                grace_updated += 1
                        except Exception as e:
                            logger.error(f"Failed to send grace warning for sub {sub.id}: {str(e)}")
                            errors += 1
                else:
                    # Grace period fully over: expire
                    if dry_run:
                        self.stdout.write(f'  🔒 [DRY] Would expire subscription for {sub.user.email}')
                        grace_updated += 1
                        continue

                    try:
                        with transaction.atomic():
                            sub.status = 'expired'
                            sub.save(update_fields=['status', 'updated_at'])

                        send_subscription_email(
                            subscription=sub,
                            email_type='expired_notice',
                            subject='Your Qezzy Subscription Has Expired',
                            template_name='emails/subscription_expired_notice.html',
                            context={'plan_name': sub.plan.get_name_display()}
                        )
                        grace_updated += 1
                    except Exception as e:
                        logger.error(f"Failed to expire sub {sub.id}: {str(e)}")
                        errors += 1

        except Exception as e:
            self.stderr.write(self.style.ERROR(f'❌ Critical error in subscription processor: {str(e)}'))
            logger.exception('Critical failure in daily subscription processor')
            raise SystemExit(1)

        # ========================
        # SUMMARY OUTPUT
        # ========================
        self.stdout.write()
        self.stdout.write('📊 SUMMARY:')
        self.stdout.write(f'  ✅ Reminders sent: {reminders_sent}')
        self.stdout.write(f'  🔁 Grace/Expiry updated: {grace_updated}')
        self.stdout.write(f'  ⚠️  Errors: {errors}')
        
        if errors > 0:
            self.stdout.write(self.style.WARNING(f'⚠️  Completed with {errors} error(s). Check logs for details.'))
        else:
            self.stdout.write(self.style.SUCCESS('✅ Daily subscription processor completed successfully.'))