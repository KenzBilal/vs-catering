import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import SegmentedControl from "../components/ui/SegmentedControl";
import { isValidEmail, isValidPhone } from "../lib/helpers";
import { auth } from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const createUserMutation = useMutation(api.users.createUser);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    stayType: "hostel",
    gender: "male",
    // registrationNumber and defaultDropPoint removed for minimal signup
    defaultDropPoint: "Main Gate", // Hidden default
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSignup = async (e) => {
    e?.preventDefault();
    setError("");
    
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.email.trim()) return setError("Email is required.");
    if (!isValidEmail(form.email)) return setError("Enter a valid email address.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    
    setLoading(true);
    try {
      // 1. Create account in Firebase
      await createUserWithEmailAndPassword(auth, form.email.toLowerCase().trim(), form.password);
      
      // 2. Create user in Convex
      const { password, ...userData } = form;
      const result = await createUserMutation({
        ...userData,
        email: form.email.toLowerCase().trim(),
      });
      
      login(result);
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Signup Error:", e);
      const errorCode = e.code || "";
      let msg = "Failed to create account.";
      
      if (errorCode === "auth/email-already-in-use") msg = "This email is already registered.";
      if (errorCode === "auth/invalid-email") msg = "Invalid email address.";
      if (errorCode === "auth/weak-password") msg = "Password is too weak.";
      
      const rawMsg = e.data || e.message || "";
      if (typeof rawMsg === "string" && rawMsg.includes("ConvexError:")) {
        msg = rawMsg.split("ConvexError:")[1].trim();
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream-bg">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-stone-900/20">
            <UserPlus className="text-cream-50" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Create Account</h1>
          <p className="text-[14.5px] text-stone-500 mt-1 font-medium text-center">Join the catering team</p>
        </div>

        <div className="card p-6 sm:p-8 flex flex-col gap-5 shadow-xl shadow-stone-200/50">
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="text"
                  placeholder="Your official name"
                  className="pl-11"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="pl-11"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  className="pl-11"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="label">Phone <span className="text-stone-400">(Optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  className="pl-11"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label mb-2">Gender</label>
                <SegmentedControl
                  options={[
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" }
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
                    { label: "Day Scholar", value: "day_scholar" }
                  ]}
                  value={form.stayType}
                  onChange={(val) => set("stayType", val)}
                  disabled={loading}
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
              {loading ? "Creating Account..." : (
                <>
                  Get Started <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-[14px] text-center mt-6 font-medium text-stone-500">
          Already have an account?{" "}
          <Link to="/login" className="text-stone-900 font-bold hover:underline underline-offset-4 decoration-2 decoration-cream-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
