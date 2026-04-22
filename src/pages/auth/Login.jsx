import { useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Utensils, ArrowRight, Phone } from "lucide-react";
import { auth } from "../../lib/firebase";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import toast from "react-hot-toast";
import ConvexImage from "../../components/shared/ConvexImage";


export default function Login() {
  const { auth, login, siteSettings } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState(""); // phone or email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(true);
  const loginUserAction = useAction(api.auth_actions.verifyAndLogin);

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
      const userCred = await signInWithEmailAndPassword(auth, firebaseEmail, password);
      const idToken = await userCred.user.getIdToken();

      // 2. Create a session in Convex — pass ID Token for verification
      const result = await loginUserAction({ 
        idToken,
        rememberMe,
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

      const userCred = await signInWithPopup(auth, provider);
      const idToken = await userCred.user.getIdToken();

      const result = await loginUserAction({ 
        idToken,
        rememberMe: true, 
      });

      if (result === null) {
        toast.success("Google account verified. Complete your profile to continue.");
        const email = userCred.user?.email?.toLowerCase().trim();
        const name = userCred.user?.displayName?.trim() || "";
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
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="relative">
            {siteSettings?.siteLogo ? (
              <div className="w-16 h-16 rounded-[24px] overflow-hidden mb-6 shadow-2xl shadow-stone-200 border-2 border-white ring-1 ring-stone-100 animate-scale-up">
                <ConvexImage storageId={siteSettings.siteLogo} className="w-full h-full object-cover" />
              </div>
            ) : siteSettings === undefined ? (
              <div className="w-16 h-16 bg-stone-100 rounded-[24px] mb-6 animate-pulse" />
            ) : (
              <div className="w-16 h-16 bg-stone-900 rounded-[24px] flex items-center justify-center mb-6 shadow-2xl shadow-stone-900/20 animate-scale-up">
                <Utensils className="text-cream-50" size={28} />
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-black text-stone-900 tracking-tight text-center">
            {siteSettings === undefined ? (
              <span className="inline-block w-48 h-8 bg-stone-100 rounded-lg animate-pulse" />
            ) : (
              siteSettings?.siteName ? `Welcome to ${siteSettings.siteName}` : "Portal Access"
            )}
          </h1>

          <p className="text-[15px] text-stone-500 mt-2 font-medium text-center max-w-[280px] leading-relaxed">
            Please sign in to manage your events and registrations
          </p>
        </div>

        <div className="card p-8 flex flex-col gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-stone-200/60 rounded-[32px] bg-white/80 backdrop-blur-xl">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">

            {/* Identifier field — phone or email */}
            <div>
              <label className="label !text-[11px] !font-black !uppercase !tracking-widest !text-stone-400 !mb-2.5">Access ID</label>
              <div className="relative">
                {isPhone
                  ? <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.identifier ? 'text-red-400' : 'text-stone-300'}`} size={18} />
                  : <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.identifier ? 'text-red-400' : 'text-stone-300'}`} size={18} />
                }
                <input
                  type="text"
                  placeholder="Phone number or email"
                  value={identifier}
                  className={`pl-12 py-3.5 rounded-2xl bg-stone-50/50 border-stone-100 focus:bg-white focus:ring-4 focus:ring-stone-900/5 transition-all ${errors.identifier ? 'border-red-200 focus:border-red-300 focus:ring-red-50' : ''}`}
                  onChange={(e) => { setIdentifier(e.target.value); if(errors.identifier) setErrors(e=>({...e, identifier: ""})); }}
                  disabled={loading || googleLoading}
                  autoComplete="username"
                />
              </div>
              {errors.identifier && <p className="text-[12px] text-red-600 font-bold mt-2 ml-1 animate-slide-up">{errors.identifier}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-2.5">
                <label className="label !text-[11px] !font-black !uppercase !tracking-widest !text-stone-400 !mb-0">Secure Password</label>
                <Link to="/forgot-password" element="span" className="text-[11px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
                  Reset?
                </Link>
              </div>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-stone-300'}`} size={18} />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  className={`pl-12 py-3.5 rounded-2xl bg-stone-50/50 border-stone-100 focus:bg-white focus:ring-4 focus:ring-stone-900/5 transition-all ${errors.password ? 'border-red-200 focus:border-red-300 focus:ring-red-50' : ''}`}
                  onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors(e=>({...e, password: ""})); }}
                  disabled={loading || googleLoading}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && <p className="text-[12px] text-red-600 font-bold mt-2 ml-1 animate-slide-up">{errors.password}</p>}
            </div>

            <div className="flex items-center gap-3 px-1">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-stone-200 text-stone-900 focus:ring-stone-900/10 cursor-pointer transition-all"
                  disabled={loading || googleLoading}
                />
              </div>
              <label htmlFor="remember" className="text-[13.5px] font-bold text-stone-500 cursor-pointer select-none">
                Remember my session
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-4 rounded-2xl text-[15px] font-black shadow-xl shadow-stone-900/10 hover:shadow-stone-900/20 active:scale-[0.98] transition-all"
              disabled={loading || googleLoading}
            >
              {loading ? "Accessing..." : (
                <span className="flex items-center justify-center gap-2">
                  Sign In <ArrowRight size={20} />
                </span>
              )}
            </button>

            <div className="relative my-2">
              <div className="h-px bg-stone-100" />
              <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-white px-4 text-[10px] font-black uppercase tracking-[0.2em] text-stone-300">
                Secure Auth
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="btn-secondary w-full py-4 rounded-2xl text-[14px] font-black border-stone-100 hover:bg-stone-50 hover:border-stone-200 transition-all active:scale-[0.98]"
              disabled={loading || googleLoading}
            >
              <span className="flex items-center justify-center gap-3">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.4 14.7 2.5 12 2.5A9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.5 0 9.1-3.9 9.1-9.4 0-.6-.1-1.1-.2-1.9H12z"/>
                </svg>
                {googleLoading ? "Connecting..." : "Continue with Google"}
              </span>
            </button>
          </form>
        </div>

        <p className="text-[14.5px] text-center mt-10 font-bold text-stone-400 tracking-tight">
          New here?{" "}
          <Link to="/signup" className="text-stone-900 font-black hover:underline underline-offset-8 decoration-2 decoration-stone-200 transition-all">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
