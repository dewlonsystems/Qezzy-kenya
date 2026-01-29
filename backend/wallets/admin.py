# wallets/admin.py
from django.contrib import admin
from django.core.exceptions import PermissionDenied
from .models import WalletTransaction


@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user_email', 'wallet_type', 'transaction_type',
        'amount', 'running_balance', 'created_at'
    ]
    list_filter = ['wallet_type', 'transaction_type', 'created_at']
    search_fields = ['user__email']
    ordering = ['-created_at']
    readonly_fields = [f.name for f in WalletTransaction._meta.fields]  # All fields readonly

    def has_add_permission(self, request):
        # Allow only superusers to add manual admin adjustments
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        # No editing allowed — immutable ledger
        return False

    def has_delete_permission(self, request, obj=None):
        # Never allow deletion
        return False

    def save_model(self, request, obj, form, change):
        if change:
            raise PermissionDenied("Wallet transactions cannot be modified after creation.")

        # Only allow admin_adjustment type for manual creation
        if obj.transaction_type != 'admin_adjustment':
            raise PermissionDenied("Only 'Admin Adjustment' transactions can be created manually.")

        obj.source = 'admin'  # Enforce source
        obj.save()

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'