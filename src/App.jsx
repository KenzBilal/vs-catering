import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";

// Shells
import StudentShell from "./components/student/StudentShell";
import AdminShell   from "./components/admin/AdminShell";

// Student pages
import Dashboard    from "./pages/Home";
import MyEvents     from "./pages/MyEvents";
import History      from "./pages/History";
import Settings     from "./pages/Settings";
import CateringDetail from "./pages/CateringDetail";
import Register     from "./pages/Register";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents    from "./pages/admin/AdminEvents";
import AdminUsers     from "./pages/admin/AdminUsers";
import CreateCatering from "./pages/admin/CreateCatering";
import EditCatering   from "./pages/admin/EditCatering";
import AttendancePage from "./pages/admin/AttendancePage";
import PaymentsPage   from "./pages/admin/PaymentsPage";
import AdminSettings  from "./pages/admin/AdminSettings";

// Auth pages
import Login  from "./pages/Login";
import Signup from "./pages/Signup";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role === "student") return <Navigate to="/" replace />;
  return children;
}

function StudentPage({ page }) {
  return (
    <ProtectedRoute>
      <StudentShell>{page}</StudentShell>
    </ProtectedRoute>
  );
}

function AdminPage({ page }) {
  return (
    <ProtectedRoute adminOnly>
      <AdminShell>{page}</AdminShell>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  const isAdmin = user?.role === "admin" || user?.role === "sub_admin";

  return (
    <Routes>
      {/* ── Auth ─────────────────────────────────────── */}
      <Route path="/login"  element={user ? <Navigate to={isAdmin ? "/admin" : "/"} replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to={isAdmin ? "/admin" : "/"} replace /> : <Signup />} />

      {/* ── Student portal ───────────────────────────── */}
      <Route path="/"           element={isAdmin ? <Navigate to="/admin" replace /> : <StudentPage page={<Dashboard />} />} />
      <Route path="/my-events"  element={<StudentPage page={<MyEvents />} />} />
      <Route path="/history"    element={<StudentPage page={<History />} />} />
      <Route path="/settings"   element={<StudentPage page={<Settings />} />} />

      {/* These stay outside shell (full-page detail views) */}
      <Route path="/catering/:id"          element={<ProtectedRoute><CateringDetail /></ProtectedRoute>} />
      <Route path="/catering/:id/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />

      {/* Legacy redirects */}
      <Route path="/my-caterings" element={<Navigate to="/my-events" replace />} />
      <Route path="/profile"      element={<Navigate to="/settings"  replace />} />

      {/* ── Admin portal ─────────────────────────────── */}
      <Route path="/admin"                          element={<AdminPage page={<AdminDashboard />} />} />
      <Route path="/admin/events"                   element={<AdminPage page={<AdminEvents />} />} />
      <Route path="/admin/events/create"            element={<AdminPage page={<CreateCatering />} />} />
      <Route path="/admin/catering/:id/edit"        element={<AdminPage page={<EditCatering />} />} />
      <Route path="/admin/catering/:id/attendance"  element={<AdminPage page={<AttendancePage />} />} />
      <Route path="/admin/catering/:id/payments"    element={<AdminPage page={<PaymentsPage />} />} />
      <Route path="/admin/users"                    element={<AdminPage page={<AdminUsers />} />} />
      <Route path="/admin/settings"                 element={<AdminPage page={<AdminSettings />} />} />

      {/* Legacy admin redirect */}
      <Route path="/admin/create-catering" element={<Navigate to="/admin/events/create" replace />} />

      <Route path="*" element={<Navigate to={user ? (isAdmin ? "/admin" : "/") : "/login"} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ConvexProvider>
  );
}
