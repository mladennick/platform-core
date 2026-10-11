import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.common.permissions import effective_permissions, user_has_core_perm


class User(AbstractUser):
    class Role(models.TextChoices):
        SUPERADMIN = "SUPERADMIN", "System Super Admin"
        ADMIN = "ADMIN", "Organization Admin"
        USER = "USER", "Standard User"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="users",
        null=True,
        blank=True,
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    requires_password_change = models.BooleanField(default=False)
    permission_overrides = models.JSONField(default=dict, blank=True)

    class Meta:
        ordering = ["username"]

    def __str__(self):
        return f"{self.username} - {self.role}"

    def has_core_perm(self, code: str) -> bool:
        return user_has_core_perm(self, code)

    def get_effective_permissions(self) -> list[str]:
        return effective_permissions(self)
