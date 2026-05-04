import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Phone, ArrowRight, Loader2 } from "lucide-react";
import SegmentedControl from "../../components/ui/SegmentedControl";
import { isValidEmail, isValidPhone } from "../../lib/helpers";
import { useAuthActions } from "@convex-dev/auth/react";
import toast from "react-hot-toast";
import ConvexImage from "../../components/shared/ConvexImage";

export default function Signup() {
  const navigate = useNavigate();
  const siteSettings = useQuery(api.adminSettings.getSiteSettings);
  const { signIn } = useAuthActions();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    stayType: "hostel",
    gender: "male",
    defaultDropPoint: "Main Gate",
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const handleSignup = async (e) => {
    e?.preventDefault();
    setErrors({});
    let hasError = false;
    const newErrors = {};
    
    if (!form.name.trim()) { newErrors.name = "Required"; hasError = true; }
    if (!form.email.trim()) { newErrors.email = "Required"; hasError = true; }
    else if (!isValidEmail(form.email)) { newErrors.email = "Invalid email"; hasError = true; }
    if (form.password.length < 6) { newErrors.password = "Min 6 chars"; hasError = true; }
    if (!form.phone.trim()) { newErrors.phone = "Required"; hasError = true; }
    else if (!isValidPhone(form.phone)) { newErrors.phone = "Invalid phone"; hasError = true; }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      await signIn("password", {
        email: form.email.toLowerCase().trim(),
        password: form.password,
        name: form.name.trim(),
        phone: form.phone.trim(),
        gender: form.gender,
        stayType: form.stayType,
        defaultDropPoint: form.defaultDropPoint,
        flow: "signUp"
      });

      toast.success("Account created successfully.");
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Signup error:", e);
      const msg = typeof e.data === "string" ? e.data : e.message || "Failed to create account.";
      if (msg.includes("already exists") || msg.includes("already registered")) {
         setErrors({ email: "Email already registered" });
         toast.error("This email is already registered.");
      } else {
         toast.error(msg.replace(/^ConvexError: /, ""));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream-bg">
      <div className="w-full max-w-md animate-fade-in">
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
            Create Account
          </h1>
        </div>

        <div className="card p-8 flex flex-col gap-6 shadow-sm border border-stone-200/60 rounded-3xl bg-white">
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            <div>
              <label className="text-[12px] font-semibold text-stone-500 mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.name ? 'text-red-400' : 'text-stone-400'}`} size={16} />
                <input
                  type="text"
                  placeholder="Official name"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-400 focus:ring-0 transition-all text-[14px] ${errors.name ? 'border-red-300 bg-red-50/50' : ''}`}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-[12px] font-semibold text-stone-500 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-stone-400'}`} size={16} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-400 focus:ring-0 transition-all text-[14px] ${errors.email ? 'border-red-300 bg-red-50/50' : ''}`}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="text-[12px] font-semibold text-stone-500 mb-1.5 block">Phone</label>
                  <div className="relative">
                    <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-400' : 'text-stone-400'}`} size={16} />
                    <input
                      type="tel"
                      placeholder="10-digits"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-400 focus:ring-0 transition-all text-[14px] ${errors.phone ? 'border-red-300 bg-red-50/50' : ''}`}
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      disabled={loading}
                    />
                  </div>
                  {errors.phone && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.phone}</p>}
               </div>
               <div>
                  <label className="text-[12px] font-semibold text-stone-500 mb-1.5 block">Password</label>
                  <div className="relative">
                    <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-stone-400'}`} size={16} />
                    <input
                      type="password"
                      placeholder="Min. 6 chars"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:border-stone-400 focus:ring-0 transition-all text-[14px] ${errors.password ? 'border-red-300 bg-red-50/50' : ''}`}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && <p className="text-[11px] text-red-500 font-medium mt-1">{errors.password}</p>}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[12px] font-semibold text-stone-500 mb-1.5 block">Gender</label>
                <SegmentedControl
                  options={[
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" }
                  ]}
                  value={form.gender}
                  onChange={(val) => set("gender", val)}
                  disabled={loading}
                  className="!rounded-xl !p-1 !bg-stone-50 border border-stone-200 text-[13px]"
                />
              </div>

              <div>
                <label className="text-[12px] font-semibold text-stone-500 mb-1.5 block">Stay</label>
                <SegmentedControl
                  options={[
                    { label: "Hostel", value: "hostel" },
                    { label: "Day", value: "day_scholar" }
                  ]}
                  value={form.stayType}
                  onChange={(val) => set("stayType", val)}
                  disabled={loading}
                  className="!rounded-xl !p-1 !bg-stone-50 border border-stone-200 text-[13px]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 mt-2 rounded-xl bg-stone-900 text-white text-[14px] font-semibold hover:bg-stone-800 transition-colors active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-[14px] text-center mt-6 font-medium text-stone-500">
          Already have an account?{" "}
          <Link to="/login" className="text-stone-900 font-semibold hover:text-stone-700 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
