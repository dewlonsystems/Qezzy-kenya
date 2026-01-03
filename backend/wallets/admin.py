from django.contrib import admin
from .models import WalletTransaction

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user_email', 'wallet_type', 'transaction_type',
        'amount', 'running_balance', 'status', 'created_at'
    ]
    list_filter = ['wallet_type', 'transaction_type', 'status', 'created_at']
    search_fields = ['user__email']
    readonly_fields = ['user', 'wallet_type', 'transaction_type', 'amount', 'running_balance', 'status', 'description']
    ordering = ['-created_at']

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'