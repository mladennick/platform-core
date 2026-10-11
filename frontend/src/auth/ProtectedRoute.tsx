import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="centered">Loading…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    user.requires_password_change &&
    location.pathname !== "/force-password"
  ) {
    return <Navigate to="/force-password" replace />;
  }

  return <Outlet />;
}
