from django.utils import timezone
from rest_framework import generics, status
from rest_framework.exceptions import NotFound, PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.audit.services import log_event
from apps.common.permissions import (
    MANAGE_BILLING,
    HasFeature,
    HasPerm,
    IsOrganizationMember,
    user_has_core_perm,
)

from .models import Plan, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer


class PlanListView(generics.ListAPIView):
    serializer_class = PlanSerializer
    permission_classes = [HasFeature, IsOrganizationMember]
    required_feature = "billing"
    queryset = Plan.objects.filter(is_active=True)


class SubscriptionDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [HasFeature, IsOrganizationMember]
    required_feature = "billing"
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        user = self.request.user
        if not user.organization_id:
            raise NotFound("No organization associated with this user.")
        if not user.organization.has_feature("billing"):
            raise PermissionDenied("Billing module is disabled for this organization.")
        if self.request.method not in ("GET", "HEAD", "OPTIONS"):
            if not user_has_core_perm(user, MANAGE_BILLING):
                raise PermissionDenied("Missing permission: manage_billing.")
        sub = Subscription.objects.filter(organization=user.organization).first()
        if sub is None:
            free = Plan.objects.filter(code="free", is_active=True).first()
            if free is None:
                raise NotFound("No subscription and no free plan configured.")
            sub = Subscription.objects.create(
                organization=user.organization,
                plan=free,
                status=Subscription.Status.TRIALING,
            )
        return sub

    def perform_update(self, serializer):
        sub = serializer.save()
        log_event(
            organization=self.request.user.organization,
            actor=self.request.user,
            action="billing.subscription_updated",
            entity_type="subscription",
            entity_id=str(sub.id),
            metadata={
                "plan": sub.plan.code,
                "status": sub.status,
            },
        )


class StripeWebhookStubView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        # Placeholder for future Stripe signature verification
        event_type = request.data.get("type", "unknown")
        log_event(
            organization=None,
            actor=None,
            action="billing.stripe_webhook",
            entity_type="stripe_event",
            entity_id=str(request.data.get("id", "")),
            metadata={"type": event_type, "received_at": timezone.now().isoformat()},
        )
        return Response({"received": True}, status=status.HTTP_200_OK)
