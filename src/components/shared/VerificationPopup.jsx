import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useState } from "react";
import toast from "react-hot-toast";

export default function VerificationPopup() {
  const { token } = useAuth();
  const pending = useQuery(api.registrations.getPendingVerification, { token: token || "" });
  const verify = useMutation(api.registrations.verifyAttendance);
  const [loading, setLoading] = useState(false);

  if (!pending || !token) return null;

  const handleResponse = async (verified) => {
    setLoading(true);
    try {
      await verify({ registrationId: pending.registrationId, verified, token });
      toast.success(verified ? "Attendance Confirmed 👍" : "Withdrawn 👎");
    } catch (e) {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[32px] shadow-2xl p-8 max-w-[340px] w-full text-center animate-scale-up border border-cream-100">
        <h3 className="text-[20px] font-bold text-stone-900 mb-2 leading-tight">
          Still coming?
        </h3>
        <p className="text-[14px] font-medium text-stone-500 mb-8 px-2 leading-relaxed">
          The admin is arranging vehicles for <span className="text-stone-900 font-bold">{pending.cateringPlace}</span>.
        </p>

        <div className="flex gap-4">
          <button
            disabled={loading}
            onClick={() => handleResponse(true)}
            className="flex-1 aspect-square bg-cream-50 border-2 border-cream-100 rounded-[24px] flex items-center justify-center text-[40px] hover:scale-105 hover:bg-white hover:border-[#1a5c3a]/30 transition-all active:scale-95 disabled:opacity-50"
          >
            👍
          </button>
          <button
            disabled={loading}
            onClick={() => handleResponse(false)}
            className="flex-1 aspect-square bg-cream-50 border-2 border-cream-100 rounded-[24px] flex items-center justify-center text-[40px] hover:scale-105 hover:bg-white hover:border-red-100 transition-all active:scale-95 disabled:opacity-50"
          >
            👎
          </button>
        </div>

        <p className="mt-6 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
          Quick Verification
        </p>
      </div>
    </div>
  );
}
