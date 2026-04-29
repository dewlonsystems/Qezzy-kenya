from django.contrib import admin, messages
from django.db import transaction
from django.utils.html import format_html
from django.urls import reverse
from .models import SurveyCategory, SurveyQuestion, UserSurveySubmission, SurveyAnswer


# ========================
# INLINE ADMIN CLASSES
# ========================

class SurveyQuestionInline(admin.TabularInline):
    model = SurveyQuestion
    extra = 1
    fields = ('order', 'text', 'question_type', 'options', 'is_required')
    ordering = ('order',)
    verbose_name = "Question"
    verbose_name_plural = "Questions"


class SurveyAnswerInline(admin.TabularInline):
    model = SurveyAnswer
    extra = 0
    fields = ('question', 'answer_value_display', 'created_at')
    readonly_fields = ('question', 'answer_value_display', 'created_at')
    can_delete = False

    def answer_value_display(self, obj):
        return obj.get_answer_value() or "—"
    answer_value_display.short_description = "Answer"


# ========================
# SURVEY CATEGORY ADMIN
# ========================

@admin.register(SurveyCategory)
class SurveyCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier_level', 'amount_kes', 'status', 'question_count_display', 'created_at')
    list_filter = ('status', 'tier_level')
    search_fields = ('name', 'description')
    readonly_fields = ('created_at', 'updated_at')
    inlines = [SurveyQuestionInline]
    ordering = ('-created_at',)
    fieldsets = (
        ('Basic Info', {'fields': ('name', 'description')}),
        ('Tier & Reward', {'fields': ('tier_level', 'amount_kes')}),
        ('Status & Rules', {'fields': ('status', 'min_questions', 'max_questions')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    def question_count_display(self, obj):
        return obj.questions.count()
    question_count_display.short_description = "Questions"
    question_count_display.admin_order_field = 'questions'


# ========================
# SURVEY QUESTION ADMIN (Standalone)
# ========================

@admin.register(SurveyQuestion)
class SurveyQuestionAdmin(admin.ModelAdmin):
    list_display = ('category', 'order', 'question_type', 'is_required', 'text_preview')
    list_filter = ('category', 'question_type', 'is_required')
    search_fields = ('text',)
    autocomplete_fields = ['category']
    ordering = ('category', 'order')

    def text_preview(self, obj):
        return obj.text[:60] + '...' if len(obj.text) > 60 else obj.text
    text_preview.short_description = "Question"


# ========================
# USER SURVEY SUBMISSION ADMIN
# ========================

@admin.register(UserSurveySubmission)
class UserSurveySubmissionAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'user_email_link', 'category_name', 'status_badge',
        'submitted_at', 'reviewed_at', 'reviewed_by_link'
    )
    list_filter = ('status', 'category__tier_level', 'submitted_at')
    search_fields = ('user__email', 'category__name')
    readonly_fields = ('user', 'category', 'status', 'submitted_at', 'reviewed_at', 'reviewed_by', 'created_at', 'updated_at')
    inlines = [SurveyAnswerInline]
    date_hierarchy = 'submitted_at'
    actions = ['approve_selected', 'reject_selected', 'reset_for_redo_selected']

    fieldsets = (
        ('Submission Details', {'fields': ('user', 'category', 'status')}),
        ('Review Information', {'fields': ('submitted_at', 'reviewed_at', 'reviewed_by', 'rejection_reason')}),
        ('Timestamps', {'fields': ('created_at', 'updated_at'), 'classes': ('collapse',)}),
    )

    # ========================
    # DISPLAY HELPERS
    # ========================

    def user_email_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.user.pk])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_email_link.short_description = "User"
    user_email_link.admin_order_field = 'user__email'

    def category_name(self, obj):
        return f"{obj.category.name} (Tier {obj.category.tier_level})"
    category_name.short_description = "Category"
    category_name.admin_order_field = 'category__name'

    def reviewed_by_link(self, obj):
        if obj.reviewed_by:
            url = reverse('admin:users_user_change', args=[obj.reviewed_by.pk])
            return format_html('<a href="{}">{}</a>', url, obj.reviewed_by.email)
        return "—"
    reviewed_by_link.short_description = "Reviewed By"

    def status_badge(self, obj):
        colors = {
            'active': '#ffc107',
            'pending_review': '#17a2b8',
            'approved': '#28a745',
            'rejected': '#dc3545'
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background:{}; color:white; padding:2px 6px; border-radius:3px; font-size:12px;">{}</span>',
            color, obj.get_status_display().upper()
        )
    status_badge.short_description = "Status"

    # Dynamic readonly: allow editing rejection_reason only during review
    def get_readonly_fields(self, request, obj=None):
        readonly = list(self.readonly_fields)
        if obj and obj.status in ('approved', 'active'):
            readonly.append('rejection_reason')
        return readonly

    # ========================
    # ADMIN ACTIONS
    # ========================

    @admin.action(description="✅ Approve selected submissions (Credit Wallet)")
    def approve_selected(self, request, queryset):
        count = 0
        with transaction.atomic():
            for sub in queryset.filter(status='pending_review'):
                sub.mark_approved(reviewed_by_user=request.user)
                # Wallet crediting is handled automatically by signals
                count += 1
        if count:
            self.message_user(request, f'Successfully approved {count} submission(s). Wallets will be credited automatically.', messages.SUCCESS)
        else:
            self.message_user(request, 'No pending submissions selected.', messages.WARNING)

    @admin.action(description="❌ Reject selected submissions")
    def reject_selected(self, request, queryset):
        count = 0
        default_reason = "Review rejected. Please review feedback and resubmit."
        with transaction.atomic():
            for sub in queryset.filter(status='pending_review'):
                sub.mark_rejected(reviewed_by_user=request.user, reason=default_reason)
                count += 1
        if count:
            self.message_user(request, f'Rejected {count} submission(s). Users can view the reason and resubmit.', messages.WARNING)
        else:
            self.message_user(request, 'No pending submissions selected.', messages.WARNING)

    @admin.action(description="🔄 Reset rejected submissions to Active")
    def reset_for_redo_selected(self, request, queryset):
        count = 0
        with transaction.atomic():
            for sub in queryset.filter(status='rejected'):
                sub.reset_for_redo()
                count += 1
        if count:
            self.message_user(request, f'Reset {count} submission(s) to Active. Users can now edit and resubmit.', messages.INFO)
        else:
            self.message_user(request, 'No rejected submissions selected.', messages.WARNING)