import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "./firebase";
import { signOut, sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [storedUser, setStoredUser] = useState(() => {
    try {
      const stored = localStorage.getItem("vs_user") || sessionStorage.getItem("vs_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [firebaseUser, setFirebaseUser] = useState(null);
  const [serverValidated, setServerValidated] = useState(false);

  const validUser = useQuery(
    api.auth.validateSession,
    storedUser?.token ? { token: storedUser.token } : "skip"
  );

  const permissions = useQuery(
    api.adminSettings.getMyPermissions,
    storedUser?.token ? { token: storedUser.token } : "skip"
  );

  const logoutUserMutation = useMutation(api.users.logoutUser);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setFirebaseUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (storedUser?.token && (validUser === undefined || permissions === undefined)) {
      setLoading(true);
      setServerValidated(false);
    } else {
      setLoading(false);
      setServerValidated(true);
    }

    if (validUser === null && storedUser !== null) {
      setStoredUser(null);
      localStorage.removeItem("vs_user");
      sessionStorage.removeItem("vs_user");
    }
  }, [validUser, permissions, storedUser]);

  const user = serverValidated
    ? (validUser ? { ...validUser, token: storedUser?.token } : null)
    : storedUser; 

  const login = (userData, rememberMe) => {
    setStoredUser(userData);
    if (rememberMe) {
      localStorage.setItem("vs_user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("vs_user", JSON.stringify(userData));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase signOut failed:", e);
    }

    if (storedUser?.token) {
      try {
        await logoutUserMutation({ token: storedUser.token });
      } catch (e) {}
    }

    setStoredUser(null);
    localStorage.removeItem("vs_user");
    sessionStorage.removeItem("vs_user");
  };

  const resetPassword = async (email) => {
    const actionCodeSettings = {
      // Ensure the reset link points back to our unified AuthActionHandler
      url: `${window.location.origin}/auth-action`,
      handleCodeInApp: true,
    };
    return await sendPasswordResetEmail(auth, email, actionCodeSettings);
  };

  const isGoogleUser = firebaseUser?.providerData?.some(p => p.providerId === "google.com");

  return (
    <AuthContext.Provider value={{ 
      user, 
      token: storedUser?.token, 
      permissions: permissions || [], 
      login, 
      logout, 
      resetPassword, 
      isGoogleUser,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
