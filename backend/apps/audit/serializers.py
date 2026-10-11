from rest_framework import serializers

from .models import AuditEvent


class AuditEventSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(
        source="actor.username", read_only=True, allow_null=True
    )

    class Meta:
        model = AuditEvent
        fields = (
            "id",
            "action",
            "entity_type",
            "entity_id",
            "metadata",
            "actor",
            "actor_username",
            "organization",
            "created_at",
        )
        read_only_fields = fields
