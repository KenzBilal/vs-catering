import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { getRoleLabel } from "../../lib/helpers";
import { ArrowLeft, Save, Sun, Moon } from "lucide-react";
import Toggle from "../../components/ui/Toggle";
import SegmentedControl from "../../components/ui/SegmentedControl";

export default function EditCatering() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const catering = useQuery(api.caterings.getCatering, { cateringId: id });
  const updateCatering = useMutation(api.caterings.updateCatering);

  const [place, setPlace] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("day");
  const [specificTime, setSpecificTime] = useState("");
  const [photoRequired, setPhotoRequired] = useState(false);
  const [dressCodeNotes, setDressCodeNotes] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
    setError("");
    if (!place.trim()) return setError("Place is required.");
    if (!specificTime.trim()) return setError("Time is required.");

    setLoading(true);
    try {
      await updateCatering({
        cateringId: id,
        place: place.trim(),
        timeOfDay,
        specificTime,
        photoRequired,
        dressCodeNotes,
        slots,
        token,
      });
      setSaved(true);
      setTimeout(() => {
        navigate(`/admin/events`);
      }, 1000);
    } catch (e) {
      setError(e.message || "Failed to save changes.");
    } finally {
      setLoading(false);
    }
  };

  if (catering === undefined) {
    return <div className="animate-pulse"><p className="text-stone-400">Loading event...</p></div>;
  }

  if (!catering) {
    return <p className="text-stone-500">Event not found.</p>;
  }

  if (catering.status === "cancelled") {
    return (
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="card bg-red-50 border-red-200 text-center py-10">
          <p className="font-semibold text-red-700">This event has been cancelled and cannot be edited.</p>
        </div>
      </div>
    );
  }

  const day0Slots = slots.filter((s) => s.day === 0);
  const day1Slots = slots.filter((s) => s.day === 1);

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
              <input type="text" value={place} onChange={(e) => setPlace(e.target.value)} />
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
                <input type="time" value={specificTime} onChange={(e) => setSpecificTime(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Roles & Pay */}
        <div className="card bg-white p-6">
          <h3 className="font-bold text-[15px] text-stone-800 mb-5">
            {catering.isTwoDay ? "Roles & Pay (Day 1)" : "Roles & Pay"}
          </h3>
          <SlotEditor slots={day0Slots} allSlots={slots} updateSlot={updateSlot} />

          {catering.isTwoDay && day1Slots.length > 0 && (
            <>
              <h3 className="font-bold text-[15px] text-stone-800 mt-8 mb-5 pt-6 border-t border-cream-100">
                Roles & Pay (Day 2)
              </h3>
              <SlotEditor slots={day1Slots} allSlots={slots} updateSlot={updateSlot} isDay1 />
            </>
          )}
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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] font-medium animate-fade-in">
            {error}
          </div>
        )}

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

function SlotEditor({ slots, allSlots, updateSlot, isDay1 = false }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-[1fr_90px_100px] gap-3">
        <div />
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide text-center">Slots</p>
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide text-center">Pay (₹)</p>
      </div>
      {slots.map((s) => {
        const realIndex = allSlots.findIndex(
          (sl) => sl.role === s.role && sl.day === s.day
        );
        return (
          <div key={s.role} className="grid grid-cols-[1fr_90px_100px] gap-3 items-center">
            <div className="px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-[14px] text-stone-700 font-medium">
              {getRoleLabel(s.role)}
            </div>
            <input
              type="number"
              value={s.limit || ""}
              min={1}
              onChange={(e) => updateSlot(realIndex, "limit", e.target.value === "" ? "" : Number(e.target.value))}
            />
            <input
              type="number"
              value={s.pay || ""}
              min={0}
              onChange={(e) => updateSlot(realIndex, "pay", e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
        );
      })}
    </div>
  );
}
