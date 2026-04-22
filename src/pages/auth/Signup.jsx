import { useState } from "react";
import { useMutation, useConvex, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Phone, ArrowRight, Loader2 } from "lucide-react";
import SegmentedControl from "../../components/ui/SegmentedControl";
import { isValidEmail, isValidPhone } from "../../lib/helpers";
import { auth } from "../../lib/firebase";
import { createUserWithEmailAndPassword, deleteUser, sendEmailVerification } from "firebase/auth";
import toast from "react-hot-toast";
import { useQuery } from "convex/react";
import ConvexImage from "../../components/shared/ConvexImage";
import { APP_BASE_URL } from "../../lib/appUrl";

export default function Signup() {
  const navigate = useNavigate();
  const convex = useConvex();
  const siteSettings = useQuery(api.adminSettings.getSiteSettings);
  const createUserAction = useAction(api.auth_actions.verifyAndCreateUser);

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
      // 1. Pre-check in Convex to avoid duplicate records
      const check = await convex.query(api.users.checkUserExists, { 
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim()
      });
      
      if (check.exists) {
        const msg = "This email or phone number is already registered.";
        setErrors({ email: msg, phone: msg });
        toast.error(msg);
        setLoading(false);
        return;
      }

      const normalizedEmail = form.email.toLowerCase().trim();

      // 2. Create account in Firebase
      let firebaseUserCred;
      try {
        firebaseUserCred = await createUserWithEmailAndPassword(auth, normalizedEmail, form.password);
      } catch (fbErr) {
        if (fbErr.code === "auth/email-already-in-use") {
          const msg = "This email is already registered. Please sign in instead.";
          setErrors({ email: msg });
          toast.error(msg);
        } else {
          toast.error(fbErr.message || "Authentication service error.");
        }
        setLoading(false);
        return;
      }

      // 3. Create user in Convex (with token verification)
      try {
        const idToken = await firebaseUserCred.user.getIdToken();
        const { password, ...userData } = form;
        await createUserAction({ idToken, userData });
      } catch (convexErr) {
        // Rollback Firebase account if Convex fails to keep them in sync
        try { await deleteUser(firebaseUserCred.user); } catch (_) {}
        throw convexErr;
      }

      // 4. Send verification email
      try {
        const actionCodeSettings = {
          url: `${APP_BASE_URL}/auth-action?email=${encodeURIComponent(normalizedEmail)}`,
          handleCodeInApp: true,
        };
        await sendEmailVerification(firebaseUserCred.user, actionCodeSettings);
        toast.success("Account created! Verification email sent.");
      } catch (emailErr) {
        console.error("Verification email failed:", emailErr);
        toast.error("Account created, but verification email failed to send. You can try again from the verification page.");
      }

      navigate(`/verify-email?email=${encodeURIComponent(normalizedEmail)}`, { replace: true });
    } catch (e) {
      const rawMsg = e.data || e.message || "Failed to create account.";
      const msg = typeof rawMsg === "string" ? rawMsg.replace(/.*ConvexError:\s*/, "") : "Registration error.";
      toast.error(msg);
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
              <div className="w-14 h-14 rounded-[20px] overflow-hidden mb-6 shadow-2xl shadow-stone-200 border-2 border-white ring-1 ring-stone-100 animate-scale-up">
                <ConvexImage storageId={siteSettings.siteLogo} className="w-full h-full object-cover" />
              </div>
            ) : siteSettings === undefined ? (
              <div className="w-14 h-14 bg-stone-100 rounded-[20px] mb-6 animate-pulse" />
            ) : (
              <div className="w-14 h-14 bg-stone-900 rounded-[20px] flex items-center justify-center mb-6 shadow-2xl shadow-stone-900/20 animate-scale-up">
                <UserPlus className="text-cream-50" size={24} />
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-black text-stone-900 tracking-tight text-center">
             {siteSettings === undefined ? (
              <span className="inline-block w-40 h-7 bg-stone-100 rounded-lg animate-pulse" />
            ) : (
              siteSettings?.siteName ? `Join ${siteSettings.siteName}` : "Create Account"
            )}
          </h1>
          <p className="text-[14px] text-stone-500 mt-1 font-medium text-center">Become a part of the catering team</p>
        </div>


        <div className="card p-8 flex flex-col gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-stone-200/60 rounded-[32px] bg-white/80 backdrop-blur-xl">
          <form onSubmit={handleSignup} className="flex flex-col gap-5">
            <div>
              <label className="label !text-[11px] !font-black !uppercase !tracking-widest !text-stone-400 !mb-2">Full Name</label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.name ? 'text-red-400' : 'text-stone-300'}`} size={18} />
                <input
                  type="text"
                  placeholder="Your official name"
                  className={`pl-12 py-3 rounded-2xl bg-stone-50/50 border-stone-100 focus:bg-white focus:ring-4 focus:ring-stone-900/5 transition-all ${errors.name ? 'border-red-200 focus:border-red-300 focus:ring-red-50' : ''}`}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-600 font-bold mt-1.5 ml-1 animate-slide-up">{errors.name}</p>}
            </div>

            <div>
              <label className="label !text-[11px] !font-black !uppercase !tracking-widest !text-stone-400 !mb-2">Email Address</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.email ? 'text-red-400' : 'text-stone-300'}`} size={18} />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className={`pl-12 py-3 rounded-2xl bg-stone-50/50 border-stone-100 focus:bg-white focus:ring-4 focus:ring-stone-900/5 transition-all ${errors.email ? 'border-red-200 focus:border-red-300 focus:ring-red-50' : ''}`}
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-600 font-bold mt-1.5 ml-1 animate-slide-up">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <label className="label !text-[11px] !font-black !uppercase !tracking-widest !text-stone-400 !mb-2">Phone</label>
                  <div className="relative">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.phone ? 'text-red-400' : 'text-stone-300'}`} size={17} />
                    <input
                      type="tel"
                      placeholder="10-digits"
                      className={`pl-11 py-3 rounded-2xl bg-stone-50/50 border-stone-100 focus:bg-white focus:ring-4 focus:ring-stone-900/5 transition-all ${errors.phone ? 'border-red-200 focus:border-red-300 focus:ring-red-50' : ''}`}
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                      disabled={loading}
                    />
                  </div>
                  {errors.phone && <p className="text-[10px] text-red-600 font-bold mt-1.5 ml-1 animate-slide-up">{errors.phone}</p>}
               </div>
               <div>
                  <label className="label !text-[11px] !font-black !uppercase !tracking-widest !text-stone-400 !mb-2">Password</label>
                  <div className="relative">
                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.password ? 'text-red-400' : 'text-stone-300'}`} size={17} />
                    <input
                      type="password"
                      placeholder="Min. 6"
                      className={`pl-11 py-3 rounded-2xl bg-stone-50/50 border-stone-100 focus:bg-white focus:ring-4 focus:ring-stone-900/5 transition-all ${errors.password ? 'border-red-200 focus:border-red-300 focus:ring-red-50' : ''}`}
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  {errors.password && <p className="text-[10px] text-red-600 font-bold mt-1.5 ml-1 animate-slide-up">{errors.password}</p>}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label !text-[11px] !font-black !uppercase !tracking-widest !text-stone-400 !mb-2">Gender</label>
                <SegmentedControl
                  options={[
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" }
                  ]}
                  value={form.gender}
                  onChange={(val) => set("gender", val)}
                  disabled={loading}
                  className="!rounded-2xl !p-1 !bg-stone-50"
                />
              </div>

              <div>
                <label className="label !text-[11px] !font-black !uppercase !tracking-widest !text-stone-400 !mb-2">Stay</label>
                <SegmentedControl
                  options={[
                    { label: "Hostel", value: "hostel" },
                    { label: "Day", value: "day_scholar" }
                  ]}
                  value={form.stayType}
                  onChange={(val) => set("stayType", val)}
                  disabled={loading}
                  className="!rounded-2xl !p-1 !bg-stone-50"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-1">
              <input
                type="checkbox"
                id="remember_signup"
                checked={form.rememberMe}
                onChange={(e) => set("rememberMe", e.target.checked)}
                className="w-5 h-5 rounded-lg border-stone-200 text-stone-900 focus:ring-stone-900/10 cursor-pointer transition-all"
                disabled={loading}
              />
              <label htmlFor="remember_signup" className="text-[13px] font-bold text-stone-500 cursor-pointer select-none">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-4 rounded-2xl text-[15px] font-black shadow-xl shadow-stone-900/10 hover:shadow-stone-900/20 active:scale-[0.98] transition-all"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create Account <ArrowRight size={20} />
                </span>
              )}
            </button>
          </form>
        </div>

        <p className="text-[14.5px] text-center mt-8 font-bold text-stone-400 tracking-tight">
          Already have an account?{" "}
          <Link to="/login" className="text-stone-900 font-black hover:underline underline-offset-8 decoration-2 decoration-stone-200 transition-all">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
