import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./layout/AppLayout";
import { AcceptInvitePage } from "./pages/AcceptInvitePage";
import { AuditPage } from "./pages/AuditPage";
import { BillingPage } from "./pages/BillingPage";
import { ForcePasswordPage } from "./pages/ForcePasswordPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MePage } from "./pages/MePage";
import { OrganizationPage } from "./pages/OrganizationPage";
import { OrgUsersPage } from "./pages/OrgUsersPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/accept-invite" element={<AcceptInvitePage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/force-password" element={<ForcePasswordPage />} />
            <Route element={<AppLayout />}>
              <Route index element={<HomePage />} />
              <Route path="me" element={<MePage />} />
              <Route path="organization" element={<OrganizationPage />} />
              <Route path="organization/users" element={<OrgUsersPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="billing" element={<BillingPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
