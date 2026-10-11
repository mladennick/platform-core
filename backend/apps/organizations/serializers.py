from rest_framework import serializers

from apps.common.permissions import MANAGE_ORG, user_has_core_perm

from .models import DEFAULT_ORG_FEATURES, Organization


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = (
            "id",
            "name",
            "vat_number",
            "domain",
            "features",
            "is_active",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "is_active", "created_at", "updated_at")

    def validate_features(self, value):
        if value is None:
            return default_merged({})
        if not isinstance(value, dict):
            raise serializers.ValidationError("features must be an object.")
        cleaned = {}
        for key, enabled in value.items():
            if key not in DEFAULT_ORG_FEATURES:
                raise serializers.ValidationError(f"Unknown feature '{key}'.")
            cleaned[key] = bool(enabled)
        return default_merged(cleaned)

    def update(self, instance, validated_data):
        request = self.context.get("request")
        if "features" in validated_data and request:
            if not user_has_core_perm(request.user, MANAGE_ORG):
                raise serializers.ValidationError(
                    {"features": "You do not have permission to change features."}
                )
        return super().update(instance, validated_data)


def default_merged(partial: dict) -> dict:
    merged = dict(DEFAULT_ORG_FEATURES)
    merged.update(partial)
    return merged
