import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Utensils, ArrowRight, Phone } from "lucide-react";
import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(""); // phone or email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loginUserMutation = useMutation(api.users.loginUser);

  // Detect if the user typed a phone number (10 digits) or email
  const isPhone = /^\d{10}$/.test(identifier.replace(/\D/g, ""));

  // Lazily resolve the email from Convex when identifier looks like a phone
  const resolvedEmail = useQuery(
    api.users.resolveLoginEmail,
    identifier.trim().length >= 6 ? { identifier: identifier.trim() } : "skip"
  );

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError("");

    if (!identifier.trim()) return setError("Enter your phone number or email.");
    if (!password.trim()) return setError("Password is required.");

    // If it looks like a phone, we need an email to pass to Firebase
    const firebaseEmail = isPhone ? resolvedEmail : identifier.toLowerCase().trim();

    if (isPhone && resolvedEmail === undefined) {
      return setError("Looking up your account... please try again.");
    }
    if (isPhone && resolvedEmail === null) {
      return setError("No account found with this phone number.");
    }

    setLoading(true);
    try {
      // 1. Authenticate with Firebase using the resolved email
      await signInWithEmailAndPassword(auth, firebaseEmail, password);

      // 2. Create a session in Convex
      const result = await loginUserMutation({ email: firebaseEmail });

      if (result === null) {
        setError("Account not found. Please sign up first.");
      } else {
        login(result);
        navigate("/", { replace: true });
      }
    } catch (e) {
      console.error("Login Error:", e);
      const errorCode = e.code || "";
      let msg = "Incorrect password or account not found.";

      if (errorCode === "auth/user-not-found") msg = "No account found with this email.";
      if (errorCode === "auth/wrong-password" || errorCode === "auth/invalid-credential") msg = "Incorrect password. Please try again.";
      if (errorCode === "auth/too-many-requests") msg = "Too many failed attempts. Please try again later.";
      if (errorCode === "auth/operation-not-allowed") msg = "Email/Password login is not enabled. Enable it in the Firebase Console.";

      const rawMsg = e.data || e.message || "";
      if (typeof rawMsg === "string" && rawMsg.includes("ConvexError:")) {
        msg = rawMsg.split("ConvexError:")[1].trim();
      }

      setError(`${msg}${errorCode ? ` (${errorCode})` : ""}`);
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
            Sign in with your phone or email
          </p>
        </div>

        <div className="card p-6 sm:p-8 flex flex-col gap-5 shadow-xl shadow-stone-200/50">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            {/* Identifier field — phone or email */}
            <div>
              <label className="label">Phone Number or Email</label>
              <div className="relative">
                {isPhone
                  ? <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  : <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                }
                <input
                  type="text"
                  placeholder="Phone or email"
                  value={identifier}
                  className="pl-11"
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
              {/* Subtle indicator */}
              {identifier.trim().length > 0 && (
                <p className="text-[11.5px] font-medium text-stone-400 mt-1.5 ml-1">
                  {isPhone ? "🔢 Signing in with phone number" : "✉️ Signing in with email"}
                </p>
              )}
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
                  autoComplete="current-password"
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
