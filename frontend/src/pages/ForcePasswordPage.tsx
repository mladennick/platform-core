import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError, changePasswordRequest } from "../lib/api";

export function ForcePasswordPage() {
  const { user, loading, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && user && !user.requires_password_change) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await changePasswordRequest({ new_password: password });
      await refreshUser();
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? "Could not update password."
          : "Unable to reach the API.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-stage single">
        <form className="panel auth-panel" onSubmit={onSubmit}>
          <p className="eyebrow">Security</p>
          <h2>Password change required</h2>
          <p className="muted">
            Your account requires a new password before you can continue.
          </p>
          <label>
            New password
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
            {submitting ? "Saving…" : "Update password"}
          </button>
          <button type="button" className="btn ghost" onClick={logout}>
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
