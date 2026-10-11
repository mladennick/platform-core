from .models import AuditEvent


def log_event(
    *,
    action: str,
    organization=None,
    actor=None,
    entity_type: str = "",
    entity_id: str = "",
    metadata: dict | None = None,
) -> AuditEvent | None:
    """Best-effort audit write; never breaks the main request flow."""
    try:
        return AuditEvent.objects.create(
            organization=organization,
            actor=actor if getattr(actor, "is_authenticated", False) else None,
            action=action,
            entity_type=entity_type or "",
            entity_id=str(entity_id) if entity_id else "",
            metadata=metadata or {},
        )
    except Exception:
        return None
