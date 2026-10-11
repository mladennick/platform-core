import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError, forgotPasswordRequest } from "../lib/api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setDebugUrl(null);
    setSubmitting(true);
    try {
      const result = await forgotPasswordRequest(email);
      setMessage(result.detail);
      if (result.reset_url) setDebugUrl(result.reset_url);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? "Request failed."
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
          <p className="eyebrow">platform-core</p>
          <h2>Forgot password</h2>
          <p className="muted">
            Enter your account email. In local dev the reset link is printed in
            the API console (and returned here when DEBUG is on).
          </p>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          {message ? <p className="success">{message}</p> : null}
          {debugUrl ? (
            <p className="muted">
              Debug link: <a href={debugUrl}>{debugUrl}</a>
            </p>
          ) : null}
          {error ? <p className="error">{error}</p> : null}
          <button className="btn primary" type="submit" disabled={submitting}>
            {submitting ? "Sending…" : "Send reset link"}
          </button>
          <p className="auth-switch">
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
