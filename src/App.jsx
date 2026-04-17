import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import Navbar from "./components/shared/Navbar";
import AdminShell from "./components/admin/AdminShell";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CateringDetail from "./pages/CateringDetail";
import Register from "./pages/Register";
import MyCaterings from "./pages/MyCaterings";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminUsers from "./pages/admin/AdminUsers";
import CreateCatering from "./pages/admin/CreateCatering";
import AttendancePage from "./pages/admin/AttendancePage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import AdminSettings from "./pages/admin/AdminSettings";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

function ProtectedRoute({ children, adminOnly }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role === "student") return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  const isAdmin = user?.role === "admin" || user?.role === "sub_admin";

  return (
    <Routes>
      {/* Auth pages — redirect if already logged in */}
      <Route
        path="/login"
        element={
          user
            ? <Navigate to={isAdmin ? "/admin" : "/"} replace />
            : <Login />
        }
      />
      <Route
        path="/signup"
        element={
          user
            ? <Navigate to={isAdmin ? "/admin" : "/"} replace />
            : <Signup />
        }
      />

      {/* Student routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            {isAdmin
              ? <Navigate to="/admin" replace />
              : (
                <div className="flex flex-col min-h-screen">
                  <Navbar />
                  <main className="flex-1"><Home /></main>
                </div>
              )
            }
          </ProtectedRoute>
        }
      />
      <Route
        path="/catering/:id"
        element={
          <ProtectedRoute>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1"><CateringDetail /></main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/catering/:id/register"
        element={
          <ProtectedRoute>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1"><Register /></main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-caterings"
        element={
          <ProtectedRoute>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1"><MyCaterings /></main>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1"><Profile /></main>
            </div>
          </ProtectedRoute>
        }
      />

      {/* Admin routes — wrapped in AdminShell */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminShell><AdminDashboard /></AdminShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute adminOnly>
            <AdminShell><AdminEvents /></AdminShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/create"
        element={
          <ProtectedRoute adminOnly>
            <AdminShell><CreateCatering /></AdminShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/catering/:id/attendance"
        element={
          <ProtectedRoute adminOnly>
            <AdminShell><AttendancePage /></AdminShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/catering/:id/payments"
        element={
          <ProtectedRoute adminOnly>
            <AdminShell><PaymentsPage /></AdminShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <AdminShell><AdminUsers /></AdminShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute adminOnly>
            <AdminShell><AdminSettings /></AdminShell>
          </ProtectedRoute>
        }
      />

      {/* Legacy admin route redirect */}
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
