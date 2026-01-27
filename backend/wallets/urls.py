from django.urls import path
from . import views

urlpatterns = [
    path('overview/', views.WalletOverviewView.as_view(), name='wallet-overview'),
    path('transactions/', views.WalletTransactionsView.as_view(), name='wallet-transactions'),
    path('statement/', WalletStatementPDFView.as_view(), name='wallet-statement-pdf'),
]