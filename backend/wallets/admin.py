# wallet/admin.py
from django.contrib import admin
from django.core.exceptions import PermissionDenied
from .models import WalletTransaction

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user_email', 'wallet_type', 'transaction_type',
        'amount', 'running_balance', 'status', 'source', 'created_at'
    ]
    list_filter = ['wallet_type', 'transaction_type', 'status', 'source', 'created_at']
    search_fields = ['user__email']
    ordering = ['-created_at']

    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing existing transaction
            # Allow editing ONLY 'status' for admins; everything else is readonly
            readonly = [
                'user', 'wallet_type', 'transaction_type', 'amount',
                'running_balance', 'description', 'source'
            ]
            return readonly
        else:
            # When creating NEW transaction (e.g., admin adjustment), allow all fields
            return []

    def has_add_permission(self, request):
        # Only allow adding admin adjustments manually
        return request.user.is_superuser or request.user.is_staff

    def has_change_permission(self, request, obj=None):
        # Only superusers can modify transactions
        if not request.user.is_superuser:
            return False
        return super().has_change_permission(request, obj)

    def save_model(self, request, obj, form, change):
        if not change:  # Creating new
            if obj.source != 'admin':
                raise PermissionDenied("Only 'admin' source allowed for manual creation.")
            obj.source = 'admin'
        super().save_model(request, obj, form, change)

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'