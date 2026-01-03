from django.db import models
from users.models import User

class Job(models.Model):
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('submitted', 'Submitted'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('declined', 'Declined'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    assigned_to = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_jobs')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_jobs')  # Admin
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.status})"