import type { TokenPair } from "../types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000/api/v1";

const ACCESS_KEY = "pc_access";
const REFRESH_KEY = "pc_refresh";

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message || `API error ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const response = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as { access: string };
  localStorage.setItem(ACCESS_KEY, data.access);
  return data.access;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const access = getAccessToken();
  if (access) {
    headers.set("Authorization", `Bearer ${access}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry && getRefreshToken()) {
    const newAccess = await refreshAccessToken();
    if (newAccess) {
      return apiRequest<T>(path, options, false);
    }
  }

  const body = await parseBody(response);
  if (!response.ok) {
    throw new ApiError(response.status, body);
  }
  return body as T;
}

export async function loginRequest(
  username: string,
  password: string,
): Promise<TokenPair> {
  return apiRequest<TokenPair>("/auth/token/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export interface RegisterPayload {
  organization_name: string;
  username: string;
  email?: string;
  password: string;
  domain?: string;
}

export async function registerRequest(
  payload: RegisterPayload,
): Promise<TokenPair> {
  return apiRequest<TokenPair>("/auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function forgotPasswordRequest(
  email: string,
): Promise<{ detail: string; reset_url?: string }> {
  return apiRequest("/auth/password/forgot/", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPasswordRequest(payload: {
  uid: string;
  token: string;
  new_password: string;
}): Promise<{ detail: string }> {
  return apiRequest("/auth/password/reset/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function changePasswordRequest(payload: {
  current_password?: string;
  new_password: string;
}): Promise<{ detail: string }> {
  return apiRequest("/me/password/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function acceptInviteRequest(payload: {
  token: string;
  username: string;
  password: string;
}): Promise<TokenPair> {
  return apiRequest<TokenPair>("/organization/invites/accept/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
