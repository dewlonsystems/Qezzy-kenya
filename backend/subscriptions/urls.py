from django.urls import path
from . import views

app_name = 'subscriptions'

urlpatterns = [
    # Public: List available subscription plans
    path('plans/', views.ListSubscriptionPlansView.as_view(), name='list-plans'),

    # Authenticated: User subscription management
    path('subscribe/', views.InitiateSubscriptionPaymentView.as_view(), name='initiate-subscription'),
    path('status/', views.UserSubscriptionStatusView.as_view(), name='subscription-status'),
    path('history/', views.SubscriptionHistoryView.as_view(), name='subscription-history'),
    path('upgrade/', views.UpgradeSubscriptionView.as_view(), name='upgrade-subscription'),
    path('cancel/', views.CancelSubscriptionView.as_view(), name='cancel-subscription'),
    path('payment-status/<str:transaction_id>/', views.PaymentStatusView.as_view(), name='payment-status'),
    path('receipt/<int:transaction_id>/', views.ReceiptDownloadView.as_view(), name='receipt-download'),

    # Authenticated Staff: Admin manual actions
    path('admin/action/', views.AdminSubscriptionActionView.as_view(), name='admin-subscription-action'),

    # Public Webhook: Daraja STK Push callback
    # NOTE: Must be publicly accessible. CSRF exemption & AllowAny are handled in the view.
    path('callback/daraja/', views.SubscriptionCallbackView.as_view(), name='daraja-subscription-callback'),
]