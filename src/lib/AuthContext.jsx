import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { auth } from "./firebase";
import { signOut } from "firebase/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [storedUser, setStoredUser] = useState(() => {
    try {
      const stored = localStorage.getItem("vs_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // #26: Track whether we are still waiting for server validation
  const [serverValidated, setServerValidated] = useState(false);

  const validUser = useQuery(
    api.auth.validateSession,
    storedUser?.token ? { token: storedUser.token } : "skip"
  );

  const logoutUserMutation = useMutation(api.users.logoutUser);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storedUser?.token && validUser === undefined) {
      setLoading(true);
      setServerValidated(false);
    } else {
      setLoading(false);
      setServerValidated(true);
    }

    if (validUser === null && storedUser !== null) {
      // Token is invalid/expired, clear storage
      setStoredUser(null);
      localStorage.removeItem("vs_user");
    }
  }, [validUser, storedUser]);

  // #26: Use server-validated user data once available, fallback to stored only during loading
  const user = serverValidated
    ? (validUser ? { ...validUser, token: storedUser?.token } : null)
    : storedUser; // show stored data while loading to avoid flicker

  const login = (userData) => {
    setStoredUser(userData);
    localStorage.setItem("vs_user", JSON.stringify(userData));
  };

  const logout = async () => {
    // #18: Sign out from Firebase so the Firebase session is cleared too
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
  };

  return (
    <AuthContext.Provider value={{ user, token: storedUser?.token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
