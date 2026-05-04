import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Phone, ArrowRight, Loader2 } from "lucide-react";
import SegmentedControl from "../../components/ui/SegmentedControl";
import { isValidEmail, isValidPhone } from "../../lib/helpers";
import toast from "react-hot-toast";
import ConvexImage from "../../components/shared/ConvexImage";
import { useAuthActions } from "@convex-dev/auth/react";

export default function Signup() {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const updateProfile = useMutation(api.users.updateProfile);
  const siteSettings = useQuery(api.adminSettings.getSiteSettings);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    stayType: "hostel",
    gender: "male",
    defaultDropPoint: "Main Gate"
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrors({});
    let hasError = false;
    const newErrors = {};

    if (!form.name.trim() || form.name.length < 2) { newErrors.name = "Name must be at least 2 characters."; hasError = true; }
    if (!isValidEmail(form.email)) { newErrors.email = "Invalid email address."; hasError = true; }
    if (!form.password || form.password.length < 6) { newErrors.password = "Password must be at least 6 characters."; hasError = true; }
    if (!isValidPhone(form.phone)) { newErrors.phone = "Invalid 10-digit phone number."; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      // 1. Create native convex auth user
      await signIn("password", { 
        email: form.email, 
        password: form.password, 
        flow: "signUp",
        name: form.name 
      });

      // 2. Set additional profile data
      await updateProfile({
        phone: form.phone.replace(/\D/g, "").slice(-10),
        stayType: form.stayType,
        gender: form.gender,
        defaultDropPoint: form.defaultDropPoint,
        name: form.name
      });
      
      toast.success("Account created successfully!");
      // The AuthProvider will automatically re-route
    } catch (error) {
      console.error(error);
      const msg = error.message || "Failed to create account.";
      toast.error(msg);
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 flex flex-col justify-center sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-2 text-center text-3xl font-extrabold text-stone-900">
          Create an Account
        </h2>
        <p className="mt-2 text-center text-sm text-stone-600">
          Or{' '}
          <Link to="/login" className="font-medium text-stone-900 hover:text-stone-800 transition-colors">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-stone-100">
          <form className="space-y-5" onSubmit={handleSignup}>
            {errors.form && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 text-center">
                {errors.form}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3 bg-white border ${errors.name ? 'border-red-300 focus:ring-red-200' : 'border-stone-200 focus:border-stone-800 focus:ring-stone-200'} rounded-xl text-stone-800 placeholder-stone-400 focus:ring-4 transition-all outline-none`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3 bg-white border ${errors.email ? 'border-red-300 focus:ring-red-200' : 'border-stone-200 focus:border-stone-800 focus:ring-stone-200'} rounded-xl text-stone-800 placeholder-stone-400 focus:ring-4 transition-all outline-none`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3 bg-white border ${errors.password ? 'border-red-300 focus:ring-red-200' : 'border-stone-200 focus:border-stone-800 focus:ring-stone-200'} rounded-xl text-stone-800 placeholder-stone-400 focus:ring-4 transition-all outline-none`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Phone Number</label>
              <div className="relative">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                  className={`block w-full pl-11 pr-4 py-3 bg-white border ${errors.phone ? 'border-red-300 focus:ring-red-200' : 'border-stone-200 focus:border-stone-800 focus:ring-stone-200'} rounded-xl text-stone-800 placeholder-stone-400 focus:ring-4 transition-all outline-none`}
                  placeholder="9876543210"
                />
              </div>
              {errors.phone && <p className="text-red-500 text-sm mt-1.5 ml-1 flex items-center"><span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Gender</label>
                <SegmentedControl
                  options={[
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" }
                  ]}
                  value={form.gender}
                  onChange={(val) => set("gender", val)}
                  size="sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Stay Type</label>
                <SegmentedControl
                  options={[
                    { label: "Hostel", value: "hostel" },
                    { label: "Day Scholar", value: "day_scholar" }
                  ]}
                  value={form.stayType}
                  onChange={(val) => set("stayType", val)}
                  size="sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-stone-900 hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-6"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center">
                  Sign Up
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
