import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Phone, User, UtensilsCrossed, MapPin, Hash } from "lucide-react";
import SegmentedControl from "../components/ui/SegmentedControl";
import { isValidPhone, isValidRegNumber } from "../lib/helpers";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.phone.trim()) return setError("Phone number is required.");
    if (!isValidPhone(form.phone)) return setError("Enter a valid 10-digit number starting with 6, 7, 8, or 9.");
    if (form.registrationNumber.trim() && !isValidRegNumber(form.registrationNumber.trim())) {
      return setError("Enter a valid 8-digit registration number (e.g. 12345678).");
    }
    setLoading(true);
    try {
      const id = await createUser(form);
      login({ _id: id, ...form, role: "student", sessionToken: "TEMP_FOR_INIT" }); 
      // The actual secure token will be generated upon full login, but createUser just initializes them
      navigate("/");
    } catch (e) {
      // Extract clean error message from Convex error data or message
      const rawMsg = e.data || e.message || "";
      const msg = typeof rawMsg === "string" ? rawMsg : "Something went wrong.";
      
      if (msg.includes("ConvexError:")) {
        setError(msg.split("ConvexError:")[1].trim());
      } else if (msg.includes("Error:")) {
        setError(msg.split("Error:")[1].trim());
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream-bg">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-stone-900/20">
            <UtensilsCrossed className="text-cream-50" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Create Account</h1>
          <p className="text-[14.5px] text-stone-500 mt-1 font-medium">Join Catering</p>
        </div>

        <div className="card p-6 sm:p-8 flex flex-col gap-5">
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
              <input
                type="tel"
                placeholder="10-digit number"
                className="pl-11"
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

          <div>
            <label className="label mb-3">Gender</label>
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
            <label className="label mb-3">Accommodation</label>
            <SegmentedControl
              options={[
                { label: "Hostel", value: "hostel" },
                { label: "Day Scholar", value: "day_scholar" }
              ]}
              value={form.stayType}
              onChange={(val) => set("stayType", val)}
            />
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
            <p className="text-[12px] mt-1.5 font-medium text-stone-400 ml-1">
              Pickup is always from Main Gate. This is for drop-off.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] font-medium animate-fade-in">
              {error}
            </div>
          )}

          <button
            className="btn-primary w-full py-3.5 mt-2 text-[15px]"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Creating account..." : (
              <>
                <UserPlus size={18} /> Create Account
              </>
            )}
          </button>
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
