from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.WithdrawalRequestView.as_view(), name='withdrawal-request'),
    path('history/', views.WithdrawalHistoryView.as_view(), name='withdrawal-history'),
    path('daraja/result/', views.daraja_b2c_result, name='daraja-b2c-result'),
    path('daraja/timeout/', views.daraja_b2c_timeout, name='daraja-b2c-timeout'),

]