from rest_framework.permissions import SAFE_METHODS, BasePermission

# Core permission codes
MANAGE_USERS = "manage_users"
MANAGE_ORG = "manage_org"
VIEW_AUDIT = "view_audit"
MANAGE_BILLING = "manage_billing"

ALL_PERMISSIONS = (
    MANAGE_USERS,
    MANAGE_ORG,
    VIEW_AUDIT,
    MANAGE_BILLING,
)

ROLE_DEFAULTS = {
    "SUPERADMIN": set(ALL_PERMISSIONS),
    "ADMIN": set(ALL_PERMISSIONS),
    "USER": set(),
}


def role_default_permissions(role: str) -> set[str]:
    return set(ROLE_DEFAULTS.get(role, set()))


def effective_permissions(user) -> list[str]:
    if not user or not getattr(user, "is_authenticated", False):
        return []
    if getattr(user, "role", None) == "SUPERADMIN":
        return list(ALL_PERMISSIONS)
    granted = role_default_permissions(getattr(user, "role", "USER"))
    overrides = getattr(user, "permission_overrides", None) or {}
    for code, enabled in overrides.items():
        if code not in ALL_PERMISSIONS:
            continue
        if enabled:
            granted.add(code)
        else:
            granted.discard(code)
    return sorted(granted)


def user_has_core_perm(user, code: str) -> bool:
    if not user or not getattr(user, "is_authenticated", False):
        return False
    if getattr(user, "role", None) == "SUPERADMIN":
        return True
    return code in effective_permissions(user)


class IsOrganizationMember(BasePermission):
    """Allow authenticated users who belong to an organization, or SUPERADMIN."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == user.Role.SUPERADMIN:
            return True
        return user.organization_id is not None


class HasPerm(BasePermission):
    """Require a core permission code. Set `required_perm` on the view."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        code = getattr(view, "required_perm", None)
        if not code:
            return False
        return user_has_core_perm(user, code)


class HasPermOrReadOnly(BasePermission):
    """Allow SAFE methods for org members; writes require `required_perm`."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.role == user.Role.SUPERADMIN:
            return True
        if request.method in SAFE_METHODS:
            return user.organization_id is not None
        code = getattr(view, "required_perm", None)
        return bool(code and user_has_core_perm(user, code))


class HasFeature(BasePermission):
    """Require organization feature flag. Set `required_feature` on the view."""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        feature = getattr(view, "required_feature", None)
        if not feature:
            return False
        if user.role == user.Role.SUPERADMIN and not user.organization_id:
            return True
        org = getattr(user, "organization", None)
        if org is None:
            return False
        return org.has_feature(feature)


# Backward-compatible alias used during migration of views
class IsOrgAdmin(HasPermOrReadOnly):
    def has_permission(self, request, view):
        view.required_perm = MANAGE_USERS
        return super().has_permission(request, view)
