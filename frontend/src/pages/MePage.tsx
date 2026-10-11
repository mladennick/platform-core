import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiRequest, ApiError } from "../lib/api";
import type { User } from "../types";

export function MePage() {
  const { user, refreshUser } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await apiRequest<User>("/me/", {
        method: "PATCH",
        body: JSON.stringify({
          email,
          first_name: firstName,
          last_name: lastName,
        }),
      });
      await refreshUser();
      setMessage("Profile updated.");
    } catch (err) {
      setError(err instanceof ApiError ? "Update failed." : "Network error.");
    }
  }

  if (!user) return null;

  return (
    <section className="panel">
      <h1>My profile</h1>
      <dl className="meta-grid">
        <div>
          <dt>Username</dt>
          <dd>{user.username}</dd>
        </div>
        <div>
          <dt>Role</dt>
          <dd>{user.role}</dd>
        </div>
        <div>
          <dt>Organization</dt>
          <dd>{user.organization_name ?? "—"}</dd>
        </div>
      </dl>
      <form className="stack" onSubmit={onSubmit}>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          First name
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </label>
        <label>
          Last name
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </label>
        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
        <button className="btn primary" type="submit">
          Save
        </button>
      </form>
    </section>
  );
}
