# jobs/management/commands/generate_daily_survey_jobs.py
import random
from datetime import date
from django.core.management.base import BaseCommand
from django.db import transaction
from users.models import User
from jobs.models import SurveyCategory, SurveyQuestion, SurveyJob, DailyJobAssignment

class Command(BaseCommand):
    help = 'Generates daily survey jobs for active users'

    def handle(self, *args, **options):
        today = date.today()
        active_users = User.objects.filter(is_active=True)

        for user in active_users:
            if DailyJobAssignment.objects.filter(user=user, date=today).exists():
                self.stdout.write(f"Skipped {user.email} — already assigned today.")
                continue

            num_jobs = random.randint(1, 4)
            categories = list(SurveyCategory.objects.all())
            if not categories:
                self.stdout.write("No survey categories found. Aborting job generation.")
                return

            used_categories = []
            generated_jobs = []

            for _ in range(num_jobs):
                available_cats = [c for c in categories if c not in used_categories] or categories
                category = random.choice(available_cats)
                used_categories.append(category)

                questions = list(SurveyQuestion.objects.filter(category=category))
                if len(questions) < category.min_questions:
                    self.stdout.write(f"Insufficient questions in {category.name}. Skipping one job.")
                    continue

                q_count = random.randint(category.min_questions, min(category.max_questions, len(questions)))
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

            with transaction.atomic():
                for job in generated_jobs:
                    job.save()
                DailyJobAssignment.objects.create(user=user, date=today, job_count=len(generated_jobs))

            self.stdout.write(
                self.style.SUCCESS(f"Assigned {len(generated_jobs)} jobs to {user.email}")
            )