import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiError } from "../lib/api";
import type { OrganizationInvite, OrgUser, Paginated, Role } from "../types";

export function OrgUsersPage() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [invites, setInvites] = useState<OrganizationInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("USER");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"USER" | "ADMIN">("USER");

  const loadUsers = useCallback(async () => {
    const data = await apiRequest<Paginated<OrgUser>>("/organization/users/");
    setUsers(data.results);
  }, []);

  const loadInvites = useCallback(async () => {
    const data = await apiRequest<
      Paginated<OrganizationInvite> | OrganizationInvite[]
    >("/organization/invites/");
    setInvites(Array.isArray(data) ? data : data.results);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadUsers(), loadInvites()]);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? "Could not load users/invites."
              : "Network error.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadUsers, loadInvites]);

  async function copyText(text: string, id?: string) {
    try {
      await navigator.clipboard.writeText(text);
      if (id) {
        setCopiedId(id);
        window.setTimeout(() => setCopiedId(null), 2000);
      }
    } catch {
      setError("Could not copy to clipboard.");
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      await apiRequest<OrgUser>("/organization/users/", {
        method: "POST",
        body: JSON.stringify({
          username,
          email,
          password,
          role,
        }),
      });
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("USER");
      setMessage("User created.");
      await loadUsers();
    } catch {
      setError("Create failed (manage_users required).");
    }
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const invite = await apiRequest<OrganizationInvite>(
        "/organization/invites/",
        {
          method: "POST",
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole,
          }),
        },
      );
      setInviteEmail("");
      setInviteRole("USER");
      setMessage(`Invite created for ${invite.email}.`);
      if (invite.invite_url) setLastInviteUrl(invite.invite_url);
      await loadInvites();
    } catch {
      setError("Invite failed (email may already be invited or registered).");
    }
  }

  async function onRevoke(id: string) {
    setMessage(null);
    setError(null);
    try {
      await apiRequest(`/organization/invites/${id}/`, { method: "DELETE" });
      setMessage("Invite revoked.");
      await loadInvites();
    } catch {
      setError("Revoke failed.");
    }
  }

  async function onDeactivate(id: string) {
    setMessage(null);
    setError(null);
    try {
      await apiRequest(`/organization/users/${id}/`, { method: "DELETE" });
      setMessage("User deactivated.");
      await loadUsers();
    } catch {
      setError("Deactivate failed.");
    }
  }

  if (loading) return <div className="centered">Loading…</div>;

  return (
    <section className="panel">
      <h1>Organization users</h1>
      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {lastInviteUrl ? (
        <div className="invite-banner">
          <strong>Invite link (copy this)</strong>
          <input readOnly value={lastInviteUrl} onFocus={(e) => e.target.select()} />
          <button
            type="button"
            className="btn primary"
            onClick={() => copyText(lastInviteUrl, "last")}
          >
            {copiedId === "last" ? "Copied" : "Copy link"}
          </button>
        </div>
      ) : null}

      <table className="table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Active</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.is_active ? "yes" : "no"}</td>
              <td>
                {u.is_active ? (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => onDeactivate(u.id)}
                  >
                    Deactivate
                  </button>
                ) : (
                  <span className="muted">inactive</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Invite by email</h2>
      <form className="stack" onSubmit={onInvite}>
        <label>
          Email
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Role
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as "USER" | "ADMIN")}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <button className="btn primary" type="submit">
          Send invite
        </button>
      </form>

      <h2>Pending invites</h2>
      <p className="muted">
        Use <strong>Copy link</strong> here anytime — you do not need the green
        flash message.
      </p>
      <table className="table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Expires</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {invites.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.email}</td>
              <td>{inv.role}</td>
              <td>{new Date(inv.expires_at).toLocaleString()}</td>
              <td className="actions-cell">
                {inv.invite_url ? (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => copyText(inv.invite_url!, inv.id)}
                  >
                    {copiedId === inv.id ? "Copied" : "Copy link"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => onRevoke(inv.id)}
                >
                  Revoke
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {invites.length === 0 ? (
        <p className="muted">No pending invites.</p>
      ) : null}

      <h2>Create user</h2>
      <form className="stack" onSubmit={onCreate}>
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <label>
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <button className="btn primary" type="submit">
          Create
        </button>
      </form>
    </section>
  );
}
