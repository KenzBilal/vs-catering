import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { getRoleLabel } from "../../../lib/helpers";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "../../../components/shared/ConfirmModal";

export default function RegistrationStatus({ myReg, catering, isSuperAdmin, navigate, id, token }) {
  const cancelReg = useMutation(api.registrations.cancelRegistration);
  const verifyAttendance = useMutation(api.registrations.verifyAttendance);
  const [cancelling, setCancelling] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (isSuperAdmin || catering.status === "ended") return null;

  const handleCancel = async () => {
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

  const handleVerify = async (verified) => {
    setVerifying(true);
    try {
      await verifyAttendance({ registrationId: myReg._id, verified, token });
      toast.success(verified ? "Attendance Confirmed" : "Registration Withdrawn");
    } catch (e) {
      toast.error(e.message || "Failed to verify attendance");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="mt-8 mb-4">
      {myReg ? (
        <div className="space-y-4">
          {/* Verification Banner */}
          {catering.verificationStatus === "active" && myReg.verificationStatus === "pending" && (
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-xl animate-scale-up">
              <h4 className="text-[15px] font-bold text-white mb-1">Confirm your attendance</h4>
              <p className="text-[13px] text-stone-400 font-medium mb-4 leading-relaxed">
                The admin is finalizing the list for {catering.place}. Please confirm if you are still coming.
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleVerify(true)}
                  disabled={verifying}
                  className="flex-1 py-2.5 bg-[#1a5c3a] hover:bg-[#144a2e] text-white text-[13px] font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {verifying ? "..." : "I'm Coming"}
                </button>
                <button 
                  onClick={() => handleVerify(false)}
                  disabled={verifying}
                  className="flex-1 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[13px] font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  Withdraw
                </button>
              </div>
            </div>
          )}

          <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-[#e8f5ee] flex items-center justify-center text-[#1a5c3a] mb-4">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-1 text-center">You are registered</h3>
            <div className="flex flex-col items-center gap-1.5 mb-6">
              <p className="text-[14px] text-stone-500 font-medium text-center">
                {getRoleLabel(myReg.role)} <span className="mx-1.5">•</span> 
                {myReg.isConfirmed ? "Confirmed" : "Waitlisted"} <span className="mx-1.5">•</span> 
                Drop: {myReg.dropPoint}
              </p>
              {myReg.verificationStatus === "verified" && (
                <span className="text-[11px] font-bold text-[#1a5c3a] bg-[#e8f5ee] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  ✓ Verified Attendance
                </span>
              )}
            </div>

            {myReg.status === "registered" && (
              <button 
                onClick={() => setShowCancelConfirm(true)}
                disabled={cancelling}
                className="flex items-center gap-2 text-[13px] font-bold text-red-600 hover:text-red-700 hover:underline transition-all"
              >
                {cancelling ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Cancel Registration
              </button>
            )}
          </div>
        </div>
      ) : (
        <button className="btn-primary w-full py-4 text-[16px]" onClick={() => navigate(`/catering/${id}/register`)}>
          Register for Event
        </button>
      )}

      <ConfirmModal 
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Cancel Registration?"
        message="Are you sure you want to cancel your registration? This action cannot be undone."
        variant="danger"
        confirmText="Yes, Cancel"
      />
    </div>
  );
}



