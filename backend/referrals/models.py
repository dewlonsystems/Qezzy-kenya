# referrals/models.py
from django.db import models
from users.models import User

class ReferralTransaction(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referral_earnings')
    referred_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referral_by')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=50.00)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('referrer', 'referred_user')

    def __str__(self):
        return f"{self.referrer.email} <- {self.referred_user.email} ({self.status})"