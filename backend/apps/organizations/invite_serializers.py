from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OrganizationInvite

User = get_user_model()


class OrganizationInviteSerializer(serializers.ModelSerializer):
    invited_by_username = serializers.CharField(
        source="invited_by.username", read_only=True, allow_null=True
    )
    invite_url = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationInvite
        fields = (
            "id",
            "email",
            "role",
            "expires_at",
            "accepted_at",
            "is_active",
            "invited_by",
            "invited_by_username",
            "invite_url",
            "created_at",
        )
        read_only_fields = (
            "id",
            "expires_at",
            "accepted_at",
            "is_active",
            "invited_by",
            "invited_by_username",
            "invite_url",
            "created_at",
        )

    def get_invite_url(self, obj):
        frontend = getattr(settings, "FRONTEND_URL", "http://127.0.0.1:5173").rstrip(
            "/"
        )
        return f"{frontend}/accept-invite?token={obj.token}"

    def validate_email(self, value):
        return value.strip().lower()

    def validate_role(self, value):
        if value not in (OrganizationInvite.Role.ADMIN, OrganizationInvite.Role.USER):
            raise serializers.ValidationError("Role must be ADMIN or USER.")
        return value

    def validate(self, attrs):
        org = self.context["organization"]
        email = attrs.get("email")
        if email and OrganizationInvite.objects.filter(
            organization=org,
            email=email,
            is_active=True,
            accepted_at__isnull=True,
        ).exists():
            raise serializers.ValidationError(
                {"email": "A pending invite already exists for this email."}
            )
        if email and User.objects.filter(email__iexact=email, is_active=True).exists():
            raise serializers.ValidationError(
                {"email": "A user with this email already exists."}
            )
        return attrs


class AcceptInviteSerializer(serializers.Serializer):
    token = serializers.CharField()
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):
        invite = (
            OrganizationInvite.objects.select_related("organization")
            .filter(token=attrs["token"])
            .first()
        )
        if invite is None or not invite.is_valid:
            raise serializers.ValidationError({"token": "Invalid or expired invite."})
        if User.objects.filter(email__iexact=invite.email, is_active=True).exists():
            raise serializers.ValidationError(
                {"token": "A user with this email already exists."}
            )
        attrs["invite"] = invite
        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        invite = self.validated_data["invite"]
        user = User.objects.create_user(
            username=self.validated_data["username"],
            email=invite.email,
            password=self.validated_data["password"],
            organization=invite.organization,
            role=invite.role,
        )
        invite.accepted_at = timezone.now()
        invite.is_active = False
        invite.save(update_fields=["accepted_at", "is_active", "updated_at"])
        refresh = RefreshToken.for_user(user)
        return {
            "user": user,
            "invite": invite,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }
