import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Phone, User, UtensilsCrossed, MapPin, Hash, ShieldCheck, ArrowRight, RefreshCcw } from "lucide-react";
import SegmentedControl from "../components/ui/SegmentedControl";
import { isValidPhone, isValidRegNumber } from "../lib/helpers";
import { auth } from "../lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const createUser = useMutation(api.users.createUser);
  const dropPoints = useQuery(api.dropPoints.getDropPoints);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    stayType: "hostel",
    gender: "male",
    defaultDropPoint: "Main Gate",
    registrationNumber: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("input"); // input, otp
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    if (auth) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSendOTP = async () => {
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (!isValidPhone(form.phone)) return setError("Enter a valid 10-digit number.");
    if (form.registrationNumber.trim() && !isValidRegNumber(form.registrationNumber.trim())) {
      return setError("Enter a valid 8-digit registration number.");
    }
    
    if (!auth) return setError("Authentication service is unavailable. Please check your connection.");
    setLoading(true);
    try {
      // Sanitize: Remove all non-numeric characters and handle existing +91
      const cleanPhone = form.phone.replace(/\D/g, "").slice(-10);
      const formattedPhone = `+91${cleanPhone}`;
      
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setStep("otp");
    } catch (e) {
      console.error("Firebase Send OTP Error (Signup):", e);
      // Reset reCAPTCHA on failure so they can try again
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          const container = document.getElementById("recaptcha-container");
          if (container) container.innerHTML = "";
          window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
        } catch (clearErr) {
          console.error("Failed to clear verifier", clearErr);
        }
      }
      const errorCode = e.code || "";
      const msg = e.message || "Failed to send OTP. Please check your number or try again.";
      setError(`${msg} (${errorCode})`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");
    if (!otp || otp.length < 6) return setError("Enter a valid 6-digit OTP.");
    
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      
      // If confirmed, create user in Convex
      const result = await createUser(form);
      login(result);
      navigate("/", { replace: true });
    } catch (e) {
      console.error(e);
      const rawMsg = e.data || e.message || "";
      const msg = typeof rawMsg === "string" ? rawMsg : "Something went wrong.";
      
      if (msg.includes("auth/invalid-verification-code")) {
        setError("Invalid OTP code. Please try again.");
      } else if (msg.includes("ConvexError:")) {
        setError(msg.split("ConvexError:")[1].trim());
      } else {
        setError(msg || "Account creation failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream-bg">
      <div id="recaptcha-container"></div>
      
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-stone-900/20">
            <UtensilsCrossed className="text-cream-50" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            {step === "input" ? "Create Account" : "Verify Phone"}
          </h1>
          <p className="text-[14.5px] text-stone-500 mt-1 font-medium text-center">
            {step === "input" 
              ? "Join Catering" 
              : `Enter the 6-digit code sent to +91 ${form.phone}`}
          </p>
        </div>

        <div className="card p-6 sm:p-8 flex flex-col gap-5 shadow-xl shadow-stone-200/50">
          {step === "input" ? (
            <>
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
                  />
                </div>
              </div>

              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <div className="absolute left-10 top-1/2 -translate-y-1/2 text-[14.5px] font-bold text-stone-400 border-r border-stone-200 pr-2">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    className="pl-20"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  />
                </div>
              </div>

              <div>
                <label className="label">LPU Registration Number <span className="text-stone-400 lowercase">(Optional)</span></label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="text"
                    placeholder="eg. 12517494"
                    className="pl-11"
                    value={form.registrationNumber}
                    onChange={(e) => set("registrationNumber", e.target.value.replace(/\D/g, "").slice(0, 8))}
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
                  />
                </div>

                <div>
                  <label className="label mb-2">Accommodation</label>
                  <SegmentedControl
                    options={[
                      { label: "Hostel", value: "hostel" },
                      { label: "Day Scholar", value: "day_scholar" }
                    ]}
                    value={form.stayType}
                    onChange={(val) => set("stayType", val)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Default Drop Point</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <select
                    value={form.defaultDropPoint}
                    className="pl-11"
                    onChange={(e) => set("defaultDropPoint", e.target.value)}
                  >
                    {(dropPoints || ["Main Gate", "Dakoha", "Law Gate"]).map((dp) => (
                      <option key={dp.name || dp} value={dp.name || dp}>
                        {dp.name || dp}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] font-medium animate-fade-in">
                  {error}
                </div>
              )}

              <button
                className="btn-primary w-full py-3.5 mt-2 text-[15px]"
                onClick={handleSendOTP}
                disabled={loading}
              >
                {loading ? "Sending OTP..." : (
                  <>
                    Next <ArrowRight size={18} />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="label">Verification Code</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
                  <input
                    type="text"
                    placeholder="6-digit code"
                    value={otp}
                    className="pl-11 text-center tracking-[0.5em] font-bold text-lg"
                    maxLength={6}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleVerifyOTP();
                    }}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] font-medium animate-fade-in">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  className="btn-primary w-full py-3.5 text-[15px]"
                  onClick={handleVerifyOTP}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </button>
                
                <button
                  className="text-[13px] font-bold text-stone-500 hover:text-stone-900 transition-colors flex items-center justify-center gap-1.5"
                  onClick={() => setStep("input")}
                  disabled={loading}
                >
                  <RefreshCcw size={14} /> Back to Details
                </button>
              </div>
            </>
          )}
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
