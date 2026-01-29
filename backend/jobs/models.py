from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import User
from decimal import Decimal


class SurveyCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    min_questions = models.PositiveSmallIntegerField(default=3, validators=[MinValueValidator(1)])
    max_questions = models.PositiveSmallIntegerField(default=7, validators=[MinValueValidator(1), MaxValueValidator(20)])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Survey Categories"


class SurveyQuestion(models.Model):
    category = models.ForeignKey(SurveyCategory, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.category.name[:30]}: {self.text[:50]}..."

    class Meta:
        ordering = ['id']


class SurveyJob(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('submitted', 'Submitted'),
        ('completed', 'Completed'),
        ('declined', 'Declined'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='survey_jobs')
    category = models.ForeignKey(SurveyCategory, on_delete=models.PROTECT)
    title = models.CharField(max_length=255)
    reward_kes = models.DecimalField(max_digits=10, decimal_places=2)
    question_count = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    selected_question_ids = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    reward_paid = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.title} for {self.user.email} ({self.status})"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Job"
        verbose_name_plural = "Jobs"


class SurveyResponse(models.Model):
    job = models.OneToOneField(SurveyJob, on_delete=models.CASCADE, related_name='response')
    answers = models.JSONField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Response to {self.job.title}"


class DailyJobAssignment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    job_count = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(4)])

    class Meta:
        unique_together = ('user', 'date')


from django.db.models.signals import post_save
from django.dispatch import receiver
from wallets.models import WalletTransaction


@receiver(post_save, sender=SurveyJob)
def create_wallet_transaction_on_completion(sender, instance, **kwargs):
    if instance.status == 'completed' and not instance.reward_paid:
        last_main_tx = WalletTransaction.objects.filter(
            user=instance.user,
            wallet_type='main'
        ).order_by('-created_at').first()

        previous_balance = last_main_tx.running_balance if last_main_tx else Decimal('0.00')
        new_balance = previous_balance + instance.reward_kes

        WalletTransaction.objects.create(
            user=instance.user,
            wallet_type='main',
            transaction_type='task_earning',
            source='system',
            amount=instance.reward_kes,
            running_balance=new_balance,
            status='completed',
            description=f"Payment for survey job: {instance.title} (ID: {instance.id})"
        )

        instance.reward_paid = True
        instance.save(update_fields=['reward_paid'])