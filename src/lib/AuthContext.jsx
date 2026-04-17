import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

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

  const validUser = useQuery(
    api.auth.validateSession,
    storedUser?.token ? { token: storedUser.token } : "skip"
  );
  
  const logoutUserMutation = useMutation(api.users.logoutUser);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storedUser?.token && validUser === undefined) {
      setLoading(true);
    } else {
      setLoading(false);
    }
    
    if (validUser === null && storedUser !== null) {
      // Token is invalid/expired, clear storage
      setStoredUser(null);
      localStorage.removeItem("vs_user");
    }
  }, [validUser, storedUser]);

  const user = validUser ? { ...validUser, token: storedUser.token } : (validUser === undefined ? storedUser : null);

  const login = (userData) => {
    setStoredUser(userData);
    localStorage.setItem("vs_user", JSON.stringify(userData));
  };

  const logout = async () => {
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
