from django.urls import path
from . import views

urlpatterns = [
    path('transactions/', views.ReferralTransactionsView.as_view(), name='referral-transactions'),
]