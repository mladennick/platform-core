import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function HomePage() {
  const { user } = useAuth();

  return (
    <section className="panel hero-panel">
      <p className="eyebrow">Welcome</p>
      <h1>Core console</h1>
      <p className="lead">
        Signed in as <strong>{user?.username}</strong>
        {user?.organization_name ? (
          <>
            {" "}
            · org <strong>{user.organization_name}</strong>
          </>
        ) : null}
      </p>
      <div className="card-grid">
        <Link className="nav-card" to="/me">
          <h3>Profile</h3>
          <p>View and update your account details.</p>
        </Link>
        <Link className="nav-card" to="/organization">
          <h3>Organization</h3>
          <p>Edit tenant name, VAT, and domain.</p>
        </Link>
        <Link className="nav-card" to="/organization/users">
          <h3>Users</h3>
          <p>Invite members and manage roles.</p>
        </Link>
      </div>
    </section>
  );
}
