# admin.py
from django.contrib import admin
from django.db import transaction as db_transaction
from django.contrib import messages
from django.utils import timezone
from .models import WithdrawalRequest, SystemSetting
from .utils import notify_user_withdrawal_completed


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'description', 'updated_at']
    list_editable = ['value']
    readonly_fields = ['key', 'updated_at']
    search_fields = ['key', 'description']
    list_display_links = None  # Disable link to detail page
    
    def get_queryset(self, request):
        # Auto-create the required setting if it doesn't exist
        SystemSetting.withdrawals_enabled()
        return super().get_queryset(request)
    
    def has_delete_permission(self, request, obj=None):
        return False  # Prevent deletion of system settings
    
    def has_add_permission(self, request):
        return False  # Prevent manual creation (use get_or_create)


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

        # Fetch original with row lock to prevent race conditions
        with db_transaction.atomic():
            original_obj = WithdrawalRequest.objects.select_for_update().get(pk=obj.pk)
            old_status = original_obj.status
            new_status = obj.status

            if old_status == new_status:
                super().save_model(request, obj, form, change)
                return

            # Block reversal of completed mobile withdrawals
            if obj.method == 'mobile' and old_status == 'completed':
                messages.warning(request, "Completed mobile withdrawals cannot be reverted.")
                return  # Do not save

            # Ensure reference_code exists (important for old records)
            if not obj.reference_code:
                obj.save(update_fields=['reference_code'])  # Triggers model's save() → generates code

            # Save the withdrawal request
            super().save_model(request, obj, form, change)

            # Sync status to linked transaction with full save
            if obj.linked_transaction_id:
                from wallets.models import WalletTransaction
                tx = WalletTransaction.objects.select_for_update().get(pk=obj.linked_transaction_id)
                tx.status = new_status
                tx.save()  # Full save triggers balance update

            # 👇 SEND EMAIL IF TRANSITIONED TO 'COMPLETED'
            if new_status == 'completed' and old_status != 'completed':
                # Ensure processed_at is set
                if not obj.processed_at:
                    obj.processed_at = timezone.now()
                    obj.save(update_fields=['processed_at'])
                # Send notification email using unified utility
                notify_user_withdrawal_completed(obj)

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'