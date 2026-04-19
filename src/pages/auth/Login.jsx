import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Utensils, ArrowRight, Phone } from "lucide-react";
import { auth } from "../../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import toast from "react-hot-toast";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(""); // phone or email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(true);

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
    setErrors({});
    
    let hasError = false;
    const newErrors = {};

    if (!identifier.trim()) { newErrors.identifier = "Enter your phone number or email."; hasError = true; }
    if (!password.trim()) { newErrors.password = "Password is required."; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // If it looks like a phone, we need an email to pass to Firebase
    const firebaseEmail = isPhone ? resolvedEmail : identifier.toLowerCase().trim();

    if (isPhone && resolvedEmail === undefined) {
      toast.error("Looking up your account... please try again.");
      return;
    }
    if (isPhone && resolvedEmail === null) {
      setErrors({ identifier: "No account found with this phone number." });
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate with Firebase using the resolved email
      await signInWithEmailAndPassword(auth, firebaseEmail, password);

      // 2. Create a session in Convex
      const result = await loginUserMutation({ email: firebaseEmail, rememberMe });

      if (result === null) {
        setErrors({ identifier: "Account not found. Please sign up first." });
      } else {
        toast.success("Welcome back!");
        login(result, rememberMe);
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

      toast.error(`${msg}${errorCode ? ` (${errorCode})` : ""}`);
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
                  ? <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.identifier ? 'text-red-400' : 'text-stone-400'}`} size={18} />
                  : <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.identifier ? 'text-red-400' : 'text-stone-400'}`} size={18} />
                }
                <input
                  type="text"
                  placeholder="Phone or email"
                  value={identifier}
                  className={`pl-11 ${errors.identifier ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                  onChange={(e) => { setIdentifier(e.target.value); if(errors.identifier) setErrors(e=>({...e, identifier: ""})); }}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
              {errors.identifier && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.identifier}</p>}
              {/* Subtle indicator */}
              {identifier.trim().length > 0 && !errors.identifier && (
                <p className="text-[11.5px] font-medium text-stone-400 mt-1.5 ml-1">
                  {isPhone ? "🔢 Signing in with phone number" : "✉️ Signing in with email"}
                </p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-stone-400'}`} size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  className={`pl-11 ${errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                  onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors(e=>({...e, password: ""})); }}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20 cursor-pointer"
              />
              <label htmlFor="remember" className="text-[13.5px] font-medium text-stone-600 cursor-pointer select-none">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3.5 mt-1 text-[15px]"
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
