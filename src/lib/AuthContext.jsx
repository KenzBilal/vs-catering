import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  // We fetch the current user doc directly from Convex instead of manually tracking tokens
  const validUser = useQuery(api.users.getCurrentUser);
  const permissions = useQuery(api.adminSettings.getMyPermissions) || [];

  // Determine overall loading state based on both Auth and the local user query
  const loading = isAuthLoading || (isAuthenticated && validUser === undefined);

  const logout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.warn("Convex signOut failed:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user: validUser || null, 
      token: validUser?._id ? String(validUser._id) : null,
      permissions,
      logout,
      loading,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
