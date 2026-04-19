import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";

export function usePermission(permissionKey) {
  const { user, permissions } = useAuth();
  
  // Admin always has all permissions
  if (user?.role === "admin") return true;
  
  // Find the permission in the permissions array from AuthContext
  const perm = permissions?.find(p => p.permission === permissionKey);
  return perm?.enabled || false;
}

export function useAllPermissions() {
  const { user, permissions } = useAuth();
  
  if (user?.role === "admin") return "all";
  
  return permissions || [];
}
