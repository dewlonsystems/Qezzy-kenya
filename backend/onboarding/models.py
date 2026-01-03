from django.db import models
from users.models import User

class OnboardingStep(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='onboarding_step')
    profile_completed = models.BooleanField(default=False)
    payment_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_complete(self):
        return self.profile_completed and self.payment_completed

    def __str__(self):
        return f"Onboarding for {self.user.email}"