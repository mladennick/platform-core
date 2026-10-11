from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.permissions import ALL_PERMISSIONS, MANAGE_USERS, user_has_core_perm
from apps.organizations.models import Organization

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    organization_name = serializers.CharField(max_length=255)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True, default="")
    password = serializers.CharField(write_only=True)
    domain = serializers.CharField(
        max_length=100, required=False, allow_blank=True, allow_null=True
    )

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return value

    def validate_domain(self, value):
        if value in ("", None):
            return None
        if Organization.all_objects.filter(domain=value).exists():
            raise serializers.ValidationError(
                "An organization with that domain already exists."
            )
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    @transaction.atomic
    def save(self, **kwargs):
        data = self.validated_data
        org = Organization.objects.create(
            name=data["organization_name"],
            domain=data.get("domain"),
        )
        user = User.objects.create_user(
            username=data["username"],
            email=data.get("email") or "",
            password=data["password"],
            organization=org,
            role=User.Role.ADMIN,
        )
        from apps.audit.services import log_event

        log_event(
            organization=org,
            actor=user,
            action="auth.registered",
            entity_type="organization",
            entity_id=str(org.id),
            metadata={"username": user.username},
        )
        refresh = RefreshToken.for_user(user)
        return {
            "user": user,
            "organization": org,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }


class MeSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(
        source="organization.name", read_only=True, allow_null=True
    )
    permissions = serializers.SerializerMethodField()
    organization_features = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "organization",
            "organization_name",
            "organization_features",
            "permissions",
            "permission_overrides",
            "requires_password_change",
            "is_active",
            "date_joined",
        )
        read_only_fields = (
            "id",
            "role",
            "organization",
            "organization_name",
            "organization_features",
            "permissions",
            "permission_overrides",
            "requires_password_change",
            "is_active",
            "date_joined",
        )

    def get_permissions(self, obj):
        return obj.get_effective_permissions()

    def get_organization_features(self, obj):
        if not obj.organization_id:
            return {}
        return obj.organization.features or {}


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        # Forced change may skip current password when flag is set
        if not user.requires_password_change:
            current = attrs.get("current_password") or ""
            if not user.check_password(current):
                raise serializers.ValidationError(
                    {"current_password": "Current password is incorrect."}
                )
        validate_password(attrs["new_password"], user)
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.requires_password_change = False
        user.save(update_fields=["password", "requires_password_change"])
        return user


class OrganizationUserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_active",
            "requires_password_change",
            "permission_overrides",
            "permissions",
            "password",
            "date_joined",
        )
        read_only_fields = ("id", "date_joined", "permissions")

    def get_permissions(self, obj):
        return obj.get_effective_permissions()

    def validate_role(self, value):
        request = self.context["request"]
        actor = request.user
        if value == User.Role.SUPERADMIN and actor.role != User.Role.SUPERADMIN:
            raise serializers.ValidationError("Cannot assign SUPERADMIN role.")
        if actor.role != User.Role.SUPERADMIN and value not in (
            User.Role.ADMIN,
            User.Role.USER,
        ):
            raise serializers.ValidationError("Invalid role for organization admin.")
        return value

    def validate_permission_overrides(self, value):
        if value is None:
            return {}
        if not isinstance(value, dict):
            raise serializers.ValidationError("Must be an object.")
        cleaned = {}
        for key, enabled in value.items():
            if key not in ALL_PERMISSIONS:
                raise serializers.ValidationError(f"Unknown permission '{key}'.")
            cleaned[key] = bool(enabled)
        return cleaned

    def validate(self, attrs):
        request = self.context["request"]
        if "permission_overrides" in attrs and not user_has_core_perm(
            request.user, MANAGE_USERS
        ):
            raise serializers.ValidationError(
                {"permission_overrides": "Missing permission: manage_users."}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        organization = (
            validated_data.pop("organization", None) or self.context["organization"]
        )
        user = User(**validated_data, organization=organization)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
            user.requires_password_change = True
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
            instance.requires_password_change = True
        instance.save()
        return instance
