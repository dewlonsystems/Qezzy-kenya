from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.UserDetailView.as_view(), name='user-detail'),
    path('profile/', views.ProfileUpdateView.as_view(), name='profile-update'),
    path('close/', views.CloseAccountView.as_view(), name='close-account'),
    path('email-preferences/<str:token>/', views.EmailPreferencesView.as_view(), name='api_email_preferences'),
    path('email-preferences/unsubscribe/<str:email_type>/', views.EmailUnsubscribeView.as_view(), name='api_email_unsubscribe'),
]