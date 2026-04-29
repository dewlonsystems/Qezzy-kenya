from django.urls import path
from . import views

app_name = 'surveys'

urlpatterns = [
    path('categories/', views.SurveyCategoryListView.as_view(), name='category-list'),
    path('categories/<int:category_id>/', views.SurveyCategoryDetailView.as_view(), name='category-detail'),
    path('submit/', views.SurveySubmissionView.as_view(), name='submit-survey'),
    path('admin/review/', views.AdminSurveyReviewView.as_view(), name='admin-review'),
]