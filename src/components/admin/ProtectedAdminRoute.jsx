import { Navigate } from "react-router-dom";
import { usePermission } from "../../hooks/usePermission";
import { useAuth } from "../../lib/AuthContext";
import AdminShell from "./AdminShell";

export default function ProtectedAdminRoute({ permission, children }) {
  const { user, loading } = useAuth();
  const hasPermission = usePermission(permission);
  
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream-bg">
      <p className="text-stone-500 font-medium animate-pulse">Catering is loading...</p>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  if (!hasPermission) {
    return <Navigate to="/admin" replace />;
  }

  return <AdminShell>{children}</AdminShell>;
}
