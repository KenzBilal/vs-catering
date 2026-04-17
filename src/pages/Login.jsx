import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Phone, User, UtensilsCrossed } from "lucide-react";
import { isValidPhone } from "../lib/helpers";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");

  const loginUser = useMutation(api.users.loginUser);

  const handleSubmit = async () => {
    setError("");
    if (!phone.trim()) return setError("Phone number is required.");
    if (!isValidPhone(phone)) return setError("Enter a valid 10-digit number starting with 6, 7, 8, or 9.");
    if (!name.trim()) return setError("Enter your name.");
    setTried(true);
    try {
      const result = await loginUser({ phone, name });
      if (result === null) {
        setTried(false);
        setError("No account found with this name and phone number.");
      } else {
        login(result);
        navigate("/");
      }
    } catch (e) {
      setTried(false);
      setError("An error occurred during login.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream-bg">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-stone-900/20">
            <UtensilsCrossed className="text-cream-50" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Welcome Back</h1>
          <p className="text-[14.5px] text-stone-500 mt-1 font-medium">Sign in to your account</p>
        </div>

        <div className="card p-6 sm:p-8 flex flex-col gap-5">
          <div>
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="tel"
                placeholder="10-digit number"
                value={phone}
                className="pl-11"
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          </div>

          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="text"
                placeholder="Your name as registered"
                value={name}
                className="pl-11"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] font-medium animate-fade-in">
              {error}
            </div>
          )}

          <button
            className="btn-primary w-full py-3.5 mt-2 text-[15px]"
            onClick={handleSubmit}
            disabled={tried}
          >
            {tried ? "Signing in..." : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </div>

        <p className="text-[14px] text-center mt-6 font-medium text-stone-500">
          Don't have an account?{" "}
          <Link to="/signup" className="text-stone-900 font-bold hover:underline underline-offset-4 decoration-2 decoration-cream-300">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
