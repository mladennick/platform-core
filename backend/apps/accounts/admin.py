from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = (
        "username",
        "email",
        "role",
        "organization",
        "is_active",
        "is_staff",
    )
    list_filter = ("role", "is_active", "is_staff", "organization")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("username",)

    fieldsets = DjangoUserAdmin.fieldsets + (
        (
            "Organization",
            {
                "fields": (
                    "organization",
                    "role",
                    "permission_overrides",
                    "requires_password_change",
                )
            },
        ),
    )
    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        (
            "Organization",
            {
                "fields": (
                    "organization",
                    "role",
                    "permission_overrides",
                    "requires_password_change",
                )
            },
        ),
    )
