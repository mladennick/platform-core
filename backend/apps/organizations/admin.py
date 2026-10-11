from django.contrib import admin

from .models import Organization, OrganizationInvite


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("name", "domain", "vat_number", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name", "domain", "vat_number")
    ordering = ("name",)


@admin.register(OrganizationInvite)
class OrganizationInviteAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "organization",
        "role",
        "is_active",
        "expires_at",
        "accepted_at",
        "created_at",
    )
    list_filter = ("role", "is_active")
    search_fields = ("email", "organization__name", "token")
    readonly_fields = ("token",)
