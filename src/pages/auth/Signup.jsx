import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock, Phone, ArrowRight, Loader2 } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import toast from "react-hot-toast";
import ConvexImage from "../../components/shared/ConvexImage";

const FIELD_CLS = (err) =>
  `w-full pl-10 pr-4 py-[11px] rounded-xl bg-cream-50 border text-[14px] outline-none transition-all duration-200 placeholder:text-stone-400/70 focus:bg-white focus:border-stone-400 focus:shadow-[0_0_0_3px_rgba(28,25,22,0.06)] ${
    err ? "border-red-300 bg-red-50/60" : "border-cream-300"
  }`;

const ICON_CLS = (err) =>
  `absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${err ? "text-red-400" : "text-stone-400"}`;

function SegmentPill({ options, value, onChange, disabled }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-cream-300 bg-cream-50 p-0.5 gap-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={`flex-1 py-2 text-[13px] font-semibold rounded-[10px] transition-all duration-150 ${
            value === o.value
              ? "bg-stone-800 text-white shadow-sm"
              : "text-stone-500 hover:text-stone-700 hover:bg-cream-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

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

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (form.password.length < 6) e.password = "Min 6 characters";
    const digits = form.phone.replace(/\D/g, "");
    if (!digits) e.phone = "Required";
    else if (digits.length !== 10) e.phone = "Must be 10 digits";
    return e;
  };

  const handleSignup = async (e) => {
    e?.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    // ✅ CRITICAL: Convex Auth Password provider requires FormData
    const formData = new FormData();
    formData.set("email", form.email.toLowerCase().trim());
    formData.set("password", form.password);
    formData.set("name", form.name.trim());
    formData.set("phone", form.phone.replace(/\D/g, "").slice(-10));
    formData.set("gender", form.gender);
    formData.set("stayType", form.stayType);
    formData.set("defaultDropPoint", form.defaultDropPoint);
    formData.set("flow", "signUp");

    try {
      await signIn("password", formData);
      toast.success("Account created.");
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Signup error:", err);
      const raw = err?.data || err?.message || "";
      const msg = typeof raw === "string"
        ? raw.replace(/^.*ConvexError:\s*/i, "").replace(/^Error:\s*/i, "")
        : "Failed to create account.";

      if (msg.toLowerCase().includes("already")) {
        setErrors({ email: "Email already registered" });
        toast.error("This email is already registered.");
      } else {
        toast.error(msg || "Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: "var(--cream-bg)" }}>
      <div className="w-full max-w-md" style={{ animation: "fade-in 0.2s ease-out forwards" }}>

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
          <h1 className="text-[22px] font-bold text-stone-900 tracking-tight">Create Account</h1>
          <p className="text-[13px] text-stone-400 mt-1 font-medium">Fill in your details to get started</p>
        </div>

        {/* Card */}
        <div className="card rounded-2xl">
          <form onSubmit={handleSignup} noValidate>

            {/* Full Name */}
            <div className="mb-4">
              <label className="label">Full Name</label>
              <div className="relative">
                <User size={15} className={ICON_CLS(errors.name)} />
                <input
                  type="text"
                  className={FIELD_CLS(errors.name)}
                  placeholder="Your official name"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  disabled={loading}
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="text-[11.5px] text-red-500 font-medium mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={15} className={ICON_CLS(errors.email)} />
                <input
                  type="email"
                  className={FIELD_CLS(errors.email)}
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-[11.5px] text-red-500 font-medium mt-1">{errors.email}</p>}
            </div>

            {/* Phone + Password side by side */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <Phone size={15} className={ICON_CLS(errors.phone)} />
                  <input
                    type="tel"
                    className={FIELD_CLS(errors.phone)}
                    placeholder="10 digits"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    disabled={loading}
                    autoComplete="tel"
                  />
                </div>
                {errors.phone && <p className="text-[11.5px] text-red-500 font-medium mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={15} className={ICON_CLS(errors.password)} />
                  <input
                    type="password"
                    className={FIELD_CLS(errors.password)}
                    placeholder="Min. 6 chars"
                    value={form.password}
                    onChange={(e) => set("password", e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
                {errors.password && <p className="text-[11.5px] text-red-500 font-medium mt-1">{errors.password}</p>}
              </div>
            </div>

            {/* Gender + Stay */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="label">Gender</label>
                <SegmentPill
                  options={[{ label: "Male", value: "male" }, { label: "Female", value: "female" }]}
                  value={form.gender}
                  onChange={(v) => set("gender", v)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="label">Stay Type</label>
                <SegmentPill
                  options={[{ label: "Hostel", value: "hostel" }, { label: "Day", value: "day_scholar" }]}
                  value={form.stayType}
                  onChange={(v) => set("stayType", v)}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary w-full py-3 text-[14px]"
              disabled={loading}
            >
              {loading ? (
                <><Loader2 size={17} className="animate-spin" /> Creating account...</>
              ) : (
                <>Create Account <ArrowRight size={17} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-[13.5px] text-center mt-5 text-stone-400 font-medium">
          Already have an account?{" "}
          <Link to="/login" className="text-stone-800 font-bold hover:text-stone-600 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
