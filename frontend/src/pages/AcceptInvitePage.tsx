import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError, acceptInviteRequest, setTokens } from "../lib/api";

function extractToken(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  try {
    if (value.includes("token=")) {
      const url = value.includes("://")
        ? new URL(value)
        : new URL(value, window.location.origin);
      return url.searchParams.get("token") || "";
    }
  } catch {
    // fall through — treat as raw token
  }
  return value;
}

export function AcceptInvitePage() {
  const { user, loading, refreshUser } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const urlToken = useMemo(() => params.get("token") || "", [params]);

  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState(urlToken);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  function onContinueWithToken(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const raw = tokenInput.trim();
    if (raw.includes("@") && !raw.includes("token=")) {
      setError(
        "That looks like an email. Paste the invite link instead (it contains ?token=...).",
      );
      return;
    }
    const parsed = extractToken(raw);
    if (!parsed) {
      setError("Paste the full invite link or the token value.");
      return;
    }
    setToken(parsed);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const tokens = await acceptInviteRequest({ token, username, password });
      setTokens(tokens);
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as Record<string, unknown> | null;
        const first =
          body &&
          Object.values(body)
            .flatMap((v) => (Array.isArray(v) ? v : [v]))
            .find((v) => typeof v === "string");
        setError(
          typeof first === "string"
            ? first
            : "Could not accept invite. It may be expired.",
        );
      } else {
        setError("Unable to reach the API.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-stage single">
          <form className="panel auth-panel" onSubmit={onContinueWithToken}>
            <p className="eyebrow">platform-core</p>
            <h2>Accept invitation</h2>
            <p className="muted">
              Paste the invite link you received (or the token). In local DEBUG
              it appears under Users after you send an invite.
            </p>
            <label>
              Invite link or token
              <input
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="http://127.0.0.1:5173/accept-invite?token=..."
                required
              />
            </label>
            {error ? <p className="error">{error}</p> : null}
            <button className="btn primary" type="submit">
              Continue
            </button>
            <p className="auth-switch">
              <Link to="/login">Back to sign in</Link>
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-stage single">
        <form className="panel auth-panel" onSubmit={onSubmit}>
          <p className="eyebrow">platform-core</p>
          <h2>Accept invitation</h2>
          <p className="muted">
            Choose a username and password to join the organization.
          </p>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? "Joining…" : "Join organization"}
          </button>
          <p className="auth-switch">
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
