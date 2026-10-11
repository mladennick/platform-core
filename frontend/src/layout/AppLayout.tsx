import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function AppLayout() {
  const { user, logout } = useAuth();
  const perms = user?.permissions ?? [];
  const features = user?.organization_features ?? {};

  const showUsers = perms.includes("manage_users") || perms.includes("manage_org");
  const showAudit = Boolean(features.audit) && perms.includes("view_audit");
  const showBilling = Boolean(features.billing);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand">platform-core</span>
          <span className="brand-sub">console</span>
        </div>
        <nav className="nav">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/me">Me</NavLink>
          <NavLink to="/organization">Organization</NavLink>
          {showUsers ? (
            <NavLink to="/organization/users">Users</NavLink>
          ) : null}
          {showAudit ? <NavLink to="/audit">Audit</NavLink> : null}
          {showBilling ? <NavLink to="/billing">Billing</NavLink> : null}
        </nav>
        <div className="topbar-meta">
          <div className="user-chip">
            <span className="user-name">{user?.username}</span>
            <span className="user-role">{user?.role}</span>
          </div>
          <button type="button" className="btn ghost" onClick={logout}>
            Logout
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
