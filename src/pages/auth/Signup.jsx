import { useState } from "react";
import { useMutation, useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Phone, ArrowRight } from "lucide-react";
import SegmentedControl from "../../components/ui/SegmentedControl";
import { isValidEmail, isValidPhone } from "../../lib/helpers";
import { auth } from "../../lib/firebase";
import { createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import toast from "react-hot-toast";
import { useQuery } from "convex/react";
import ConvexImage from "../../components/shared/ConvexImage";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const convex = useConvex();
  const siteSettings = useQuery(api.adminSettings.getSiteSettings);
  const createUserMutation = useMutation(api.users.createUser);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    stayType: "hostel",
    gender: "male",
    defaultDropPoint: "Main Gate",
    rememberMe: true,
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
    
    if (!form.name.trim()) { newErrors.name = "Name is required."; hasError = true; }
    if (!form.email.trim()) { newErrors.email = "Email is required."; hasError = true; }
    else if (!isValidEmail(form.email)) { newErrors.email = "Enter a valid email address."; hasError = true; }
    if (form.password.length < 6) { newErrors.password = "Password must be at least 6 characters."; hasError = true; }
    if (!form.phone.trim()) { newErrors.phone = "Phone number is required."; hasError = true; }
    else if (!isValidPhone(form.phone)) { newErrors.phone = "Enter a valid 10-digit number."; hasError = true; }
    
    if (hasError) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      // #9: Pre-check in Convex before calling Firebase to minimize orphaned accounts
      const check = await convex.query(api.users.checkUserExists, { 
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim()
      });
      
      if (check.exists) {
        setErrors({ [check.reason]: `This ${check.reason} is already registered.` });
        setLoading(false);
        return;
      }

      // 1. Create account in Firebase
      const firebaseUserCred = await createUserWithEmailAndPassword(auth, form.email.toLowerCase().trim(), form.password);

      // 2. Create user in Convex — if this fails, roll back Firebase account
      const { password, ...userData } = form;
      let result;
      try {
        result = await createUserMutation(userData);
      } catch (convexErr) {
        // #29: Rollback — delete Firebase account so the email is freed
        try { await deleteUser(firebaseUserCred.user); } catch (_) {}
        throw convexErr;
      }
      
      toast.success("Account created successfully!");
      login(result, form.rememberMe);
      navigate("/", { replace: true });
    } catch (e) {
      console.error("Signup Error Object:", e);
      const errorCode = e.code || "";
      let msg = e.message || "Failed to create account.";
      
      if (errorCode === "auth/email-already-in-use") msg = "This email is already registered in Firebase. Delete the old account from Firebase Console → Authentication → Users first, then retry.";
      if (errorCode === "auth/invalid-email") msg = "Invalid email address.";
      if (errorCode === "auth/weak-password") msg = "Password is too weak. Use at least 6 characters.";
      if (errorCode === "auth/operation-not-allowed") msg = "Email/Password sign-in is not enabled. Go to Firebase Console → Authentication → Sign-in method → Enable Email/Password.";
      
      const rawMsg = e.data || e.message || "";
      if (typeof rawMsg === "string" && rawMsg.includes("ConvexError:")) {
        msg = rawMsg.split("ConvexError:")[1].trim();
      }
      
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };


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
              <UserPlus className="text-cream-50" size={24} />
            </div>
          )}
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            {siteSettings?.siteName ? `Join ${siteSettings.siteName}` : "Create Account"}
          </h1>
          <p className="text-[14.5px] text-stone-500 mt-1 font-medium text-center">Join the catering team</p>
        </div>


        <div className="card p-6 sm:p-8 flex flex-col gap-5 shadow-xl shadow-stone-200/50">
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.name ? 'text-red-400' : 'text-stone-400'}`} size={18} />
                <input
                  type="text"
                  placeholder="Your official name"
                  className={`pl-11 ${errors.name ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-stone-400'}`} size={18} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className={`pl-11 ${errors.email ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-stone-400'}`} size={18} />
                <input
                  type="password"
                  placeholder="Min. 6 characters"
                  className={`pl-11 ${errors.password ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.password && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.password}</p>}
            </div>

            <div>
              <label className="label">Phone Number</label>
              <div className="relative">
                <Phone className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-400' : 'text-stone-400'}`} size={18} />
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  className={`pl-11 ${errors.phone ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}`}
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

            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="remember_signup"
                checked={form.rememberMe}
                onChange={(e) => set("rememberMe", e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20 cursor-pointer"
              />
              <label htmlFor="remember_signup" className="text-[13.5px] font-medium text-stone-600 cursor-pointer select-none">
                Keep me signed in
              </label>
            </div>


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
