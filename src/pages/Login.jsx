import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Mail, Lock, Utensils, ArrowRight } from "lucide-react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginUserMutation = useMutation(api.users.loginUser);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError("");
    
    if (!email.trim()) return setError("Email is required.");
    if (!password.trim()) return setError("Password is required.");
    
    setLoading(true);
    try {
      // 1. Authenticate with Firebase
      await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      
      // 2. Authenticate with Convex
      const result = await loginUserMutation({ email: email.toLowerCase().trim() });
      
      if (result === null) {
        setError("Account not found in our records. Please sign up.");
      } else {
        login(result);
        navigate("/", { replace: true });
      }
    } catch (e) {
      console.error("Login Error:", e);
      const errorCode = e.code || "";
      let msg = "Invalid email or password.";
      
      if (errorCode === "auth/user-not-found") msg = "No account found with this email.";
      if (errorCode === "auth/wrong-password") msg = "Incorrect password.";
      if (errorCode === "auth/too-many-requests") msg = "Too many failed attempts. Try again later.";
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream-bg">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-stone-900/20">
            <Utensils className="text-cream-50" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Welcome Back</h1>
          <p className="text-[14.5px] text-stone-500 mt-1 font-medium text-center">
            Sign in to your catering account
          </p>
        </div>

        <div className="card p-6 sm:p-8 flex flex-col gap-5 shadow-xl shadow-stone-200/50">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  className="pl-11"
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  className="pl-11"
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] font-medium animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary w-full py-3.5 mt-2 text-[15px]"
              disabled={loading}
            >
              {loading ? "Signing in..." : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-[14px] text-center mt-6 font-medium text-stone-500">
          Don't have an account?{" "}
          <Link to="/signup" className="text-stone-900 font-bold hover:underline underline-offset-4 decoration-2 decoration-cream-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
