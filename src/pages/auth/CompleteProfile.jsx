import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Phone, User, UserCheck } from "lucide-react";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import SegmentedControl from "../../components/ui/SegmentedControl";
import { isValidPhone } from "../../lib/helpers";
import toast from "react-hot-toast";

const DROP_POINT_OPTIONS = ["Main Gate", "Dakoha", "Law Gate"];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const emailFromQuery = searchParams.get("email")?.toLowerCase().trim() || "";
  const nameFromQuery = searchParams.get("name")?.trim() || "";
  const firebaseEmail = auth.currentUser?.email?.toLowerCase().trim() || "";
  const effectiveEmail = firebaseEmail || emailFromQuery;

  const createUserMutation = useMutation(api.users.createUser);
  const loginUserMutation = useMutation(api.users.loginUser);

  const [form, setForm] = useState({
    name: auth.currentUser?.displayName?.trim() || nameFromQuery,
    phone: "",
    stayType: "hostel",
    gender: "male",
    defaultDropPoint: "Main Gate",
    rememberMe: true,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!effectiveEmail) {
      toast.error("Google session not found. Please sign in again.");
      navigate("/login", { replace: true });
    }
  }, [effectiveEmail, navigate]);

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Name is required.";
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required.";
    else if (!isValidPhone(form.phone)) nextErrors.phone = "Enter a valid 10-digit number.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (!auth.currentUser) {
      toast.error("Google session expired. Please sign in again.");
      navigate("/login", { replace: true });
      return;
    }

    setLoading(true);
    try {
      await createUserMutation({
        name: form.name.trim(),
        email: effectiveEmail,
        phone: form.phone.trim(),
        stayType: form.stayType,
        gender: form.gender,
        defaultDropPoint: form.defaultDropPoint,
        rememberMe: form.rememberMe,
      });

      const session = await loginUserMutation({
        email: effectiveEmail,
        rememberMe: form.rememberMe,
        firebaseVerified: true,
      });

      if (!session || session.emailVerified === false) {
        toast.error("Profile created, but sign-in failed. Please log in again.");
        navigate("/login", { replace: true });
        return;
      }

      login(session, form.rememberMe);
      toast.success("Profile completed. Welcome!");
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Complete profile error:", e);
      const rawMsg = e.data || e.message || "Failed to complete profile.";
      const msg = typeof rawMsg === "string" && rawMsg.includes("ConvexError:")
        ? rawMsg.split("ConvexError:")[1].trim()
        : rawMsg;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream-bg">
      <div className="w-full max-w-md animate-slide-up">
        <Link to="/login" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 font-medium mb-8 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-stone-900/20">
            <UserCheck className="text-cream-50" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Complete Your Profile</h1>
          <p className="text-[14.5px] text-stone-500 mt-1 font-medium text-center px-3">
            One quick step before continuing with Google
          </p>
        </div>

        <div className="card p-6 sm:p-8 flex flex-col gap-5 shadow-xl shadow-stone-200/50">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={effectiveEmail}
                disabled
                className="opacity-70 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.name ? "text-red-400" : "text-stone-400"}`} size={18} />
                <input
                  type="text"
                  placeholder="Your official name"
                  className={`pl-11 ${errors.name ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : ""}`}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.phone ? "text-red-400" : "text-stone-400"}`} size={18} />
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  className={`pl-11 ${errors.phone ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : ""}`}
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  disabled={loading}
                />
              </div>
              {errors.phone && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label mb-2">Gender</label>
                <SegmentedControl
                  options={[
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                  ]}
                  value={form.gender}
                  onChange={(val) => set("gender", val)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="label mb-2">Stay Type</label>
                <SegmentedControl
                  options={[
                    { label: "Hostel", value: "hostel" },
                    { label: "Day Scholar", value: "day_scholar" },
                  ]}
                  value={form.stayType}
                  onChange={(val) => set("stayType", val)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">Default Drop Point</label>
              <select
                value={form.defaultDropPoint}
                onChange={(e) => set("defaultDropPoint", e.target.value)}
                disabled={loading}
              >
                {DROP_POINT_OPTIONS.map((point) => (
                  <option key={point} value={point}>{point}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="remember_google"
                checked={form.rememberMe}
                onChange={(e) => set("rememberMe", e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20 cursor-pointer"
                disabled={loading}
              />
              <label htmlFor="remember_google" className="text-[13.5px] font-medium text-stone-600 cursor-pointer select-none">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3.5 mt-1 text-[15px]"
              disabled={loading}
            >
              {loading ? "Finishing setup..." : "Continue to Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
