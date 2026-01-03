# support/models.py
from django.db import models
from users.models import User  

class SupportTicket(models.Model):
    CATEGORY_CHOICES = [
        ('activation', 'Account Activation'),
        ('payment', 'Payment Issue'),
        ('withdrawal', 'Withdrawal Problem'),
        ('referral', 'Referral Issue'),
        ('job', 'Job Related'),
        ('technical', 'Technical Issue'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='support_tickets')
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Ticket #{self.id} - {self.user.email} ({self.status})"


class SupportMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)  # ✅ Points to your User
    is_admin = models.BooleanField(default=False)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Message in #{self.ticket.id} by {'Admin' if self.is_admin else self.sender.email}"