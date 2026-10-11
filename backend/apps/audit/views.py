from rest_framework import generics
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.common.permissions import VIEW_AUDIT, HasFeature, HasPerm, user_has_core_perm

from .models import AuditEvent
from .serializers import AuditEventSerializer


class AuditEventListView(generics.ListAPIView):
    serializer_class = AuditEventSerializer
    permission_classes = [HasFeature, HasPerm]
    required_feature = "audit"
    required_perm = VIEW_AUDIT

    def get_queryset(self):
        user = self.request.user
        if not user.organization_id:
            raise NotFound("No organization associated with this user.")
        if not user.organization.has_feature("audit"):
            raise PermissionDenied("Audit module is disabled for this organization.")
        if not user_has_core_perm(user, VIEW_AUDIT):
            raise PermissionDenied("Missing permission: view_audit.")
        return AuditEvent.objects.filter(organization=user.organization)
