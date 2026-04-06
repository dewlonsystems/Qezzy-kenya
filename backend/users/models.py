from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager
import secrets  # 🆕 Added for secure token generation


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    firebase_uid = models.CharField(max_length=128, unique=True, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    street = models.CharField(max_length=255, blank=True)
    house_number = models.CharField(max_length=20, blank=True)
    zip_code = models.CharField(max_length=10, blank=True)
    town = models.CharField(max_length=100, blank=True)
    skills = models.JSONField(default=list)

    referral_code = models.CharField(max_length=8, unique=True)
    referred_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    
    payout_method = models.CharField(max_length=10, choices=[('mobile', 'Mobile'), ('bank', 'Bank')], blank=True)
    payout_phone = models.CharField(max_length=15, blank=True)
    payout_bank_name = models.CharField(max_length=100, blank=True)
    payout_bank_branch = models.CharField(max_length=100, blank=True)
    payout_account_number = models.CharField(max_length=50, blank=True)
    
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_closed = models.BooleanField(default=False)
    
    is_onboarded = models.BooleanField(default=False)
    
    last_seen_ip = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # 🆕 EMAIL PREFERENCE FIELDS
    receive_task_notifications = models.BooleanField(default=True, help_text="Receive emails about new task assignments")
    receive_promotional_emails = models.BooleanField(default=True, help_text="Receive promotional and update emails")
    receive_statement_emails = models.BooleanField(default=True, help_text="Receive account statement emails")
    email_preferences_token = models.CharField(max_length=64, blank=True, null=True, unique=True, help_text="Secure token for email preference links")

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email

    def close_account(self):
        self.is_closed = True
        self.is_active = False
        self.save()

    # 🆕 EMAIL PREFERENCE HELPER METHODS
    def generate_email_token(self):
        """Generate a secure token for email preference links if one doesn't exist."""
        if not self.email_preferences_token:
            self.email_preferences_token = secrets.token_urlsafe(32)
            self.save(update_fields=['email_preferences_token'])
        return self.email_preferences_token

    def get_preferences_url(self):
        """Get the full URL for managing email preferences."""
        from django.conf import settings
        token = self.generate_email_token()
        # Uses FRONTEND_URL from settings, falls back to your production domain
        domain = getattr(settings, 'FRONTEND_URL', 'https://qezzykenya.company')
        return f"{domain}/email-preferences/{token}/"