# withdrawals/admin.py — FULL CORRECTED VERSION
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
        if obj and obj.method == 'mobile' and obj.status == 'completed':
            return list(self.readonly_fields) + ['status']
        return self.readonly_fields

    def save_model(self, request, obj, form, change):
        if not change:
            super().save_model(request, obj, form, change)
            return

        # ALWAYS get the original object to compare status
        original_obj = WithdrawalRequest.objects.get(pk=obj.pk)
        old_status = original_obj.status
        new_status = obj.status

        # Save the WithdrawalRequest first
        super().save_model(request, obj, form, change)

        # Now sync to linked transaction (if exists and status actually changed)
        if obj.linked_transaction and old_status != new_status:
            # Block reversal of completed mobile withdrawals
            if obj.method == 'mobile' and old_status == 'completed':
                from django.contrib import messages
                messages.warning(request, "Completed mobile withdrawals cannot be reverted.")
                # Revert the status change
                obj.status = old_status
                obj.save(update_fields=['status'])
                return

            # Sync status to linked transaction
            obj.linked_transaction.status = new_status
            try:
                obj.linked_transaction.save(update_fields=['status'])
            except Exception as e:
                from django.contrib import messages
                messages.error(request, f"Failed to update wallet balance: {str(e)}")
                # Optionally revert status
                obj.status = old_status
                obj.save(update_fields=['status'])

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'