"""
Management command: process_subscriptions

Run daily (or more frequently) to:
    1. Send 7-day expiry reminders.
    2. Send 3-day expiry reminders.
    3. Warn users whose subscriptions are in the grace period.
    4. Expire subscriptions whose grace period has ended.

Usage:
    python manage.py process_subscriptions
    python manage.py process_subscriptions --dry-run
    python manage.py process_subscriptions --force-expiry

Cron example (runs at 08:00 EAT every day):
    0 5 * * * /path/to/venv/bin/python /path/to/manage.py process_subscriptions >> /var/log/qezzy/subs.log 2>&1
"""

import logging

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from subscriptions.models import SubscriptionEmailLog, UserSubscription
from subscriptions.utils import send_subscription_email

from datetime import timedelta

logger = logging.getLogger('subscriptions.management')


class Command(BaseCommand):
    help = (
        'Process daily subscription lifecycle events: '
        'expiry reminders, grace period warnings, and subscription expiry.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Simulate all processing without sending emails or writing to the database.',
        )
        parser.add_argument(
            '--force-expiry',
            action='store_true',
            help=(
                'Expire all subscriptions past their end_date, '
                'bypassing the grace period. Use with caution.'
            ),
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force_expiry = options['force_expiry']

        now = timezone.now()
        counters = {'reminders_7day': 0, 'reminders_3day': 0, 'grace_warnings': 0, 'expired': 0, 'errors': 0}

        if dry_run:
            self.stdout.write(self.style.WARNING(
                'DRY RUN: No emails will be sent and no database changes will be made.'
            ))

        self.stdout.write(
            f'Starting subscription processor at {now.strftime("%Y-%m-%d %H:%M:%S %Z")}'
        )

        try:
            self._send_expiry_reminders(now, dry_run, counters)
            self._process_grace_and_expiry(now, dry_run, force_expiry, counters)
        except Exception as e:
            logger.exception('Critical failure in process_subscriptions command.')
            raise CommandError(f'Critical error: {e}') from e

        self._print_summary(counters, dry_run)

        if counters['errors'] > 0:
            raise CommandError(
                f"Completed with {counters['errors']} error(s). Check logs for details."
            )

    # ------------------------------------------------------------------
    # Step 1: Expiry reminders (7-day and 3-day)
    # ------------------------------------------------------------------

    def _send_expiry_reminders(self, now, dry_run, counters):
        """
        Send reminders to users whose subscription expires in exactly 7 or 3 days.

        Uses a date-window query (not a .days equality check) so that the exact
        time the command runs doesn't cause reminders to be missed. Deduplication
        via SubscriptionEmailLog.already_sent() prevents double-sending when the
        command is re-run or a cron fires twice.
        """
        for days_ahead, email_type, label in [
            (7, 'expiry_reminder_7day', '7-day'),
            (3, 'expiry_reminder_3day', '3-day'),
        ]:
            # Window: subscriptions expiring between `days_ahead` and `days_ahead+1`
            # days from now. Using a 24-hour window makes this robust to cron timing.
            window_start = now + timedelta(days=days_ahead)
            window_end = now + timedelta(days=days_ahead + 1)

            upcoming = (
                UserSubscription.objects
                .filter(
                    status='active',
                    end_date__gte=window_start,
                    end_date__lt=window_end,
                )
                .select_related('user', 'plan')
                .iterator()  # Stream results to avoid loading all into memory.
            )

            counter_key = f'reminders_{days_ahead}day'

            for sub in upcoming:
                if SubscriptionEmailLog.already_sent(sub, email_type, within_hours=20):
                    # Already sent today — skip (handles cron re-runs and duplicate triggers).
                    logger.debug(f'Skipping {label} reminder for sub {sub.id}: already sent.')
                    continue

                if dry_run:
                    self.stdout.write(
                        f'  [DRY] Would send {label} reminder to {sub.user.email} '
                        f'({sub.plan.get_name_display()}, '
                        f'expires {sub.end_date.strftime("%Y-%m-%d")})'
                    )
                    counters[counter_key] += 1
                    continue

                try:
                    send_subscription_email(
                        subscription=sub,
                        email_type=email_type,
                        subject=f'Your {sub.plan.get_name_display()} Subscription Expires in {days_ahead} Days',
                        template_name='emails/subscription_expiry_reminder.html',
                        context={
                            'days_remaining': days_ahead,
                            'end_date': sub.end_date.strftime('%d %b %Y'),
                            'plan_name': sub.plan.get_name_display(),
                        }
                    )
                    counters[counter_key] += 1
                    logger.info(f'Sent {label} reminder for sub {sub.id} ({sub.user.email})')
                except Exception as e:
                    logger.error(f'Failed to send {label} reminder for sub {sub.id}: {e}')
                    counters['errors'] += 1

    # ------------------------------------------------------------------
    # Step 2: Grace period warnings and subscription expiry
    # ------------------------------------------------------------------

    def _process_grace_and_expiry(self, now, dry_run, force_expiry, counters):
        """
        For all active subscriptions whose end_date has passed:
          - If still in grace period: send a grace period warning.
          - If grace period is over (or force_expiry is set): expire the subscription.

        Expiry is handled by calling sub.mark_expired(), which triggers the
        post_save signal. The signal then sends the expired_notice email —
        we do NOT send it here to avoid double-sending.
        """
        expired_candidates = (
            UserSubscription.objects
            .filter(
                status='active',
                end_date__lt=now,
            )
            .select_related('user', 'plan')
            .iterator()
        )

        for sub in expired_candidates:
            in_grace = sub.is_within_access_window() and sub.end_date < now

            if in_grace and not force_expiry:
                self._handle_grace_period_warning(sub, now, dry_run, counters)
            else:
                self._expire_subscription(sub, dry_run, counters)

    def _handle_grace_period_warning(self, sub, now, dry_run, counters):
        """Send a grace period warning if one hasn't been sent recently."""
        grace_end = sub.grace_end_date
        if not grace_end:
            return

        grace_days_left = max(0, (grace_end - now).days)

        # Only warn on specific days remaining (avoids spamming on every run).
        if grace_days_left not in (2, 1):
            return

        if SubscriptionEmailLog.already_sent(sub, 'grace_period_warning', within_hours=20):
            logger.debug(f'Skipping grace warning for sub {sub.id}: already sent today.')
            return

        if dry_run:
            self.stdout.write(
                f'  [DRY] Would send grace warning ({grace_days_left}d left) '
                f'to {sub.user.email}'
            )
            counters['grace_warnings'] += 1
            return

        try:
            send_subscription_email(
                subscription=sub,
                email_type='grace_period_warning',
                subject=f'Grace Period: {grace_days_left} Day{"s" if grace_days_left != 1 else ""} Left to Renew',
                template_name='emails/subscription_grace_warning.html',
                context={
                    'grace_days_remaining': grace_days_left,
                    'grace_end_date': grace_end.strftime('%d %b %Y'),
                    'plan_name': sub.plan.get_name_display(),
                }
            )
            counters['grace_warnings'] += 1
            logger.info(f'Sent grace warning for sub {sub.id} ({sub.user.email})')
        except Exception as e:
            logger.error(f'Failed to send grace warning for sub {sub.id}: {e}')
            counters['errors'] += 1

    def _expire_subscription(self, sub, dry_run, counters):
        """
        Mark a subscription as expired.

        The post_save signal on UserSubscription handles sending the
        expired_notice email — do NOT send it here to avoid double-sending.
        """
        if dry_run:
            self.stdout.write(
                f'  [DRY] Would expire subscription for {sub.user.email} '
                f'({sub.plan.get_name_display()}, '
                f'grace ended {sub.grace_end_date.strftime("%Y-%m-%d") if sub.grace_end_date else "N/A"})'
            )
            counters['expired'] += 1
            return

        try:
            with transaction.atomic():
                # select_for_update prevents a concurrent process from
                # expiring the same subscription twice.
                locked_sub = UserSubscription.objects.select_for_update().get(pk=sub.pk)
                if locked_sub.status != 'active':
                    # Already expired/cancelled by another process — skip.
                    logger.debug(f'Sub {sub.id} already transitioned to {locked_sub.status}; skipping.')
                    return
                locked_sub.mark_expired()  # Triggers post_save signal → expired_notice email.

            counters['expired'] += 1
            logger.info(f'Expired subscription {sub.id} for {sub.user.email}.')
        except Exception as e:
            logger.error(f'Failed to expire sub {sub.id}: {e}', exc_info=True)
            counters['errors'] += 1

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    def _print_summary(self, counters, dry_run):
        suffix = ' (dry run)' if dry_run else ''
        self.stdout.write('')
        self.stdout.write(f'Summary{suffix}:')
        self.stdout.write(f'  7-day reminders sent : {counters["reminders_7day"]}')
        self.stdout.write(f'  3-day reminders sent : {counters["reminders_3day"]}')
        self.stdout.write(f'  Grace warnings sent  : {counters["grace_warnings"]}')
        self.stdout.write(f'  Subscriptions expired: {counters["expired"]}')
        self.stdout.write(f'  Errors               : {counters["errors"]}')

        if counters['errors'] > 0:
            self.stdout.write(self.style.WARNING(
                f'Completed with {counters["errors"]} error(s). Check logs.'
            ))
        else:
            self.stdout.write(self.style.SUCCESS('Completed successfully.'))