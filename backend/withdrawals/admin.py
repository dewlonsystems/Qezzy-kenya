from django.contrib import admin
from django.core.exceptions import ValidationError
from .models import WithdrawalRequest

@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_email', 'wallet_type', 'amount', 'method', 'status', 'created_at']
    list_filter = ['wallet_type', 'method', 'status', 'created_at']
    search_fields = ['user__email']
    list_editable = ['status']
    ordering = ['-created_at']

    def get_readonly_fields(self, request, obj=None):
        # Prevent editing status of completed mobile withdrawals
        if obj and obj.method == 'mobile' and obj.status == 'completed':
            return list(self.readonly_fields) + ['status']
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        if not change:
            super().save_model(request, obj, form, change)
            return

        if 'status' not in form.changed_data:
            super().save_model(request, obj, form, change)
            return

        # Sync status to linked wallet transaction
        if obj.linked_transaction:
            old_obj = WithdrawalRequest.objects.get(pk=obj.pk)
            old_status = old_obj.status
            new_status = obj.status

            # Block reversal of completed mobile withdrawals
            if obj.method == 'mobile' and old_status == 'completed' and new_status != 'completed':
                from django.contrib import messages
                messages.warning(request, "Completed mobile withdrawals cannot be reverted.")
                return

            # Update linked transaction status
            obj.linked_transaction.status = new_status
            try:
                obj.linked_transaction.save(update_fields=['status'])
            except Exception as e:
                from django.contrib import messages
                messages.error(request, f"Failed to update wallet balance: {str(e)}")
                raise ValidationError(f"Wallet sync failed: {str(e)}")

        super().save_model(request, obj, form, change)

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'