# jobs/management/commands/generate_daily_survey_jobs.py
import random
from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User
from jobs.models import SurveyCategory, SurveyQuestion, SurveyJob, DailyJobAssignment
from django.utils import timezone


class Command(BaseCommand):
    help = 'Generates daily survey jobs for active users'

    def handle(self, *args, **options):
        today = date.today()
        active_users = User.objects.filter(is_active=True)

        for user in active_users:
            # Skip if already assigned today
            if DailyJobAssignment.objects.filter(user=user, date=today).exists():
                self.stdout.write(f"Skipped {user.email} — already assigned today.")
                continue

            # --- Weighted job assignment logic ---
            roll = random.random()
            if roll < 0.75:
                num_jobs = 1 
            elif roll < 0.95:
                num_jobs = 0
            else:
                num_jobs = random.randint(2, 4)

            if num_jobs == 0:
                with transaction.atomic():
                    DailyJobAssignment.objects.create(user=user, date=today, job_count=0)
                self.stdout.write(f"Assigned 0 jobs to {user.email}")
                continue

            categories = list(SurveyCategory.objects.all())
            if not categories:
                self.stdout.write("No survey categories found. Aborting job generation.")
                DailyJobAssignment.objects.create(user=user, date=today, job_count=0)
                return

            used_categories = []
            generated_jobs = []

            for _ in range(num_jobs):
                available_cats = [c for c in categories if c not in used_categories] or categories
                category = random.choice(available_cats)
                used_categories.append(category)

                questions = list(SurveyQuestion.objects.filter(category=category))
                if len(questions) < category.min_questions:
                    self.stdout.write(
                        f"Insufficient questions in {category.name}. Skipping one job for {user.email}."
                    )
                    continue

                q_count = random.randint(
                    category.min_questions,
                    min(category.max_questions, len(questions))
                )
                selected_questions = random.sample(questions, q_count)
                question_ids = [q.id for q in selected_questions]
                reward = q_count * 10.00

                job = SurveyJob(
                    user=user,
                    category=category,
                    title=f"Survey about {category.name}",
                    reward_kes=reward,
                    question_count=q_count,
                    selected_question_ids=question_ids,
                    status='open'
                )
                generated_jobs.append(job)

            # Save all jobs and assignment atomically
            with transaction.atomic():
                for job in generated_jobs:
                    job.save()

                DailyJobAssignment.objects.create(
                    user=user,
                    date=today,
                    job_count=len(generated_jobs)
                )

            # 👇 SEND EMAIL FOR EACH ASSIGNED JOB
            self.stdout.write(f"Preparing to send {len(generated_jobs)} email(s) to {user.email}")
            for job in generated_jobs:
                try:
                    from users.utils import send_task_assigned_email
                    deadline = timezone.now() + timezone.timedelta(hours=72)
                    send_task_assigned_email(
                        user=user,
                        task_title=job.title,
                        reward=job.reward_kes,
                        deadline=deadline
                    )
                    self.stdout.write(self.style.SUCCESS(f"    ✅ Email sent for '{job.title}'"))                                                         
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f"    ❌ Email failed for '{job.title}': {e}")
                    )

            self.stdout.write(
                self.style.SUCCESS(
                    f"Assigned {len(generated_jobs)} job(s) to {user.email}"
                )
            )