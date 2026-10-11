# Forking platform-core

`platform-core` is a **template repository**. Product applications should fork (or copy) it and add domain-specific features on top of the stable core.

## What is core

Treat these as the shared contract. Prefer extension over rewrite.

### Backend

| Area | Location |
|------|----------|
| Soft-delete / UUID base | `backend/apps/common/` |
| Permissions helpers | `backend/apps/common/permissions.py` |
| Custom user + JWT `/me` | `backend/apps/accounts/` |
| Tenant organization + features | `backend/apps/organizations/` |
| Audit log | `backend/apps/audit/` |
| Billing stub | `backend/apps/billing/` |
| Versioned API wiring | `backend/apps/api/v1/` |
| Settings | `backend/config/settings/` |

Core behaviors:

- Multi-tenancy via `User.organization`
- Soft-delete via `BaseModel.is_active` (and `User.is_active` for members)
- JWT auth (`simplejwt`)
- Roles: `SUPERADMIN` / `ADMIN` / `USER` plus `permission_overrides`
- Org modules via `Organization.features` (enable per tenant)
- Audit events for sensitive admin actions
- Billing Plan/Subscription stubs + Stripe webhook placeholder

### Frontend

| Area | Location |
|------|----------|
| API client + tokens | `frontend/src/lib/api.ts` |
| Auth session | `frontend/src/auth/` |
| Core pages | `frontend/src/pages/` |
| App shell | `frontend/src/layout/` |

## Adding a product module

1. Add a feature key (e.g. `inventory`) to `DEFAULT_ORG_FEATURES` in `organizations/models.py`.
2. Create `backend/apps/<product>/` and gate views with `HasFeature` + `HasPerm` (or a new permission code in `ALL_PERMISSIONS`).
3. Expose routes under `/api/v1/`.
4. Add FE nav/page only when `organization_features.<key>` and the user has the permission.
5. Prefer FK to `Organization` / `User`; log important mutations with `apps.audit.services.log_event`.

## How to extend a product fork

1. **New Django domain app** under `backend/apps/<product>/`
2. Register it in `INSTALLED_APPS` (`backend/config/settings/base.py`)
3. Expose endpoints under `/api/v1/` by including routers in `backend/apps/api/v1/urls.py`
4. Scope querysets by `request.user.organization`
5. Add product pages under `frontend/src/pages/<product>/` and routes in `App.tsx`

## Rules of thumb

- Do **not** change `AUTH_USER_MODEL` after the first migration in a live product DB.
- Avoid renaming core URL prefixes without a client migration plan.
- Keep secrets out of git (`.env`, passwords, personal emails, Stripe keys, DB dumps).
- Upstream improvements: pull carefully from platform-core; resolve conflicts in product apps when possible.

## Suggested product layout after fork

```
your-product/
  backend/apps/inventory/     # example product app
  frontend/src/pages/inventory/
  README.md                   # product-specific runbook
```
