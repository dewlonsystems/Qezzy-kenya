# withdraws/admin.py
from django.contrib import admin
from django.db import transaction as db_transaction
from django.contrib import messages
from django.utils import timezone
from django.core.exceptions import ValidationError
from .models import WithdrawalRequest, SystemSetting
from wallets.services import reverse_completed_withdrawal
from .utils import notify_user_withdrawal_completed


@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    list_display = ['key', 'value', 'description', 'updated_at']
    list_editable = ['value']
    readonly_fields = ['key', 'updated_at']
    search_fields = ['key', 'description']
    list_display_links = None

    def get_queryset(self, request):
        SystemSetting.withdrawals_enabled()
        return super().get_queryset(request)

    def has_delete_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user_email', 'wallet_type', 'amount', 'method',
        'status', 'is_reversed', 'reference_code', 'created_at'
    ]
    list_filter = ['wallet_type', 'method', 'status', 'created_at']
    search_fields = ['user__email', 'reference_code']
    list_editable = ['status']
    ordering = ['-created_at']
    actions = ['reverse_withdrawal']

    def is_reversed(self, obj):
        from wallets.models import WalletTransaction
        return WalletTransaction.objects.filter(
            linked_withdrawal=obj,
            transaction_type='withdrawal_reversal'
        ).exists()
    is_reversed.boolean = True
    is_reversed.short_description = 'Reversed?'

    def get_readonly_fields(self, request, obj=None):
        if obj and obj.status in ['completed', 'failed']:
            return ['status']  # Lock status after finalization
        return []

    def save_model(self, request, obj, form, change):
        if not change:
            super().save_model(request, obj, form, change)
            return

        # Fetch original to check status transition
        original = WithdrawalRequest.objects.get(pk=obj.pk)
        old_status = original.status
        new_status = obj.status

        if old_status == new_status:
            super().save_model(request, obj, form, change)
            return

        # Enforce: only pending → completed/failed allowed
        if old_status != 'pending':
            messages.error(request, "Status cannot be changed after completion or failure.")
            return

        if new_status not in ['completed', 'failed']:
            messages.error(request, "Invalid status transition.")
            return

        # Save the updated status
        super().save_model(request, obj, form, change)

        # Auto-set processed_at on completion
        if new_status == 'completed' and not obj.processed_at:
            obj.processed_at = timezone.now()
            obj.save(update_fields=['processed_at'])

        # Send email on completion
        if new_status == 'completed':
            notify_user_withdrawal_completed(obj)

    def reverse_withdrawal(self, request, queryset):
        """
        Admin action to reverse completed withdrawals.
        """
        reversed_count = 0
        for withdrawal in queryset:
            if withdrawal.status != 'completed':
                self.message_user(
                    request,
                    f"Withdrawal {withdrawal.id} is not completed and cannot be reversed.",
                    level=messages.WARNING
                )
                continue

            try:
                reverse_completed_withdrawal(withdrawal, request.user, reason="Admin reversal via Django Admin")
                reversed_count += 1
            except ValidationError as e:
                self.message_user(request, f"Error reversing {withdrawal.id}: {e}", level=messages.ERROR)
            except Exception as e:
                self.message_user(request, f"Unexpected error reversing {withdrawal.id}: {e}", level=messages.ERROR)

        if reversed_count:
            self.message_user(
                request,
                f"Successfully reversed {reversed_count} withdrawal(s). New credit transactions created.",
                level=messages.SUCCESS
            )

    reverse_withdrawal.short_description = "Reverse selected completed withdrawals"

    def user_email(self, obj):
        return obj.user.email
    

    user_email.short_description = 'User'
    user_email.admin_order_field = 'user__email'