# support/admin.py
from django.contrib import admin
from .models import SupportTicket, SupportMessage

class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    extra = 1
    fields = ('message',)  # Only message is editable
    readonly_fields = ('sender', 'is_admin', 'created_at')
    can_delete = False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'subject', 'category', 'status', 'created_at']
    list_filter = ['category', 'status', 'created_at']
    search_fields = ['user__email', 'subject']
    inlines = [SupportMessageInline]
    readonly_fields = ('user', 'subject', 'category', 'created_at', 'updated_at')
    fields = ('user', 'subject', 'category', 'status', 'created_at', 'updated_at')

    def save_formset(self, request, form, formset, change):
        """
        Auto-set sender and is_admin for new SupportMessage instances.
        """
        instances = formset.save(commit=False)
        for instance in instances:
            if not instance.pk:  # New message
                # Resolve the lazy user object
                instance.sender = request.user._wrapped if hasattr(request.user, '_wrapped') else request.user
                instance.is_admin = True
                instance.save()
        formset.save_m2m()

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)