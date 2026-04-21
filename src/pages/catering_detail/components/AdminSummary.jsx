import { Share2, CheckCircle2, AlertCircle, PlayCircle } from "lucide-react";
import { generateWhatsAppMessage } from "../../../lib/helpers";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../lib/AuthContext";
import ConfirmModal from "../../../components/shared/ConfirmModal";

export default function AdminSummary({ catering, registrations, dropCounts, handleCopyMessage, copied }) {
  const { token } = useAuth();
  const startVerification = useMutation(api.caterings.startVerification);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasRegistrations = registrations && registrations.length > 0;
  const verifiedCount = registrations?.filter(r => r.verificationStatus === "verified").length || 0;
  const totalRegistered = registrations?.filter(r => r.status === "registered").length || 0;
  const attendanceStarted = registrations?.some(r => r.status !== "registered");

  const handleStartVerification = async () => {
    if (totalRegistered === 0) {
      toast.error("No students are registered for this event yet.");
      return;
    }
    setShowConfirm(true);
  };

  const onConfirm = async () => {
    const isReverify = catering.verificationStatus === "active";
    setLoading(true);
    try {
      await startVerification({ cateringId: catering._id, token });
      toast.success(isReverify ? "Re-verification started" : "Verification started");
    } catch (e) {
      toast.error(e.message || "Failed to start");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Verification Section */}
      {!attendanceStarted && (
        <div className="card mb-6 p-6 border-stone-200">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="section-title !mb-1">Event Verification</h3>
              <p className="text-[12.5px] font-medium text-stone-500">
                {catering.verificationStatus === "active" ? "Verification is currently active." : "Send popups to confirm attendance."}
              </p>
            </div>
            <button 
              onClick={handleStartVerification}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all active:scale-95 disabled:opacity-50 ${
                catering.verificationStatus === "active" 
                  ? "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50" 
                  : "bg-stone-900 text-white hover:bg-stone-800"
              }`}
            >
              <PlayCircle size={16} /> 
              {loading ? "Processing..." : (catering.verificationStatus === "active" ? "Re-verify" : "Start Verify")}
            </button>
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cream-50/50 border border-cream-100 rounded-[20px] p-4 text-center">
              <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Registered</p>
              <p className="text-[24px] font-black text-stone-900">{totalRegistered}</p>
            </div>
            <div className="bg-[#e8f5ee]/50 border border-[#1a5c3a]/10 rounded-[20px] p-4 text-center">
              <p className="text-[11px] font-bold text-[#1a5c3a] uppercase tracking-wider mb-1">Verified</p>
              <p className="text-[24px] font-black text-[#1a5c3a]">{verifiedCount}</p>
            </div>
          </div>
        </div>
      )}


      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={onConfirm}
        title={catering.verificationStatus === "active" ? "Re-verify Attendance" : "Start Verification"}
        message={catering.verificationStatus === "active" 
          ? "This will reset all current responses and send the verification popup to everyone again. Proceed?"
          : "Every registered student will receive a popup notification to confirm their attendance. Proceed?"
        }
        variant="primary"
        confirmText="Yes, Proceed"
      />


      {hasRegistrations && (


        <div className="card mb-6 p-6">
          <h3 className="section-title">Drop Point Summary</h3>
          <div className="flex flex-col gap-2 mt-4">
            {Object.entries(dropCounts).map(([point, count]) => (
              <div key={point} className="flex justify-between items-center text-[14.5px] py-2 border-b border-cream-100 last:border-0">
                <span className="text-stone-600 font-medium">{point}</span>
                <span className="font-bold text-stone-900 bg-cream-100 px-2 py-0.5 rounded-md">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      <div className="card mb-6 p-6 border-stone-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title !mb-0 flex items-center gap-2">
            <Share2 size={18} className="text-stone-400" /> Share on WhatsApp
          </h3>
          <button className="btn-secondary py-1.5 px-3 text-[12px]" onClick={handleCopyMessage}>
            {copied ? <span className="text-[#1a5c3a] font-bold">Copied!</span> : "Copy"}
          </button>
        </div>
        <div className="bg-cream-50 border border-cream-200 rounded-xl p-4 text-[13px] text-stone-600 whitespace-pre-wrap font-mono leading-relaxed max-h-[200px] overflow-y-auto">
          {generateWhatsAppMessage(catering, `${window.location.origin}/catering/${catering._id}`)}
        </div>
      </div>
    </>
  );
}
