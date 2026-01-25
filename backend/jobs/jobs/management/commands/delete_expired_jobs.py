# jobs/management/commands/delete_expired_jobs.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from jobs.models import SurveyJob

class Command(BaseCommand):
    help = 'Delete SurveyJobs with status "open" that are older than 72 hours'

    def handle(self, *args, **options):
        cutoff_time = timezone.now() - timedelta(hours=72)
        
        expired_jobs = SurveyJob.objects.filter(
            status='open',
            created_at__lt=cutoff_time
        )

        count = expired_jobs.count()
        if count > 0:
            self.stdout.write(f"Deleting {count} open job(s) older than 72 hours...")
            expired_jobs.delete()
            self.stdout.write(
                self.style.SUCCESS(f"Successfully deleted {count} expired open job(s).")
            )
        else:
            self.stdout.write("No expired open jobs found.")