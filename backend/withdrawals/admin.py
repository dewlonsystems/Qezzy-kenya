from django.contrib import admin
from .models import WithdrawalRequest

@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'wallet_type', 'amount', 'method', 'status', 'created_at']
    list_filter = ['wallet_type', 'method', 'status', 'created_at']
    search_fields = ['user__email']
    list_editable = ['status']
    ordering = ['-created_at']

    def save_model(self, request, obj, form, change):
        if change and 'status' in form.changed_data:
            if obj.status == 'completed' and obj.method == 'bank':
                # Debit wallet when admin marks bank withdrawal as completed
                from wallets.utils import create_transaction
                from decimal import Decimal
                create_transaction(
                    user=obj.user,
                    wallet_type=obj.wallet_type,
                    transaction_type='withdrawal',
                    amount=-Decimal(obj.amount),
                    description=f"Bank withdrawal approved by admin",
                    source='admin',
                    status='completed'
                )
        super().save_model(request, obj, form, change)