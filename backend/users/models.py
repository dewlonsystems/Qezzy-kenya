# users/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager

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

    # 🔑 Critical fix: max_length=8, unique=True, and NO blank=True
    referral_code = models.CharField(max_length=8, unique=True)
    referred_by = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
    
    # Payout fields
    payout_method = models.CharField(max_length=10, choices=[('mobile', 'Mobile'), ('bank', 'Bank')], blank=True)
    payout_phone = models.CharField(max_length=15, blank=True)
    payout_bank_name = models.CharField(max_length=100, blank=True)
    payout_bank_branch = models.CharField(max_length=100, blank=True)
    payout_account_number = models.CharField(max_length=50, blank=True)
    
    # Django auth fields (now properly inherited and managed)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_closed = models.BooleanField(default=False)
    
    # Your app status fields
    is_onboarded = models.BooleanField(default=False)
    
    # 👇 NEW FIELDS: IP and device tracking
    last_seen_ip = models.GenericIPAddressField(null=True, blank=True)
    device_info = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # 🔑 Tell Django to use email as the unique identifier for auth
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    # 🔑 Use custom manager
    objects = UserManager()

    def __str__(self):
        return self.email

    def close_account(self):
        self.is_closed = True
        self.is_active = False
        self.save()