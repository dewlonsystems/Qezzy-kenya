from django.urls import path
from . import views

urlpatterns = [
    path('initiate/', views.InitiateActivationView.as_view(), name='initiate-activation'),
    path('skip/', views.SkipActivationView.as_view(), name='skip-activation'),
    path('status/', views.ActivationStatusView.as_view(), name='activation-status'),
    path('daraja/callback/', views.DarajaCallbackView.as_view(), name='daraja-callback'),
]