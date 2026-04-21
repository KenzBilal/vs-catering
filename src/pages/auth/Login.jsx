import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Utensils, ArrowRight, Phone } from "lucide-react";
import { auth } from "../../lib/firebase";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import toast from "react-hot-toast";
import ConvexImage from "../../components/shared/ConvexImage";


export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState(""); // phone or email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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
    let firebaseEmail = identifier.toLowerCase().trim();

    if (isPhone) {
      if (resolvedEmail === undefined) {
        setLoading(true);
        // We'll wait a brief moment for the query to resolve
        const start = Date.now();
        while (Date.now() - start < 1500) {
          if (resolvedEmail !== undefined) break;
          await new Promise(r => setTimeout(r, 100));
        }
        setLoading(false);
        if (resolvedEmail === undefined) {
          toast.error("Lookup timeout. Please click Sign In again.");
          return;
        }
      }
      firebaseEmail = resolvedEmail;
    }

    if (isPhone && resolvedEmail === null) {
      setErrors({ identifier: "No account found with this phone number." });
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate with Firebase using the resolved email
      await signInWithEmailAndPassword(auth, firebaseEmail, password);

      // 2. Create a session in Convex — pass verification status
      const result = await loginUserMutation({ 
        email: firebaseEmail, 
        rememberMe,
        firebaseVerified: auth.currentUser?.emailVerified 
      });

      if (result === null) {
        setErrors({ identifier: "Account not found. Please sign up first." });
      } else if (result.emailVerified === false) {
        toast.error("Please verify your email first.");
        navigate(`/verify-email?email=${encodeURIComponent(firebaseEmail)}`, { replace: true });
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

  const handleGoogleSignIn = async () => {
    setErrors({});
    setGoogleLoading(true);

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const credential = await signInWithPopup(auth, provider);
      const email = credential.user?.email?.toLowerCase().trim();
      const name = credential.user?.displayName?.trim() || "";

      if (!email) {
        throw new Error("No email found for selected Google account.");
      }

      const result = await loginUserMutation({
        email,
        rememberMe,
        firebaseVerified: true,
      });

      if (result === null) {
        toast.success("Google account verified. Complete your profile to continue.");
        navigate(`/complete-profile?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`, { replace: true });
        return;
      }

      if (result.emailVerified === false) {
        navigate(`/verify-email?email=${encodeURIComponent(email)}`, { replace: true });
        return;
      }

      toast.success("Welcome back!");
      login(result, rememberMe);
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Google Login Error:", e);
      const code = e?.code || "";
      let msg = e?.message || "Google sign-in failed.";

      if (code === "auth/popup-closed-by-user") msg = "Google sign-in cancelled.";
      if (code === "auth/popup-blocked") msg = "Popup blocked. Please allow popups and try again.";
      if (code === "auth/unauthorized-domain") msg = "This domain is not authorized in Firebase settings.";
      if (code === "auth/account-exists-with-different-credential") msg = "This email already exists with another sign-in method. Use your email/password first.";

      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const siteSettings = useQuery(api.adminSettings.getSiteSettings);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream-bg">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          {siteSettings?.siteLogo ? (
            <div className="w-12 h-12 rounded-2xl overflow-hidden mb-4 shadow-lg border border-stone-100">
              <ConvexImage storageId={siteSettings.siteLogo} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-stone-900/20">
              <Utensils className="text-cream-50" size={24} />
            </div>
          )}
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            {siteSettings?.siteName ? `Welcome to ${siteSettings.siteName}` : "Welcome Back"}
          </h1>

          <p className="text-[14.5px] text-stone-500 mt-1 font-medium text-center">
            Sign in with your phone, email, or Google
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
                  disabled={loading || googleLoading}
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
                  disabled={loading || googleLoading}
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
                disabled={loading || googleLoading}
              />
              <label htmlFor="remember" className="text-[13.5px] font-medium text-stone-600 cursor-pointer select-none">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3.5 mt-1 text-[15px]"
              disabled={loading || googleLoading}
            >
              {loading ? "Signing in..." : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="relative my-1">
              <div className="h-px bg-stone-200" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-cream-50 px-3 text-[11px] uppercase tracking-wide text-stone-400 font-semibold">
                or
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn-secondary w-full py-3.5 text-[15px]"
              disabled={loading || googleLoading}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.4 14.7 2.5 12 2.5A9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.5 0 9.1-3.9 9.1-9.4 0-.6-.1-1.1-.2-1.9H12z"/>
              </svg>
              {googleLoading ? "Connecting Google..." : "Continue with Google"}
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
