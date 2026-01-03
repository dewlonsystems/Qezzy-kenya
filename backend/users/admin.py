from django.contrib import admin
from .models import User

@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    list_display = [
        'email', 'first_name', 'last_name', 'is_onboarded',
        'is_active', 'is_closed', 'referred_by_email', 'created_at'
    ]
    list_filter = ['is_active', 'is_onboarded', 'is_closed', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-created_at']
    actions = ['activate_accounts', 'deactivate_accounts', 'close_accounts']

    # Only include fields that exist in your User model
    fieldsets = (
        (None, {'fields': ('email', 'firebase_uid')}),
        ('Personal Info', {
            'fields': (
                'first_name', 'last_name', 'phone_number',
                'street', 'house_number', 'zip_code', 'town', 'skills'
            )
        }),
        ('Referral', {'fields': ('referral_code', 'referred_by')}),
        ('Payout', {
            'fields': (
                'payout_method', 'payout_phone',
                'payout_bank_name', 'payout_bank_branch', 'payout_account_number'
            )
        }),
        ('Status', {
            'fields': ('is_staff', 'is_superuser', 'is_onboarded', 'is_active', 'is_closed')
        }),
        ('Dates', {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ('created_at', 'updated_at', 'firebase_uid', 'referral_code')

    def referred_by_email(self, obj):
        return obj.referred_by.email if obj.referred_by else '—'
    referred_by_email.short_description = 'Referred By'

    def activate_accounts(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} account(s) activated manually.")
    activate_accounts.short_description = "✅ Activate selected accounts (skip payment)"

    def deactivate_accounts(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} account(s) deactivated (suspended).")
    deactivate_accounts.short_description = "⏸️ Suspend selected accounts"

    def close_accounts(self, request, queryset):
        for user in queryset:
            user.close_account()
        self.message_user(request, f"{queryset.count()} account(s) closed (soft delete).")
    close_accounts.short_description = "🗑️ Close selected accounts"