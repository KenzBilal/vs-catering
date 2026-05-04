import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, ArrowRight, Phone } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import toast from "react-hot-toast";
import ConvexImage from "../../components/shared/ConvexImage";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const [identifier, setIdentifier] = useState(""); // phone or email
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

    if (!identifier.trim()) { newErrors.identifier = "Enter your phone number or email."; hasError = true; }
    if (!password.trim()) { newErrors.password = "Password is required."; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    let loginEmail = identifier.toLowerCase().trim();
    if (isPhone) {
      if (!resolvedEmail) {
        setErrors({ identifier: "No account found with this phone number." });
        return;
      }
      loginEmail = resolvedEmail;
    }

    setLoading(true);
    try {
      await signIn("password", { 
        email: loginEmail, 
        password,
        flow: "signIn"
      });
      // AuthProvider will automatically re-render and navigate
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Invalid credentials");
      setErrors({ form: "Invalid email or password." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-stone-200/50 p-8 border border-stone-100">
        <div className="text-center mb-10">
          <div className="h-16 w-16 bg-stone-100 text-stone-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-stone-800">Welcome Back</h1>
          <p className="text-stone-500 mt-2">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {errors.form && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
              {errors.form}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Email or Phone</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                {isPhone ? <Phone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
              </div>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className={`block w-full pl-11 pr-4 py-3.5 bg-white border ${errors.identifier ? 'border-red-300 focus:ring-red-200' : 'border-stone-200 focus:border-stone-800 focus:ring-stone-200'} rounded-xl text-stone-800 placeholder-stone-400 focus:ring-4 transition-all outline-none`}
                placeholder="admin@example.com or 9876543210"
              />
            </div>
            {errors.identifier && <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.identifier}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-stone-700">Password</label>
              <Link to="/forgot-password" className="text-sm font-medium text-stone-900 hover:text-stone-700 transition-colors">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full pl-11 pr-4 py-3.5 bg-white border ${errors.password ? 'border-red-300 focus:ring-red-200' : 'border-stone-200 focus:border-stone-800 focus:ring-stone-200'} rounded-xl text-stone-800 placeholder-stone-400 focus:ring-4 transition-all outline-none`}
                placeholder="••••••••"
              />
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 mt-6 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-4 focus:ring-stone-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-stone-500 text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-stone-900 font-bold hover:text-stone-700 ml-1 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
