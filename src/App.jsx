import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import Navbar from "./components/shared/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CateringDetail from "./pages/CateringDetail";
import Register from "./pages/Register";
import MyCaterings from "./pages/MyCaterings";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
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
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />

        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/catering/:id" element={<ProtectedRoute><CateringDetail /></ProtectedRoute>} />
        <Route path="/catering/:id/register" element={<ProtectedRoute><Register /></ProtectedRoute>} />
        <Route path="/my-caterings" element={<ProtectedRoute><MyCaterings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/create-catering" element={<ProtectedRoute adminOnly><CreateCatering /></ProtectedRoute>} />
        <Route path="/admin/catering/:id/attendance" element={<ProtectedRoute adminOnly><AttendancePage /></ProtectedRoute>} />
        <Route path="/admin/catering/:id/payments" element={<ProtectedRoute adminOnly><PaymentsPage /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
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
