import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { ArrowLeft, IndianRupee, Save, Calendar, Search, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "../../lib/helpers";
import LoadingState from "../../components/shared/LoadingState";
import EmptyState from "../../components/shared/EmptyState";
import toast from "react-hot-toast";

export default function ManagePayouts() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const finishedEvents = useQuery(api.caterings.getFinishedCaterings, { token });
  const setEventPayout = useMutation(api.caterings.setEventPayout);

  const [search, setSearch] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [payoutDate, setPayoutDate] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredEvents = (finishedEvents || []).filter(e => 
    e.place.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenUpdate = (event) => {
    setSelectedEvent(event);
    setPayoutDate(event.payoutDate || "");
    setPayoutNote(event.payoutNote || "");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    setIsSaving(true);
    try {
      await setEventPayout({
        token,
        cateringId: selectedEvent._id,
        payoutDate,
        payoutNote
      });
      toast.success("Payout updated for " + selectedEvent.place);
      setSelectedEvent(null);
    } catch (err) {
      toast.error("Failed to update payout.");
    } finally {
      setIsSaving(false);
    }
  };

  if (finishedEvents === undefined) return <div className="max-w-3xl mx-auto py-8 px-4"><LoadingState rows={5} /></div>;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 pb-24">
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/settings")}
          className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Settings
        </button>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Event Payouts</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Manage and schedule payment dates for finished catering events.
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
        <input
          type="text"
          placeholder="Search by venue..."
          className="input-base pl-12 h-12"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {finishedEvents.length === 0 ? (
        <EmptyState 
          icon={Clock} 
          title="No finished events" 
          description="Events will appear here once they have ended."
        />
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              onClick={() => handleOpenUpdate(event)}
              className="group bg-white border border-cream-200 rounded-2xl p-5 hover:border-stone-400 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${event.payoutDate ? 'bg-green-50 border-green-100 text-green-600' : 'bg-orange-50 border-orange-100 text-orange-600'}`}>
                    {event.payoutDate ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-[16px] text-stone-900 truncate">{event.place}</h3>
                    <p className="text-[12px] font-medium text-stone-400">
                      {formatDate(event.dates[0])} {event.isTwoDay ? `– ${formatDate(event.dates[1])}` : ""}
                    </p>
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  {event.payoutDate ? (
                    <div className="bg-stone-900 text-cream-50 text-[10px] font-bold px-2 py-1 rounded-lg">
                      PAID: {event.payoutDate}
                    </div>
                  ) : (
                    <div className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                      Pending Date
                    </div>
                  )}
                  <ChevronRight size={18} className="text-stone-300 ml-auto mt-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Update Modal Overlay */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-scale-in">
            <div className="p-6 border-b border-cream-200 flex items-center justify-between bg-stone-50">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Set Payout Info</h3>
                <p className="text-[13px] font-medium text-stone-500">{selectedEvent.place}</p>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="w-10 h-10 rounded-full hover:bg-white border border-transparent hover:border-cream-200 flex items-center justify-center transition-all"
              >
                <ArrowLeft size={18} className="text-stone-400" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-stone-600 ml-1">Payout Date</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="e.g., 25th April"
                    className="input-base pl-12 h-12"
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-stone-600 ml-1">Special Note</label>
                <textarea
                  placeholder="Optional note for students..."
                  className="input-base p-4 min-h-[100px] resize-none"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEvent(null)}
                  className="flex-1 h-12 rounded-xl text-[14px] font-bold text-stone-500 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !payoutDate}
                  className="flex-[2] h-12 bg-stone-900 text-cream-50 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 hover:bg-stone-800 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "Updating..." : <><Save size={18} /> Update Payout</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
