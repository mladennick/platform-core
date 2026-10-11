import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, resetPasswordRequest } from "../lib/api";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const uid = useMemo(() => params.get("uid") || "", [params]);
  const token = useMemo(() => params.get("token") || "", [params]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await resetPasswordRequest({
        uid,
        token,
        new_password: password,
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? "Invalid or expired reset link."
          : "Unable to reach the API.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!uid || !token) {
    return (
      <div className="auth-page">
        <div className="panel auth-panel">
          <h2>Invalid reset link</h2>
          <p className="muted">Missing uid or token.</p>
          <Link to="/forgot-password">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-stage single">
        <form className="panel auth-panel" onSubmit={onSubmit}>
          <p className="eyebrow">platform-core</p>
          <h2>Choose a new password</h2>
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
            {submitting ? "Saving…" : "Reset password"}
          </button>
          <p className="auth-switch">
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
