from datetime import timedelta

from django.contrib import admin, messages
from django.db import transaction
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse

from .models import (
    SubscriptionPlan,
    UserSubscription,
    SubscriptionTransaction,
    SubscriptionReceipt,
    SubscriptionEmailLog,
)


# ========================
# INLINE ADMIN CLASSES
# ========================

class SubscriptionTransactionInline(admin.TabularInline):
    model = SubscriptionTransaction
    extra = 0
    fields = ('amount', 'status', 'mpesa_receipt_number', 'checkout_request_id', 'created_at')
    readonly_fields = ('created_at', 'checkout_request_id')
    can_delete = False
    show_change_link = True
    verbose_name = "Payment Transaction"
    verbose_name_plural = "Payment Transactions"


class SubscriptionReceiptInline(admin.StackedInline):
    model = SubscriptionReceipt
    extra = 0
    fields = ('receipt_number', 'pdf_file', 'generated_at', 'downloaded_count')
    readonly_fields = ('receipt_number', 'generated_at', 'downloaded_count')
    can_delete = False
    verbose_name = "PDF Receipt"
    verbose_name_plural = "PDF Receipts"


# ========================
# PLAN ADMIN
# ========================

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier_level', 'price_kes', 'duration_days', 'trial_days', 'is_active')
    list_filter = ('is_active', 'name')
    search_fields = ('name', 'description', 'features')
    ordering = ('tier_level',)
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        ('Plan Details', {
            'fields': ('name', 'tier_level', 'price_kes', 'is_active')
        }),
        ('Duration & Trial', {
            'fields': ('duration_days', 'trial_days'),
            'description': 'Trial days must be less than or equal to duration days.'
        }),
        ('Content', {
            'fields': ('description', 'features'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    list_editable = ('is_active',)


# ========================
# TRANSACTION ADMIN
# ========================

@admin.register(SubscriptionTransaction)
class SubscriptionTransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user_email_link', 'plan_name', 'amount', 'status', 'mpesa_receipt_number', 'created_at')
    list_filter = ('status', 'subscription__plan__name', 'created_at')
    search_fields = ('user__email', 'mpesa_receipt_number', 'checkout_request_id', 'subscription__id')
    readonly_fields = ('created_at', 'updated_at', 'user', 'subscription')
    date_hierarchy = 'created_at'
    list_select_related = ('subscription__plan', 'user')

    def user_email_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_email_link.short_description = "User"

    def plan_name(self, obj):
        return obj.subscription.plan.get_name_display()
    plan_name.short_description = "Plan"

    def has_add_permission(self, request):
        return False  # Transactions are created via Daraja callbacks only

    def has_delete_permission(self, request, obj=None):
        return False  # Financial records should never be deleted


# ========================
# RECEIPT ADMIN
# ========================

@admin.register(SubscriptionReceipt)
class SubscriptionReceiptAdmin(admin.ModelAdmin):
    list_display = ('receipt_number', 'user_email_link', 'transaction_amount', 'generated_at', 'downloaded_count')
    search_fields = ('receipt_number', 'transaction__user__email')
    readonly_fields = ('receipt_number', 'transaction', 'pdf_file', 'generated_at', 'downloaded_count')
    list_select_related = ('transaction__user',)

    def user_email_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.transaction.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.transaction.user.email)
    user_email_link.short_description = "User"

    def transaction_amount(self, obj):
        return f"KES {obj.transaction.amount}"
    transaction_amount.short_description = "Amount"

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


# ========================
# EMAIL LOG ADMIN
# ========================

@admin.register(SubscriptionEmailLog)
class SubscriptionEmailLogAdmin(admin.ModelAdmin):
    list_display = ('email_type', 'recipient_email', 'subscription_plan', 'sent_at', 'delivered')
    list_filter = ('email_type', 'delivered', 'sent_at')
    search_fields = ('recipient_email', 'subscription__user__email')
    readonly_fields = ('subscription', 'email_type', 'sent_at', 'error_message', 'recipient_email')
    date_hierarchy = 'sent_at'
    list_select_related = ('subscription__plan',)

    def subscription_plan(self, obj):
        return f"{obj.subscription.plan.get_name_display()} (ID: {obj.subscription.id})"
    subscription_plan.short_description = "Subscription"

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return True  # Allow log cleanup if needed


# ========================
# USER SUBSCRIPTION ADMIN (MAIN)
# ========================

@admin.register(UserSubscription)
class UserSubscriptionAdmin(admin.ModelAdmin):
    list_display = (
        'user_email_link', 'plan_name', 'status_badge', 'tier_level',
        'start_date', 'end_date', 'grace_end_date', 'is_trial', 'auto_renew', 'created_at'
    )
    list_filter = ('status', 'is_trial', 'auto_renew', 'plan__name')
    search_fields = ('user__email', 'user__first_name', 'user__last_name', 'plan__name')
    date_hierarchy = 'created_at'
    list_select_related = ('user', 'plan', 'upgraded_from')
    prefetch_related = ('transactions', 'receipt')
    inlines = [SubscriptionTransactionInline]
    readonly_fields = ('created_at', 'updated_at', 'cancelled_at', 'upgraded_from')
    actions = [
        'activate_selected',
        'extend_7_days',
        'extend_30_days',
        'revoke_immediately',
        'disable_auto_renew',
        'enable_auto_renew',
    ]

    fieldsets = (
        ('Subscription Info', {
            'fields': ('user', 'plan', 'status', 'is_trial', 'auto_renew', 'upgraded_from')
        }),
        ('Billing Cycle', {
            'fields': ('start_date', 'end_date', 'grace_end_date', 'cancelled_at')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    # ========================
    # DISPLAY HELPERS
    # ========================

    def user_email_link(self, obj):
        url = reverse('admin:users_user_change', args=[obj.user.id])
        return format_html('<a href="{}">{}</a>', url, obj.user.email)
    user_email_link.short_description = "User"
    user_email_link.admin_order_field = 'user__email'

    def plan_name(self, obj):
        return obj.plan.get_name_display()
    plan_name.short_description = "Plan"
    plan_name.admin_order_field = 'plan__name'

    def tier_level(self, obj):
        return obj.plan.tier_level
    tier_level.short_description = "Tier"

    def status_badge(self, obj):
        colors = {
            'active': '#28a745',
            'pending': '#ffc107',
            'cancelled': '#dc3545',
            'expired': '#6c757d',
            'suspended': '#343a40',
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color:{}; color:white; padding:2px 6px; border-radius:3px; font-weight:bold;">{}</span>',
            color, obj.get_status_display().upper()
        )
    status_badge.short_description = "Status"

    # ========================
    # ADMIN ACTIONS
    # ========================

    @admin.action(description="Activate selected subscriptions")
    def activate_selected(self, request, queryset):
        count = 0
        for sub in queryset.filter(status__in=['pending', 'cancelled', 'expired', 'suspended']):
            with transaction.atomic():
                now = timezone.now()
                sub.status = 'active'
                if not sub.end_date or sub.end_date <= now:
                    sub.start_date = now
                    sub.end_date = now + timedelta(days=sub.plan.duration_days)
                sub.grace_end_date = sub.end_date + timedelta(days=2)
                sub.cancelled_at = None
                sub.save(update_fields=['status', 'start_date', 'end_date', 'grace_end_date', 'cancelled_at'])
            count += 1
        self.message_user(request, f'Successfully activated {count} subscription(s).')

    @admin.action(description="Extend selected by 7 days")
    def extend_7_days(self, request, queryset):
        self._extend_subscriptions(request, queryset, days=7)

    @admin.action(description="Extend selected by 30 days")
    def extend_30_days(self, request, queryset):
        self._extend_subscriptions(request, queryset, days=30)

    def _extend_subscriptions(self, request, queryset, days: int):
        count = 0
        for sub in queryset.filter(status='active'):
            with transaction.atomic():
                sub.end_date += timedelta(days=days)
                sub.grace_end_date = sub.end_date + timedelta(days=2)
                sub.save(update_fields=['end_date', 'grace_end_date', 'updated_at'])
            count += 1
        self.message_user(request, f'Extended {count} subscription(s) by {days} day(s).')

    @admin.action(description="Revoke access immediately")
    def revoke_immediately(self, request, queryset):
        count = 0
        for sub in queryset.filter(status__in=['active', 'pending']):
            with transaction.atomic():
                sub.status = 'cancelled'
                sub.cancelled_at = timezone.now()
                sub.end_date = timezone.now()
                sub.grace_end_date = None
                sub.auto_renew = False
                sub.save(update_fields=['status', 'cancelled_at', 'end_date', 'grace_end_date', 'auto_renew'])
            count += 1
        self.message_user(request, f'Immediately revoked access for {count} subscription(s).', level=messages.WARNING)

    @admin.action(description="Disable auto-renewal")
    def disable_auto_renew(self, request, queryset):
        updated = queryset.filter(auto_renew=True).update(auto_renew=False)
        self.message_user(request, f'Disabled auto-renewal for {updated} subscription(s).')

    @admin.action(description="Enable auto-renewal")
    def enable_auto_renew(self, request, queryset):
        updated = queryset.filter(auto_renew=False).update(auto_renew=True)
        self.message_user(request, f'Enabled auto-renewal for {updated} subscription(s).')