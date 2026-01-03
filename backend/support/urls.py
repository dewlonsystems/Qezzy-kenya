# support/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('tickets/', views.SupportTicketListView.as_view(), name='ticket-list'),
    path('tickets/create/', views.CreateSupportTicketView.as_view(), name='create-ticket'),
    path('tickets/<int:ticket_id>/', views.TicketConversationView.as_view(), name='ticket-conversation'),
    path('tickets/<int:ticket_id>/admin-reply/', views.AdminTicketReplyView.as_view(), name='admin-ticket-reply'),
    path('admin/tickets/', views.AdminTicketListView.as_view(), name='admin-ticket-list'),
]