import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import OfflineBanner from "./components/shared/OfflineBanner";
import { Toaster } from "react-hot-toast";

// Shells
import StudentShell from "./components/student/StudentShell";
import AdminShell   from "./components/admin/AdminShell";

// Student pages
import Dashboard    from "./pages/home/Home";
import MyEvents     from "./pages/my_events/MyEvents";
import History      from "./pages/history/History";
import Settings     from "./pages/settings/Settings";
import CateringDetail from "./pages/catering_detail/CateringDetail";
import Register     from "./pages/register/Register";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents    from "./pages/admin/AdminEvents";
import AdminUsers     from "./pages/admin/AdminUsers";
import CreateCatering from "./pages/admin/CreateCatering";
import EditCatering   from "./pages/admin/EditCatering";
import AttendancePage from "./pages/admin/AttendancePage";
import PaymentsPage   from "./pages/admin/PaymentsPage";
import SettingsMenu   from "./pages/admin/SettingsMenu";
import ManageDropPoints from "./pages/admin/ManageDropPoints";
import ManageSubAdmins  from "./pages/admin/ManageSubAdmins";

// Auth pages
import Login  from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  console.error("VITE_CONVEX_URL is missing! The app will not be able to connect to the database.");
}
const convex = new ConvexReactClient(convexUrl || "https://dummy.convex.cloud");

function ProtectedRoute({ children, adminOnly, superAdminOnly, permission }) {
  const { user, permissions, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-bg">
      <p className="text-stone-500 font-medium animate-pulse">Catering is loading...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role === "student") return <Navigate to="/" replace />;
  
  // Super Admin Only (explicitly for settings)
  if (superAdminOnly && user.role !== "admin") return <Navigate to="/admin" replace />;

  // Dynamic Permission Check
  if (permission) {
    const hasPerm = permissions.some(p => p.permission === permission && p.enabled);
    if (!hasPerm && user.role !== "admin") return <Navigate to="/admin" replace />;
  }

  return children;
}

function NotFound() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin" || user?.role === "sub_admin";
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-bg px-4">
      <div className="text-center">
        <p className="text-7xl font-black text-stone-200 mb-4">404</p>
        <h1 className="text-xl font-bold text-stone-900 mb-2">Page Not Found</h1>
        <p className="text-stone-500 font-medium mb-6">The page you're looking for doesn't exist.</p>
        <a href={user ? (isAdmin ? "/admin" : "/") : "/login"} className="btn-primary inline-flex">
          Go Home
        </a>
      </div>
    </div>
  );
}

function StudentPage({ page }) {
  return (
    <ProtectedRoute>
      <StudentShell>{page}</StudentShell>
    </ProtectedRoute>
  );
}

function AdminPage({ page, permission }) {
  return (
    <ProtectedRoute adminOnly permission={permission}>
      <AdminShell>{page}</AdminShell>
    </ProtectedRoute>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-bg">
      <p className="text-stone-500 font-medium animate-pulse">Catering is loading...</p>
    </div>
  );

  const isAdmin = user?.role === "admin" || user?.role === "sub_admin";

  return (
    <>
      {/* Global offline detector — renders everywhere */}
      <OfflineBanner />
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
      <Route path="/admin/events"                   element={<AdminPage page={<AdminEvents />} permission="manage_caterings" />} />
      <Route path="/admin/events/create"            element={<AdminPage page={<CreateCatering />} permission="manage_caterings" />} />
      <Route path="/admin/catering/:id/edit"        element={<AdminPage page={<EditCatering />} permission="manage_caterings" />} />
      <Route path="/admin/catering/:id/attendance"  element={<AdminPage page={<AttendancePage />} permission="mark_attendance" />} />
      <Route path="/admin/catering/:id/payments"    element={<AdminPage page={<PaymentsPage />} permission="manage_payments" />} />
      
      {/* Admin Pages with dynamic permissions */}
      <Route path="/admin/users"    element={<ProtectedRoute permission="manage_users"><AdminShell><AdminUsers /></AdminShell></ProtectedRoute>} />
      
      {/* Settings Sub-Routes (Super Admin Only) */}
      <Route path="/admin/settings"             element={<ProtectedRoute superAdminOnly><AdminShell><SettingsMenu /></AdminShell></ProtectedRoute>} />
      <Route path="/admin/settings/drop-points" element={<ProtectedRoute superAdminOnly><AdminShell><ManageDropPoints /></AdminShell></ProtectedRoute>} />
      <Route path="/admin/settings/sub-admins"  element={<ProtectedRoute superAdminOnly><AdminShell><ManageSubAdmins /></AdminShell></ProtectedRoute>} />

      {/* Legacy admin redirect */}
      <Route path="/admin/create-catering" element={<Navigate to="/admin/events/create" replace />} />

      {/* #30: 404 page */}
      <Route path="*" element={user ? <NotFound /> : <Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  // #11: Removed global right-click disable — it breaks legitimate browser UX
  return (
    <ErrorBoundary>
      <ConvexProvider client={convex}>
        <AuthProvider>
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#fff',
                color: '#1c1917',
                borderRadius: '12px',
                border: '1px solid #f4ece4',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: { iconTheme: { primary: '#1a5c3a', secondary: '#fff' } },
              error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
            }}
          />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ConvexProvider>
    </ErrorBoundary>
  );
}
