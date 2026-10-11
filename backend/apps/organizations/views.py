from django.contrib.auth import get_user_model
from rest_framework import generics, viewsets
from rest_framework.exceptions import NotFound, PermissionDenied

from apps.accounts.serializers import OrganizationUserSerializer
from apps.common.permissions import (
    MANAGE_ORG,
    MANAGE_USERS,
    HasPermOrReadOnly,
    IsOrganizationMember,
    user_has_core_perm,
)

from .models import Organization
from .serializers import OrganizationSerializer

User = get_user_model()


class OrganizationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [IsOrganizationMember]

    def get_object(self):
        user = self.request.user
        if user.role == User.Role.SUPERADMIN and not user.organization_id:
            raise NotFound("No organization associated with this user.")
        if not user.organization_id:
            raise NotFound("No organization associated with this user.")
        org = Organization.objects.filter(pk=user.organization_id).first()
        if org is None:
            raise NotFound("Organization not found.")
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            if not user_has_core_perm(user, MANAGE_ORG):
                raise PermissionDenied("Missing permission: manage_org.")
        return org

    def perform_update(self, serializer):
        org = serializer.save()
        from apps.audit.services import log_event

        log_event(
            organization=org,
            actor=self.request.user,
            action="organization.updated",
            entity_type="organization",
            entity_id=str(org.id),
            metadata={"fields": list(serializer.validated_data.keys())},
        )


class OrganizationUserViewSet(viewsets.ModelViewSet):
    serializer_class = OrganizationUserSerializer
    permission_classes = [HasPermOrReadOnly]
    required_perm = MANAGE_USERS
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_organization(self):
        user = self.request.user
        if user.role == User.Role.SUPERADMIN and not user.organization_id:
            raise NotFound("No organization associated with this user.")
        if not user.organization_id:
            raise NotFound("No organization associated with this user.")
        return user.organization

    def get_queryset(self):
        org = self.get_organization()
        return User.objects.filter(organization=org).order_by("username")

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = self.get_organization()
        return context

    def perform_create(self, serializer):
        user = serializer.save(organization=self.get_organization())
        from apps.audit.services import log_event

        log_event(
            organization=self.get_organization(),
            actor=self.request.user,
            action="user.created",
            entity_type="user",
            entity_id=str(user.id),
            metadata={"username": user.username, "role": user.role},
        )

    def perform_update(self, serializer):
        user = serializer.save()
        from apps.audit.services import log_event

        log_event(
            organization=self.get_organization(),
            actor=self.request.user,
            action="user.updated",
            entity_type="user",
            entity_id=str(user.id),
            metadata={"fields": list(serializer.validated_data.keys())},
        )

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active"])
        from apps.audit.services import log_event

        log_event(
            organization=self.get_organization(),
            actor=self.request.user,
            action="user.deactivated",
            entity_type="user",
            entity_id=str(instance.id),
            metadata={"username": instance.username},
        )
