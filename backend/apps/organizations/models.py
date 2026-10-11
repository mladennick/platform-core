import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import BaseModel

DEFAULT_ORG_FEATURES = {
    "billing": False,
    "audit": True,
}


def default_org_features():
    return dict(DEFAULT_ORG_FEATURES)


def default_invite_expiry():
    return timezone.now() + timedelta(days=7)


def generate_invite_token():
    return secrets.token_urlsafe(32)


class Organization(BaseModel):
    name = models.CharField(max_length=255)
    vat_number = models.CharField(max_length=50, blank=True, null=True)
    domain = models.CharField(max_length=100, blank=True, null=True, unique=True)
    features = models.JSONField(default=default_org_features, blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

    def has_feature(self, code: str) -> bool:
        features = self.features or {}
        if code in features:
            return bool(features[code])
        return bool(DEFAULT_ORG_FEATURES.get(code, False))


class OrganizationInvite(BaseModel):
    class Role(models.TextChoices):
        ADMIN = "ADMIN", "Organization Admin"
        USER = "USER", "Standard User"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="invites",
    )
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.USER)
    token = models.CharField(max_length=64, unique=True, default=generate_invite_token)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sent_invites",
    )
    expires_at = models.DateTimeField(default=default_invite_expiry)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} → {self.organization}"

    @property
    def is_pending(self) -> bool:
        return self.is_active and self.accepted_at is None

    @property
    def is_valid(self) -> bool:
        return (
            self.is_pending
            and self.expires_at is not None
            and self.expires_at > timezone.now()
        )
