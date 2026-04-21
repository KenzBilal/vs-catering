import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getRoleLabel } from "../../../lib/helpers";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import toast from "react-hot-toast";

export default function RegistrationStatus({ myReg, catering, isSuperAdmin, navigate, id, token }) {
  const cancelReg = useMutation(api.registrations.cancelRegistration);
  const [cancelling, setCancelling] = useState(false);

  if (isSuperAdmin || catering.status === "ended") return null;



  const handleCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;
    setCancelling(true);
    try {
      await cancelReg({ registrationId: myReg._id, token });
      toast.success("Registration cancelled.");
    } catch (e) {
      toast.error(e.message || "Failed to cancel registration.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="mt-8 mb-4">
      {myReg ? (
        <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[#e8f5ee] flex items-center justify-center text-[#1a5c3a] mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-1 text-center">You are registered</h3>
          <p className="text-[14px] text-stone-500 font-medium text-center mb-6">
            {getRoleLabel(myReg.role)} <span className="mx-1.5">•</span> 
            {myReg.isConfirmed ? "Confirmed" : "Waitlisted"} <span className="mx-1.5">•</span> 
            Drop: {myReg.dropPoint}
          </p>

          {myReg.status === "registered" && (
            <button 
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 text-[13px] font-bold text-red-600 hover:text-red-700 hover:underline transition-all"
            >
              {cancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
              Cancel Registration
            </button>
          )}
        </div>
      ) : (
        <button className="btn-primary w-full py-4 text-[16px]" onClick={() => navigate(`/catering/${id}/register`)}>
          Register for Event
        </button>
      )}
    </div>
  );
}

