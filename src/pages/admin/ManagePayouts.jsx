import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { ArrowLeft, IndianRupee, Save, Calendar, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ManagePayouts() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const payoutSettings = useQuery(api.notifications.getPayoutSettings, { token });
  const setPayout = useMutation(api.notifications.setPayoutSettings);

  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (payoutSettings) {
      setDate(payoutSettings.nextPayoutDate || "");
      setNote(payoutSettings.payoutNote || "");
    }
  }, [payoutSettings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setPayout({ token, payoutDate: date, note });
      toast.success("Payout settings updated.");
    } catch (err) {
      toast.error("Failed to update payout settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/settings")}
          className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Settings
        </button>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Payout Settings</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Configure the next expected payout date for all students.
        </p>
      </div>

      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 bg-stone-50 border-b border-cream-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl border border-cream-200 flex items-center justify-center">
              <IndianRupee size={20} className="text-stone-900" />
            </div>
            <div>
              <p className="text-[14px] font-bold text-stone-900">Current Setting</p>
              <p className="text-[12px] font-medium text-stone-500">
                {payoutSettings?.nextPayoutDate ? `Next payout: ${payoutSettings.nextPayoutDate}` : "No date set"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-stone-600 ml-1">Next Payout Date</label>
            <div className="relative">
              <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="e.g., 25th April 2024"
                className="input-base pl-12 h-13"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <p className="text-[11px] font-medium text-stone-400 ml-1">
              This date will appear in "Payment Pending" notifications.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-stone-600 ml-1">Payout Note (Optional)</label>
            <div className="relative">
              <Info size={18} className="absolute left-4 top-4 text-stone-400" />
              <textarea
                placeholder="Add a small note or instruction..."
                className="input-base pl-12 py-3 min-h-[100px] resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary w-full h-13 flex items-center justify-center gap-2 shadow-lg shadow-stone-900/10 active:scale-[0.98] disabled:opacity-50"
          >
            {isSaving ? "Saving..." : <><Save size={18} /> Save Settings</>}
          </button>
        </form>
      </div>

      <div className="mt-8 p-5 bg-stone-900 rounded-2xl text-cream-50">
        <h4 className="text-[14px] font-bold mb-2">How it works</h4>
        <p className="text-[12px] font-medium text-cream-200/70 leading-relaxed">
          When you mark attendance and create a pending payment for a student, the "Next Payout Date" 
          configured here is automatically included in their notification. 
          Updating this does not change old notifications, but will apply to all new ones.
        </p>
      </div>
    </div>
  );
}
