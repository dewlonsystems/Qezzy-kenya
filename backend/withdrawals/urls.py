from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.WithdrawalRequestView.as_view(), name='withdrawal-request'),
    path('history/', views.WithdrawalHistoryView.as_view(), name='withdrawal-history'),
]