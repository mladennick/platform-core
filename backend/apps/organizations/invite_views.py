from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from rest_framework import generics, status
from rest_framework.exceptions import NotFound
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import log_event
from apps.common.permissions import MANAGE_USERS, HasPerm

from .invite_serializers import AcceptInviteSerializer, OrganizationInviteSerializer
from .models import OrganizationInvite

User = get_user_model()


class OrganizationInviteListCreateView(generics.ListCreateAPIView):
    serializer_class = OrganizationInviteSerializer
    permission_classes = [HasPerm]
    required_perm = MANAGE_USERS

    def get_organization(self):
        user = self.request.user
        if not user.organization_id:
            raise NotFound("No organization associated with this user.")
        return user.organization

    def get_queryset(self):
        return OrganizationInvite.objects.filter(
            organization=self.get_organization(),
            is_active=True,
            accepted_at__isnull=True,
        )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["organization"] = self.get_organization()
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        org = self.get_organization()
        invite = OrganizationInvite.objects.create(
            organization=org,
            email=serializer.validated_data["email"],
            role=serializer.validated_data.get("role", OrganizationInvite.Role.USER),
            invited_by=request.user,
        )
        frontend = getattr(settings, "FRONTEND_URL", "http://127.0.0.1:5173").rstrip("/")
        mail_invite_url = f"{frontend}/accept-invite?token={invite.token}"
        send_mail(
            subject=f"Invitation to join {org.name}",
            message=(
                f"You have been invited to join {org.name} on platform-core.\n\n"
                f"Accept the invite:\n{mail_invite_url}\n"
            ),
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@localhost"),
            recipient_list=[invite.email],
            fail_silently=True,
        )
        log_event(
            organization=org,
            actor=request.user,
            action="invite.created",
            entity_type="invite",
            entity_id=str(invite.id),
            metadata={"email": invite.email, "role": invite.role},
        )
        data = OrganizationInviteSerializer(invite).data
        return Response(data, status=status.HTTP_201_CREATED)


class OrganizationInviteDestroyView(generics.DestroyAPIView):
    permission_classes = [HasPerm]
    required_perm = MANAGE_USERS
    lookup_field = "pk"

    def get_queryset(self):
        user = self.request.user
        if not user.organization_id:
            raise NotFound("No organization associated with this user.")
        return OrganizationInvite.objects.filter(
            organization=user.organization,
            is_active=True,
            accepted_at__isnull=True,
        )

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save(update_fields=["is_active", "updated_at"])
        log_event(
            organization=instance.organization,
            actor=self.request.user,
            action="invite.revoked",
            entity_type="invite",
            entity_id=str(instance.id),
            metadata={"email": instance.email},
        )


class AcceptInviteView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = AcceptInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        invite = result["invite"]
        log_event(
            organization=invite.organization,
            actor=result["user"],
            action="invite.accepted",
            entity_type="invite",
            entity_id=str(invite.id),
            metadata={"username": result["user"].username, "email": invite.email},
        )
        return Response(
            {
                "access": result["access"],
                "refresh": result["refresh"],
            },
            status=status.HTTP_201_CREATED,
        )
