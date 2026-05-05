import { ConvexReactClient, useQuery } from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { useEffect, lazy, Suspense } from "react";

import ErrorBoundary from "./components/shared/ErrorBoundary";
import OfflineBanner from "./components/shared/OfflineBanner";
import { Toaster } from "react-hot-toast";
import VerificationPopup from "./components/shared/VerificationPopup";


// Shells
import StudentShell from "./components/student/StudentShell";
import AdminShell   from "./components/admin/AdminShell";

// Student pages
const Dashboard    = lazy(() => import("./pages/home/Home"));
const MyEvents     = lazy(() => import("./pages/my_events/MyEvents"));
const History      = lazy(() => import("./pages/history/History"));
const SettingsMenuStudent = lazy(() => import("./pages/settings/SettingsMenu"));
const PersonalSettingsStudent = lazy(() => import("./pages/settings/PersonalSettings"));
const PreferenceSettings = lazy(() => import("./pages/settings/PreferenceSettings"));
const CateringDetail = lazy(() => import("./pages/catering_detail/CateringDetail"));
const Register     = lazy(() => import("./pages/register/Register"));
const NotificationsPage = lazy(() => import("./pages/notifications/NotificationsPage"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEvents    = lazy(() => import("./pages/admin/AdminEvents"));
const AdminUsers     = lazy(() => import("./pages/admin/AdminUsers"));
const CreateCatering = lazy(() => import("./pages/admin/CreateCatering"));
const EditCatering   = lazy(() => import("./pages/admin/EditCatering"));
const AttendancePage = lazy(() => import("./pages/admin/AttendancePage"));
const PaymentsPage   = lazy(() => import("./pages/admin/PaymentsPage"));
const SettingsMenu   = lazy(() => import("./pages/admin/SettingsMenu"));
const ManageDropPoints = lazy(() => import("./pages/admin/ManageDropPoints"));
const ManageSubAdmins  = lazy(() => import("./pages/admin/ManageSubAdmins"));
const ManagePayouts    = lazy(() => import("./pages/admin/ManagePayouts"));
const ManageInterface  = lazy(() => import("./pages/admin/ManageInterface"));
const ManageBranding   = lazy(() => import("./pages/admin/ManageBranding"));
const PersonalSettings = lazy(() => import("./pages/admin/PersonalSettings"));
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

// Auth pages
const Login  = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
  throw new Error("VITE_CONVEX_URL is missing! Check your .env file.");
}
const convex = new ConvexReactClient(convexUrl);

function BrandingWrapper({ children }) {
  const siteSettings = useQuery(api.adminSettings.getSiteSettings);
  const imageUrl = useQuery(api.files.getImageUrl, siteSettings?.siteLogo ? { storageId: siteSettings.siteLogo } : "skip");


  useEffect(() => {
    if (siteSettings?.siteName) {
      document.title = siteSettings.siteName;
    }
    if (imageUrl) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = imageUrl;
    }
  }, [siteSettings, imageUrl]);

  return children;
}


function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-bg">
      <p className="text-stone-500 font-medium animate-pulse">Loading...</p>
    </div>
  );
}

function ProtectedRoute({ children, adminOnly, superAdminOnly, permission }) {
  const { user, permissions, loading } = useAuth();
  if (loading) return <PageLoader />;
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
          {user ? "Go Home" : "Log In"}
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


function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;


  const isAdmin = user?.role === "admin" || user?.role === "sub_admin";

  return (
    <BrandingWrapper>
      <VerificationPopup />
      {/* Global offline detector — renders everywhere */}
      <OfflineBanner />

      <Suspense fallback={<PageLoader />}>
        <Routes>
        {/* ── Auth ─────────────────────────────────────── */}
        <Route path="/login"  element={user ? <Navigate to={isAdmin ? "/admin" : "/"} replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to={isAdmin ? "/admin" : "/"} replace /> : <Signup />} />
                                
        {/* ── Student portal ───────────────────────────── */}
        <Route path="/"           element={isAdmin ? <Navigate to="/admin" replace /> : <StudentPage page={<Dashboard />} />} />
        <Route path="/my-events"  element={<StudentPage page={<MyEvents />} />} />
        <Route path="/history"    element={<StudentPage page={<History />} />} />
        <Route path="/settings"   element={<StudentPage page={<SettingsMenuStudent />} />} />
        <Route path="/settings/personal" element={<StudentPage page={<PersonalSettingsStudent />} />} />
        <Route path="/settings/preferences" element={<StudentPage page={<PreferenceSettings />} />} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* These stay outside shell (full-page detail views) */}
        <Route path="/catering/:id"          element={<ProtectedRoute><CateringDetail /></ProtectedRoute>} />
        <Route path="/catering/:id/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />

        {/* Legacy redirects */}
        <Route path="/my-caterings" element={<Navigate to="/my-events" replace />} />
        <Route path="/profile"      element={<Navigate to="/settings"  replace />} />

        {/* ── Admin portal ─────────────────────────────── */}
        <Route path="/admin"                          element={<ProtectedRoute adminOnly><AdminShell><AdminDashboard /></AdminShell></ProtectedRoute>} />
        <Route path="/admin/events"                   element={<ProtectedAdminRoute permission="manage_caterings"><AdminEvents /></ProtectedAdminRoute>} />
        <Route path="/admin/events/create"            element={<ProtectedAdminRoute permission="manage_caterings"><CreateCatering /></ProtectedAdminRoute>} />
        <Route path="/admin/catering/:id/edit"        element={<ProtectedAdminRoute permission="manage_caterings"><EditCatering /></ProtectedAdminRoute>} />
        <Route path="/admin/catering/:id/attendance"  element={<ProtectedAdminRoute permission="mark_attendance"><AttendancePage /></ProtectedAdminRoute>} />
        <Route path="/admin/catering/:id/payments"    element={<ProtectedAdminRoute permission="manage_payments"><PaymentsPage /></ProtectedAdminRoute>} />
        <Route path="/admin/users"                    element={<ProtectedAdminRoute permission="manage_users"><AdminUsers /></ProtectedAdminRoute>} />
        
        {/* Settings Sub-Routes (Super Admin Only) */}
        <Route path="/admin/settings"             element={<ProtectedRoute adminOnly><AdminShell><SettingsMenu /></AdminShell></ProtectedRoute>} />
        <Route path="/admin/settings/drop-points" element={<ProtectedRoute superAdminOnly><AdminShell><ManageDropPoints /></AdminShell></ProtectedRoute>} />
        <Route path="/admin/settings/personal"    element={<ProtectedRoute adminOnly><AdminShell><PersonalSettings /></AdminShell></ProtectedRoute>} />
        <Route path="/admin/settings/sub-admins"  element={<ProtectedRoute superAdminOnly><AdminShell><ManageSubAdmins /></AdminShell></ProtectedRoute>} />
        <Route path="/admin/settings/payouts"     element={<ProtectedRoute superAdminOnly><AdminShell><ManagePayouts /></AdminShell></ProtectedRoute>} />
        <Route path="/admin/settings/interface"   element={<ProtectedRoute adminOnly><AdminShell><ManageInterface /></AdminShell></ProtectedRoute>} />
        <Route path="/admin/settings/branding"    element={<ProtectedRoute superAdminOnly><AdminShell><ManageBranding /></AdminShell></ProtectedRoute>} />

        {/* Legacy admin redirect */}
        <Route path="/admin/create-catering" element={<Navigate to="/admin/events/create" replace />} />

        {/* #30: 404 page */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrandingWrapper>
  );
}


export default function App() {
  // #11: Removed global right-click disable — it breaks legitimate browser UX
  return (
    <ErrorBoundary>
      <ConvexAuthProvider client={convex}>
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
      </ConvexAuthProvider>
    </ErrorBoundary>
  );
}
