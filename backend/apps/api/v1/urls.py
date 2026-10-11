from django.db import connection
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.password_views import ForgotPasswordView, ResetPasswordView
from apps.accounts.views import ChangePasswordView, MeView, RegisterView
from apps.audit.views import AuditEventListView
from apps.billing.views import PlanListView, StripeWebhookStubView, SubscriptionDetailView
from apps.organizations.invite_views import (
    AcceptInviteView,
    OrganizationInviteDestroyView,
    OrganizationInviteListCreateView,
)
from apps.organizations.views import OrganizationDetailView, OrganizationUserViewSet


class HealthView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        try:
            connection.ensure_connection()
            db_ok = True
        except Exception:
            db_ok = False
        status_code = 200 if db_ok else 503
        return Response(
            {"status": "ok" if db_ok else "degraded", "database": db_ok},
            status=status_code,
        )


router = DefaultRouter()
router.register(
    r"organization/users",
    OrganizationUserViewSet,
    basename="organization-users",
)

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path(
        "schema/",
        SpectacularAPIView.as_view(permission_classes=[AllowAny]),
        name="schema",
    ),
    path(
        "docs/",
        SpectacularSwaggerView.as_view(
            url_name="schema",
            permission_classes=[AllowAny],
        ),
        name="swagger-ui",
    ),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/register/", RegisterView.as_view(), name="auth_register"),
    path("auth/password/forgot/", ForgotPasswordView.as_view(), name="password_forgot"),
    path("auth/password/reset/", ResetPasswordView.as_view(), name="password_reset"),
    path("me/", MeView.as_view(), name="me"),
    path("me/password/", ChangePasswordView.as_view(), name="me-password"),
    path("organization/", OrganizationDetailView.as_view(), name="organization"),
    path(
        "organization/invites/",
        OrganizationInviteListCreateView.as_view(),
        name="organization-invites",
    ),
    path(
        "organization/invites/accept/",
        AcceptInviteView.as_view(),
        name="organization-invites-accept",
    ),
    path(
        "organization/invites/<uuid:pk>/",
        OrganizationInviteDestroyView.as_view(),
        name="organization-invites-detail",
    ),
    path("audit/events/", AuditEventListView.as_view(), name="audit-events"),
    path("billing/plans/", PlanListView.as_view(), name="billing-plans"),
    path(
        "billing/subscription/",
        SubscriptionDetailView.as_view(),
        name="billing-subscription",
    ),
    path(
        "billing/webhooks/stripe/",
        StripeWebhookStubView.as_view(),
        name="billing-stripe-webhook",
    ),
    path("", include(router.urls)),
]
