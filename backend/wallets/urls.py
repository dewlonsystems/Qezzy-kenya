from django.urls import path
from . import views

urlpatterns = [
    path('overview/', views.WalletOverviewView.as_view(), name='wallet-overview'),
    path('transactions/', views.WalletTransactionsView.as_view(), name='wallet-transactions'),
    path('statement/', views.WalletStatementPDFView.as_view(), name='wallet-statement-pdf'),
    path('statement/email/', views.EmailStatementView.as_view(), name='wallet-statement-email'),
]