# jobs/admin.py
from django.contrib import admin
from .models import SurveyCategory, SurveyQuestion, SurveyJob, SurveyResponse

@admin.register(SurveyCategory)
class SurveyCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'min_questions', 'max_questions', 'created_at']
    search_fields = ['name']


@admin.register(SurveyQuestion)
class SurveyQuestionAdmin(admin.ModelAdmin):
    list_display = ['category', 'text']
    list_filter = ['category']
    search_fields = ['text']
    autocomplete_fields = ['category']


@admin.register(SurveyJob)
class SurveyJobAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'user', 'status', 'reward_kes', 'question_count', 'created_at']
    list_filter = ['status', 'category', 'created_at']
    search_fields = ['user__email', 'title']
    readonly_fields = ['selected_question_ids', 'reward_kes', 'question_count']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'category')


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ['job', 'submitted_at']
    readonly_fields = ['job', 'answers', 'submitted_at']