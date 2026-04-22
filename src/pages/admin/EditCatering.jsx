import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { getRoleLabel, formatTime12h } from "../../lib/helpers";
import { ArrowLeft, Save, Sun, Moon } from "lucide-react";
import Toggle from "../../components/ui/Toggle";
import SegmentedControl from "../../components/ui/SegmentedControl";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import toast from "react-hot-toast";

export default function EditCatering() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const cateringRaw = useQuery(api.caterings.getCatering, { cateringId: id, token });
  const { data: catering, timedOut } = useQueryWithTimeout(cateringRaw);
  const updateCatering = useMutation(api.caterings.updateCatering);

  const [place, setPlace] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("day");
  const [specificTime, setSpecificTime] = useState("");
  const [photoRequired, setPhotoRequired] = useState(false);
  const [dressCodeNotes, setDressCodeNotes] = useState("");
  const [slots, setSlots] = useState([]);
  const [limitSlots, setLimitSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Populate form when data loads
  useEffect(() => {
    if (catering && !initialized) {
      setPlace(catering.place);
      setTimeOfDay(catering.timeOfDay);
      setSpecificTime(catering.specificTime);
      setPhotoRequired(catering.photoRequired);
      setDressCodeNotes(catering.dressCodeNotes);
      setSlots(catering.slots);
      setLimitSlots(catering.limitSlots || false);
      setInitialized(true);
    }
  }, [catering, initialized]);

  const updateSlot = (index, key, value) => {
    setSlots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    setErrors({});
    let hasError = false;
    const newErrors = {};

    if (!place.trim()) { newErrors.place = "Place is required."; hasError = true; }
    if (!specificTime.trim()) { newErrors.specificTime = "Time is required."; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const finalSlots = slots.map(s => ({
      ...s,
      limit: Number(s.limit) || 0,
      pay: Number(s.pay) || 0
    }));

    // Ensure at least one slot has a limit > 0
    const totalSlots = finalSlots.reduce((sum, s) => sum + s.limit, 0);
    if (totalSlots === 0) {
      toast.error("At least one role must have more than 0 slots.");
      return;
    }

    setLoading(true);
    try {
      await updateCatering({
        cateringId: id,
        place: place.trim(),
        timeOfDay,
        specificTime,
        photoRequired,
        dressCodeNotes,
        limitSlots,
        slots: finalSlots,
        token,
      });
      setSaved(true);
      toast.success("Event updated successfully");
      setTimeout(() => {
        navigate(`/admin/events`);
      }, 1000);
    } catch (e) {
      const rawMsg = e.data || e.message || "";
      const msg = typeof rawMsg === "string" ? rawMsg : "Something went wrong.";
      
      // Clean up technical prefixes like [CONVEX M(caterings:updateCatering)]
      const cleanMsg = msg.replace(/^\[CONVEX [A-Z]\([^)]+\)\]\s*/, "");
      
      if (cleanMsg.includes("ConvexError:")) {
        toast.error(cleanMsg.split("ConvexError:")[1].trim());
      } else {
        toast.error(cleanMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (timedOut) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  if (catering === undefined) {
    return <div className="animate-pulse"><p className="text-stone-400">Loading event...</p></div>;
  }

  if (!catering) {
    return <p className="text-stone-500">Event not found.</p>;
  }

  if (catering.status === "cancelled" || catering.attendanceStarted) {
    return (
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="card bg-red-50 border-red-200 text-center py-10">
          <p className="font-semibold text-red-700">
            {catering.status === "cancelled" 
              ? "This event has been cancelled and cannot be edited."
              : "Attendance has already been started. This event is now locked for editing."}
          </p>
        </div>
      </div>
    );
  }


  return (
    <div style={{ maxWidth: 680 }}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Edit Event</h1>
        <p className="text-[14px] text-stone-500 font-medium mt-1">{catering.place}</p>
      </div>

      <div className="flex flex-col gap-5">
        {/* Venue & Timing */}
        <div className="card bg-white p-6">
          <h3 className="font-bold text-[15px] text-stone-800 mb-5">Venue & Timing</h3>
          <div className="flex flex-col gap-5">
            <div>
              <label className="label">Place / Venue</label>
              <input 
                type="text" 
                value={place} 
                onChange={(e) => { setPlace(e.target.value); if(errors.place) setErrors(e=>({...e, place:""})) }} 
                className={errors.place ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}
              />
              {errors.place && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.place}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Time of Day</label>
                <SegmentedControl
                  options={[
                    { label: "Day", value: "day", icon: Sun },
                    { label: "Night", value: "night", icon: Moon },
                  ]}
                  value={timeOfDay}
                  onChange={setTimeOfDay}
                />
              </div>
              <div>
                <label className="label">Event Time</label>
                <div className="flex flex-col gap-1.5">
                  <input 
                    type="time" 
                    value={specificTime} 
                    onChange={(e) => { setSpecificTime(e.target.value); if(errors.specificTime) setErrors(e=>({...e, specificTime:""})) }} 
                    className={errors.specificTime ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}
                  />
                  {errors.specificTime && <p className="text-[12.5px] text-red-600 font-medium ml-1">{errors.specificTime}</p>}
                  {specificTime && !errors.specificTime && (
                    <p className="text-[11px] font-bold text-[#1a5c3a] ml-1">
                      Preview: {formatTime12h(specificTime)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Roles & Pay */}
        <div className="card bg-white p-6">
          <h3 className="font-bold text-[15px] text-stone-800 mb-5">
            Roles & Pay
          </h3>
          
          <div className="mb-6 p-4 bg-stone-50 border border-cream-200 rounded-xl">
            <Toggle 
              label="Enable Slot Limits & Queue"
              description="If off, anyone can register and get confirmed. If on, people after the limit go to waitlist."
              checked={limitSlots}
              onChange={setLimitSlots}
            />
          </div>

          <SlotEditor slots={slots} updateSlot={updateSlot} />
        </div>

        {/* Requirements */}
        <div className="card bg-white p-6">
          <h3 className="font-bold text-[15px] text-stone-800 mb-5">Requirements</h3>
          <div className="flex flex-col gap-5">
            <div className="bg-cream-50 border border-cream-200 p-4 rounded-xl">
              <Toggle
                label="Student Photo Required"
                description="Students must upload a photo to register for this event."
                checked={photoRequired}
                onChange={setPhotoRequired}
              />
            </div>
            <div>
              <label className="label">Dress Code Instructions</label>
              <textarea
                value={dressCodeNotes}
                onChange={(e) => setDressCodeNotes(e.target.value)}
                rows={5}
                className="resize-y"
              />
            </div>
          </div>
        </div>



        <button
          className="btn-primary w-full py-4"
          onClick={handleSubmit}
          disabled={loading || saved}
        >
          {saved ? (
            <><Save size={18} /> Saved — Redirecting...</>
          ) : loading ? "Saving..." : (
            <><Save size={18} /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}

function SlotEditor({ slots, updateSlot }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_90px_100px] gap-3">
        <div />
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide text-center">Slots</p>
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide text-center">Pay (₹)</p>
      </div>
      {slots.map((s, index) => {
        return (
          <div key={s.role} className="grid grid-cols-[1fr_90px_100px] gap-3 items-center">
            <div className="px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-[14px] text-stone-700 font-medium">
              {getRoleLabel(s.role)}
            </div>
            <input
              type="number"
              value={s.limit || ""}
              min={0}
              onChange={(e) => updateSlot(index, "limit", e.target.value === "" ? "" : Number(e.target.value))}
            />
            <input
              type="number"
              value={s.pay || ""}
              min={0}
              onChange={(e) => updateSlot(index, "pay", e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        );
      })}
    </div>
  );
}
