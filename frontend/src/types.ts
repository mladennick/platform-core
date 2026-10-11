export type Role = "SUPERADMIN" | "ADMIN" | "USER";

export type Permission =
  | "manage_users"
  | "manage_org"
  | "view_audit"
  | "manage_billing";

export interface OrgFeatures {
  billing?: boolean;
  audit?: boolean;
  [key: string]: boolean | undefined;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  organization: string | null;
  organization_name: string | null;
  organization_features: OrgFeatures;
  permissions: Permission[];
  permission_overrides: Record<string, boolean>;
  requires_password_change: boolean;
  is_active: boolean;
  date_joined: string;
}

export interface Organization {
  id: string;
  name: string;
  vat_number: string | null;
  domain: string | null;
  features: OrgFeatures;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active: boolean;
  requires_password_change: boolean;
  permission_overrides: Record<string, boolean>;
  permissions: Permission[];
  date_joined: string;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface AuditEvent {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown>;
  actor: string | null;
  actor_username: string | null;
  organization: string | null;
  created_at: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  price_cents: number;
  interval: string;
  metadata: Record<string, unknown>;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  plan: string;
  plan_detail: Plan;
  status: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationInvite {
  id: string;
  email: string;
  role: "ADMIN" | "USER";
  expires_at: string;
  accepted_at: string | null;
  is_active: boolean;
  invited_by: string | null;
  invited_by_username: string | null;
  created_at: string;
  invite_url?: string;
}
