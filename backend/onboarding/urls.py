from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.ProfileCompletionView.as_view(), name='profile-completion'),
    path('payout-details/', views.PaymentDetailsView.as_view(), name='payout-details'),
    path('status/', views.OnboardingStatusView.as_view(), name='onboarding-status'),
]