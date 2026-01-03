from django.urls import path
from . import views

urlpatterns = [
    path('profile/', views.ProfileCompletionView.as_view(), name='profile-completion'),
    path('payment/', views.PaymentDetailsView.as_view(), name='payment-details'),
    path('status/', views.OnboardingStatusView.as_view(), name='onboarding-status'),
]