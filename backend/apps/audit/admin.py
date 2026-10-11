from django.contrib import admin

from .models import AuditEvent


@admin.register(AuditEvent)
class AuditEventAdmin(admin.ModelAdmin):
    list_display = ("action", "organization", "actor", "entity_type", "created_at")
    list_filter = ("action", "entity_type")
    search_fields = ("action", "entity_id", "actor__username")
