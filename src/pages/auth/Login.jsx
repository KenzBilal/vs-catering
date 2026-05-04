import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Phone, Loader2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import toast from "react-hot-toast";
import ConvexImage from "../../components/shared/ConvexImage";

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { signIn } = useAuthActions();

  const isPhone = /^\d{10}$/.test(identifier.replace(/\D/g, ""));

  const resolvedEmail = useQuery(
    api.users.resolveLoginEmail,
    identifier.trim().length >= 6 ? { identifier: identifier.trim() } : "skip"
  );

  const handleLogin = async (e) => {
    e?.preventDefault();
    setErrors({});
    
    let hasError = false;
    const newErrors = {};

    if (!identifier.trim()) { newErrors.identifier = "Required"; hasError = true; }
    if (!password.trim()) { newErrors.password = "Required"; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    let finalEmail = identifier.toLowerCase().trim();

    if (isPhone) {
      if (resolvedEmail === undefined) {
        setLoading(true);
        const start = Date.now();
        while (Date.now() - start < 1500) {
          if (resolvedEmail !== undefined) break;
          await new Promise(r => setTimeout(r, 100));
        }
        setLoading(false);
        if (resolvedEmail === undefined) {
          toast.error("Lookup timeout. Please try again.");
          return;
        }
      }
      finalEmail = resolvedEmail;
    }

    if (isPhone && !finalEmail) {
      setErrors({ identifier: "Account not found." });
      return;
    }

    setLoading(true);
    try {
      await signIn("password", { email: finalEmail, password, flow: "signIn" });
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Login Error:", e);
      let msg = "Invalid credentials.";
      const rawMsg = e.data || e.message || "";
      if (typeof rawMsg === "string" && rawMsg.includes("ConvexError:")) {
        msg = rawMsg.split("ConvexError:")[1].trim();
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const siteSettings = useQuery(api.adminSettings.getSiteSettings);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream-bg">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            {siteSettings?.siteLogo ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden mb-5 shadow-sm border border-stone-100 animate-scale-up">
                <ConvexImage storageId={siteSettings.siteLogo} className="w-full h-full object-cover" />
              </div>
            ) : siteSettings === undefined ? (
              <div className="w-14 h-14 bg-stone-100 rounded-2xl mb-5 animate-pulse" />
            ) : null}
          </div>
          
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight text-center">
             {siteSettings === undefined ? (
              <span className="inline-block w-32 h-7 bg-stone-100 rounded-lg animate-pulse" />
            ) : (
              siteSettings?.siteName || "Sign In"
            )}
          </h1>
        </div>

        <div className="card p-8 flex flex-col gap-6 shadow-sm border border-stone-200/60 rounded-3xl bg-white">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">

            <div>
              <label className="text-[12px] font-semibold text-stone-500 mb-1.5 block">Access ID</label>
              <div className="relative">
                {isPhone
                  ? <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.identifier ? 'text-red-400' : 'text-stone-400'}`} size={16} />
                  : <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.identifier ? 'text-red-400' : 'text-stone-400'}`} size={16} />
                }
                <input
                  type="text"
                  placeholder="Phone number or email"
                  value={identifier}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-400 focus:ring-0 transition-all text-[14px] ${errors.identifier ? 'border-red-300 bg-red-50/50' : ''}`}
                  onChange={(e) => { setIdentifier(e.target.value); if(errors.identifier) setErrors(e=>({...e, identifier: ""})); }}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
              {errors.identifier && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.identifier}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[12px] font-semibold text-stone-500 block">Password</label>
                <Link to="/forgot-password" element="span" className="text-[11px] font-medium text-stone-400 hover:text-stone-700 transition-colors">
                  Reset
                </Link>
              </div>
              <div className="relative">
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-stone-400'}`} size={16} />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-400 focus:ring-0 transition-all text-[14px] ${errors.password ? 'border-red-300 bg-red-50/50' : ''}`}
                  onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors(e=>({...e, password: ""})); }}
                  disabled={loading}
                  autoComplete="current-password"
                />
              </div>
              {errors.password && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.password}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-2 rounded-xl bg-stone-900 text-white text-[14px] font-semibold hover:bg-stone-800 transition-colors active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-[14px] text-center mt-6 font-medium text-stone-500">
          New here?{" "}
          <Link to="/signup" className="text-stone-900 font-semibold hover:text-stone-700 transition-colors">
            Create an Account
          </Link>
        </p>
      </div>
    </div>
  );
}
