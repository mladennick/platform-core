# platform-core

Forkable B2B SaaS **core** template: a Django REST API and a React (Vite + TypeScript) console that share JWT auth, multi-tenant organizations, UUID models, and soft-delete — ready to fork into product apps.

| Layer | Stack |
|-------|--------|
| Backend | Python / Django / DRF / SimpleJWT / PostgreSQL |
| Frontend | React / Vite / TypeScript |
| Tenancy | `Organization` + roles + permission overrides |
| Modules | Org feature flags (`audit`, `billing`, …) |

License: [MIT](LICENSE). How to extend after a fork: [FORKING.md](FORKING.md).

> **Folder name:** this repo is intended to live as `platform-core`. If the directory is still named `BE` (Cursor may lock it while open), close the workspace and rename from `Documenti\SW`:
> `Rename-Item BE platform-core`  
> or run [`scripts/rename-root-to-platform-core.ps1`](scripts/rename-root-to-platform-core.ps1).

## Structure

```
platform-core/
  backend/          # Django + DRF API
  frontend/         # React + Vite + TypeScript
  docker-compose.yml
```

## Prerequisites

- Python 3.14+
- Node.js 20+
- Docker Desktop (`docker compose`)

## Quick start

### 1. Database

```powershell
docker compose up -d
```

Postgres is published on **host port 5433**.

### 2. Backend

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py runserver
```

API docs: http://127.0.0.1:8000/api/v1/docs/

Local email uses the **console** backend (reset links print in the runserver terminal). With `DEBUG=True`, `POST /auth/password/forgot/` also returns `reset_url`.

### 3. Create the first tenant

**Option A — UI:** open the frontend and use **Create organization** (`/register`).

**Option B — CLI:**

```powershell
python manage.py bootstrap_core --org-name "My Company" --username "owner" --email "owner@example.com" --password "ChooseAStrongPass1!"
```

### 4. Frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

App: http://127.0.0.1:5173/

## Permissions & modules

**Permission codes** (role defaults + per-user `permission_overrides`):

- `manage_users`, `manage_org`, `view_audit`, `manage_billing`
- ADMIN / SUPERADMIN → all by default; USER → none
- Effective list is exposed on `GET /me/` as `permissions`

**Organization features** (`Organization.features` JSON):

- Defaults: `audit=true`, `billing=false`
- Toggle via Organization UI / `PATCH /organization/`
- Module APIs require **feature on** + matching permission

**Invites:** admins with `manage_users` send email invites from **Users**. Guests open `/accept-invite?token=...`, set username/password, and join the org. With `DEBUG=True`, create-invite also returns `invite_url` (and the console email backend prints the link).

## Core API (summary)

| Method | Path |
|--------|------|
| POST | `/api/v1/auth/token/` |
| POST | `/api/v1/auth/token/refresh/` |
| POST | `/api/v1/auth/register/` |
| POST | `/api/v1/auth/password/forgot/` |
| POST | `/api/v1/auth/password/reset/` |
| GET/PATCH | `/api/v1/me/` |
| POST | `/api/v1/me/password/` |
| GET/PATCH | `/api/v1/organization/` |
| GET/POST | `/api/v1/organization/users/` |
| GET/PATCH/DELETE | `/api/v1/organization/users/{id}/` |
| GET/POST | `/api/v1/organization/invites/` |
| DELETE | `/api/v1/organization/invites/{id}/` |
| POST | `/api/v1/organization/invites/accept/` |
| GET | `/api/v1/audit/events/` |
| GET | `/api/v1/billing/plans/` |
| GET/PATCH | `/api/v1/billing/subscription/` |
| POST | `/api/v1/billing/webhooks/stripe/` |
