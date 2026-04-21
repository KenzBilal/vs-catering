import { Share2, CheckCircle2, AlertCircle, PlayCircle } from "lucide-react";
import { generateWhatsAppMessage } from "../../../lib/helpers";
import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../lib/AuthContext";

export default function AdminSummary({ catering, registrations, dropCounts, handleCopyMessage, copied }) {
  const { token } = useAuth();
  const startVerification = useMutation(api.caterings.startVerification);
  const [loading, setLoading] = useState(false);

  const hasRegistrations = registrations && registrations.length > 0;
  const verifiedCount = registrations?.filter(r => r.verificationStatus === "verified").length || 0;
  const totalRegistered = registrations?.filter(r => r.status === "registered").length || 0;

  const handleStartVerification = async () => {
    if (!window.confirm("Start verification for all registered students? They will receive notifications to confirm their attendance.")) return;
    
    setLoading(true);
    try {
      await startVerification({ cateringId: catering._id, token });
      toast.success("Verification started");
    } catch (e) {
      toast.error(e.message || "Failed to start verification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Verification Section */}
      <div className="card mb-6 p-6 border-stone-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="section-title !mb-1 flex items-center gap-2">
              Verification Status
            </h3>
            <p className="text-[12.5px] font-medium text-stone-500">
              Confirm student availability 24-48h before the event.
            </p>
          </div>
          {catering.verificationStatus === "active" ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a5c3a]/10 text-[#1a5c3a] text-[11px] font-bold rounded-lg uppercase tracking-wider">
              <CheckCircle2 size={12} /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 text-stone-500 text-[11px] font-bold rounded-lg uppercase tracking-wider">
              <AlertCircle size={12} /> Not Started
            </span>
          )}
        </div>

        {catering.verificationStatus === "active" ? (
          <div className="space-y-4 mt-6">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[13px] font-bold text-stone-900">{verifiedCount} of {totalRegistered} Verified</span>
              <span className="text-[13px] font-bold text-[#1a5c3a]">{Math.round((verifiedCount / totalRegistered) * 100) || 0}%</span>
            </div>
            <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#1a5c3a] transition-all duration-500 ease-out"
                style={{ width: `${(verifiedCount / totalRegistered) * 100 || 0}%` }}
              />
            </div>
          </div>
        ) : (
          <button 
            onClick={handleStartVerification}
            disabled={loading || totalRegistered === 0}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-stone-900 hover:bg-stone-800 text-white text-[13.5px] font-bold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <PlayCircle size={18} /> {loading ? "Starting..." : "Start Verification Flow"}
          </button>
        )}
      </div>

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
