from django.contrib import admin
from .models import Job
from users.models import User

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'status', 'assigned_to', 'created_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['title', 'assigned_to__email', 'created_by__email']
    autocomplete_fields = ['assigned_to', 'created_by']

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "assigned_to":
            # Only show onboarded, non-closed users
            kwargs["queryset"] = User.objects.filter(is_onboarded=True, is_closed=False)
        elif db_field.name == "created_by":
            # Only show staff users (admins)
            kwargs["queryset"] = User.objects.filter(is_staff=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)