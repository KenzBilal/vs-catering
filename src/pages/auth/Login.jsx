import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Phone, ArrowRight, Loader2, User } from "lucide-react";
import { useAuthActions, useConvexAuth } from "@convex-dev/auth/react";
import toast from "react-hot-toast";
import ConvexImage from "../../components/shared/ConvexImage";

const FIELD_CLS = (err) =>
  `w-full pl-10 pr-4 py-[11px] rounded-xl bg-cream-50 border text-[14px] outline-none transition-all duration-200 placeholder:text-stone-400/70 focus:bg-white focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(28,25,22,0.06)] ${
    err ? "border-red-300 bg-red-50/60" : "border-cream-300"
  }`;

const ICON_CLS = (err) =>
  `absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${err ? "text-red-400" : "text-stone-400"}`;

export default function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const siteSettings = useQuery(api.adminSettings.getSiteSettings);
  const { signIn } = useAuthActions();

  // Auto-redirect when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const digits = identifier.replace(/\D/g, "");
  const isPhone = /^\d{10}$/.test(digits);

  // Reactively resolve phone → email in the background
  const resolvedEmail = useQuery(
    api.users.resolveLoginEmail,
    identifier.trim().length >= 5 ? { identifier: identifier.trim() } : "skip"
  );

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrors({});

    const errs = {};
    if (!identifier.trim()) errs.identifier = "Required";
    if (!password.trim()) errs.password = "Required";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    let finalEmail = identifier.toLowerCase().trim();

    if (isPhone) {
      if (resolvedEmail === undefined) {
        // Wait a moment for the query to resolve
        setLoading(true);
        const deadline = Date.now() + 2000;
        while (Date.now() < deadline) {
          await new Promise(r => setTimeout(r, 80));
          if (resolvedEmail !== undefined) break;
        }
      }

      if (!resolvedEmail) {
        setLoading(false);
        setErrors({ identifier: "No account found with this phone number." });
        return;
      }
      finalEmail = resolvedEmail;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("email", finalEmail);
      formData.set("password", password);
      formData.set("flow", "signIn");

      await signIn("password", formData);

      // Wait a moment for session to establish before redirect
      await new Promise(r => setTimeout(r, 400));

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login Error:", err);
      const raw = err?.data || err?.message || "";
      const msg = typeof raw === "string"
        ? raw.replace(/^.*ConvexError:\s*/i, "").replace(/^Error:\s*/i, "")
        : "";
      toast.error(msg || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--cream-bg)" }}>
      <div className="w-full max-w-sm" style={{ animation: "fade-in 0.2s ease-out forwards" }}>

        {/* Header */}
        <div className="flex flex-col items-center mb-7">
          {siteSettings === undefined ? (
            <div className="w-12 h-12 rounded-2xl bg-cream-200 animate-pulse mb-4" />
          ) : siteSettings?.siteLogo ? (
            <div className="w-12 h-12 rounded-2xl overflow-hidden mb-4 border border-cream-300 shadow-sm">
              <ConvexImage storageId={siteSettings.siteLogo} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-stone-800 flex items-center justify-center mb-4 shadow-sm">
              <User size={22} className="text-white" />
            </div>
          )}

          <h1 className="text-[22px] font-bold text-stone-900 tracking-tight">
            {siteSettings === undefined ? (
              <span className="inline-block w-28 h-6 bg-cream-200 rounded-lg animate-pulse" />
            ) : (
              siteSettings?.siteName || "Sign In"
            )}
          </h1>
          <p className="text-[13px] text-stone-400 mt-1 font-medium">Enter your credentials to continue</p>
        </div>

        {/* Card */}
        <div className="card rounded-2xl">
          <form onSubmit={handleLogin} noValidate>

            {/* Identifier */}
            <div className="mb-4">
              <label className="label">Email or Phone</label>
              <div className="relative">
                {isPhone
                  ? <Phone size={15} className={ICON_CLS(errors.identifier)} />
                  : <Mail size={15} className={ICON_CLS(errors.identifier)} />
                }
                <input
                  type="text"
                  className={FIELD_CLS(errors.identifier)}
                  placeholder="Phone number or email"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); if (errors.identifier) setErrors(v => ({ ...v, identifier: "" })); }}
                  disabled={loading}
                  autoComplete="username"
                  inputMode={isPhone ? "numeric" : "email"}
                />
              </div>
              {errors.identifier && <p className="text-[11.5px] text-red-500 font-medium mt-1">{errors.identifier}</p>}
            </div>

            {/* Password */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
              </div>
              <div className="relative">
                <Lock size={15} className={ICON_CLS(errors.password)} />
                <input
                  type="password"
                  className={FIELD_CLS(errors.password)}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors(v => ({ ...v, password: "" })); }}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && <p className="text-[11.5px] text-red-500 font-medium mt-1">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full py-3 text-[14px]"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={17} className="animate-spin" /> Authenticating...</>
              ) : (
                <>Sign In <ArrowRight size={17} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-[13.5px] text-center mt-5 text-stone-400 font-medium">
          New here?{" "}
          <Link to="/signup" className="text-stone-800 font-bold hover:text-stone-600 transition-colors">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
