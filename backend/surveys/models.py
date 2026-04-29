from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from decimal import Decimal

# Lazy import to avoid circular dependency with subscriptions app
def get_active_subscription(user):
    try:
        from subscriptions.utils import get_active_subscription
        return get_active_subscription(user)
    except ImportError:
        return None


class SurveyCategory(models.Model):
    """
    A survey category belongs to one tier and contains multiple questions.
    Amount is set on the category (not questions) and can be updated by admin anytime.
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('archived', 'Archived'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    
    # Tier enforcement: matches SubscriptionPlan.tier_level (0=Free, 4=Elite)
    tier_level = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(4)],
        help_text="0=Free, 1=Basic, 2=Standard, 3=Premium, 4=Elite"
    )
    
    # Amount stored on category (admin-updatable)
    amount_kes = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Reward amount credited on approval (updatable anytime)"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Optional validation rules
    min_questions = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1)])
    max_questions = models.PositiveSmallIntegerField(default=20, validators=[MinValueValidator(1), MaxValueValidator(50)])
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-tier_level', 'name']
        verbose_name = "Survey Category"
        verbose_name_plural = "Survey Categories"
        constraints = [
            # Prevent duplicate category names within same tier
            models.UniqueConstraint(fields=['name', 'tier_level'], name='unique_category_per_tier')
        ]

    def __str__(self):
        return f"{self.name} (Tier {self.tier_level}) - KES {self.amount_kes}"

    def is_accessible_to_user(self, user) -> bool:
        """Check if user's subscription tier can access this category."""
        if self.status != 'active':
            return False
        sub = get_active_subscription(user)
        if not sub:
            return self.tier_level == 0  # Only Free tier accessible without subscription
        return sub.plan.tier_level >= self.tier_level

    def has_user_completed(self, user) -> bool:
        """Check if user has already completed this category (approved submission)."""
        return UserSurveySubmission.objects.filter(
            user=user,
            category=self,
            status='approved'
        ).exists()


class SurveyQuestion(models.Model):
    """
    A question belongs to one category.
    Types: multiple_choice (with JSON options), text, or rating_1_to_5.
    """
    QUESTION_TYPE_CHOICES = [
        ('multiple_choice', 'Multiple Choice'),
        ('text', 'Text Input'),
        ('rating_1_to_5', 'Rating (1-5)'),
    ]

    category = models.ForeignKey(
        SurveyCategory,
        on_delete=models.CASCADE,
        related_name='questions'
    )
    text = models.TextField(help_text="The question text shown to users")
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES)
    is_required = models.BooleanField(default=True)
    
    # For multiple_choice: store options as JSON array of strings
    # Example: ["Option A", "Option B", "Option C"]
    options = models.JSONField(blank=True, default=list, help_text="Options for multiple_choice type only")
    
    # Ordering within category
    order = models.PositiveSmallIntegerField(default=0, help_text="Display order within category")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = "Survey Question"
        verbose_name_plural = "Survey Questions"

    def __str__(self):
        return f"{self.category.name}: {self.text[:50]}..."

    def clean(self):
        """Validate options based on question type."""
        if self.question_type == 'multiple_choice' and not self.options:
            raise models.ValidationError("Multiple choice questions must have at least one option.")
        if self.question_type != 'multiple_choice' and self.options:
            raise models.ValidationError("Options should only be set for multiple_choice questions.")


class UserSurveySubmission(models.Model):
    """
    Tracks a user's submission of a survey category.
    Workflow: active → pending_review → approved/rejected
    Completed (approved) submissions are never shown again to the same user.
    """
    STATUS_CHOICES = [
        ('active', 'Active'),           # User can start/continue answering
        ('pending_review', 'Pending Review'),  # Submitted, awaiting admin decision
        ('approved', 'Approved'),       # Reviewed & credited
        ('rejected', 'Rejected'),       # Reviewed & sent back for redo
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='survey_submissions'
    )
    category = models.ForeignKey(
        SurveyCategory,
        on_delete=models.PROTECT,
        related_name='user_submissions'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    rejection_reason = models.TextField(blank=True, help_text="Reason if rejected (shown to user)")
    
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='reviewed_survey_submissions',
        help_text="Admin who reviewed this submission"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "User Survey Submission"
        verbose_name_plural = "User Survey Submissions"
        constraints = [
            # One submission per user per category (prevents duplicates)
            models.UniqueConstraint(
                fields=['user', 'category'],
                name='one_submission_per_user_per_category'
            )
        ]
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['status', 'submitted_at']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.category.name} ({self.status})"

    def can_be_submitted_by_user(self) -> bool:
        """Check if user can submit answers for this submission."""
        return self.status == 'active'

    def mark_pending_review(self):
        """Transition to pending_review status."""
        self.status = 'pending_review'
        self.submitted_at = timezone.now()
        self.save(update_fields=['status', 'submitted_at', 'updated_at'])

    def mark_approved(self, reviewed_by_user):
        """Approve submission and credit wallet (handled by signal/utility)."""
        self.status = 'approved'
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by_user
        self.save(update_fields=['status', 'reviewed_at', 'reviewed_by', 'updated_at'])

    def mark_rejected(self, reviewed_by_user, reason: str):
        """Reject submission and allow user to redo."""
        self.status = 'rejected'
        self.rejection_reason = reason
        self.reviewed_at = timezone.now()
        self.reviewed_by = reviewed_by_user
        self.save(update_fields=['status', 'rejection_reason', 'reviewed_at', 'reviewed_by', 'updated_at'])

    def reset_for_redo(self):
        """After rejection, allow user to resubmit (keep history but reset status)."""
        self.status = 'active'
        self.rejection_reason = ''  # Clear reason for fresh attempt
        self.submitted_at = None
        self.save(update_fields=['status', 'rejection_reason', 'submitted_at', 'updated_at'])


class SurveyAnswer(models.Model):
    """
    Stores a user's answer to a specific question within a submission.
    Only one of answer_text, answer_option, or answer_rating will be populated
    based on the question type.
    """
    submission = models.ForeignKey(
        UserSurveySubmission,
        on_delete=models.CASCADE,
        related_name='answers'
    )
    question = models.ForeignKey(
        SurveyQuestion,
        on_delete=models.PROTECT,
        related_name='user_answers'
    )
    
    # Only one of these will be populated based on question_type
    answer_text = models.TextField(blank=True, help_text="For text/rating questions")
    answer_option = models.CharField(max_length=255, blank=True, help_text="Selected option for multiple_choice")
    answer_rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating value (1-5) for rating questions"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['question__order', 'id']
        verbose_name = "Survey Answer"
        verbose_name_plural = "Survey Answers"
        constraints = [
            # One answer per question per submission
            models.UniqueConstraint(
                fields=['submission', 'question'],
                name='one_answer_per_question_per_submission'
            )
        ]

    def __str__(self):
        return f"Answer to {self.question.text[:30]}..."

    def get_answer_value(self):
        """Return the populated answer field based on question type."""
        if self.question.question_type == 'multiple_choice':
            return self.answer_option
        elif self.question.question_type == 'rating_1_to_5':
            return self.answer_rating
        return self.answer_text