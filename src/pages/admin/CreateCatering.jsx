import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { getRoleLabel, formatTime12h } from "../../lib/helpers";
import { ArrowLeft, Clock, MapPin, Calendar, Users, Shirt, Camera, Moon, Sun, CalendarRange, CheckCircle2 } from "lucide-react";
import Toggle from "../../components/ui/Toggle";
import SegmentedControl from "../../components/ui/SegmentedControl";
import toast from "react-hot-toast";

const DEFAULT_DRESS_CODE = `Service Boy: Black formal pants, formal shoes, clean shave. Short or long hair is acceptable.
Service Girl: Black formal pants or skirt, formal shoes.
Captain: Black blazer, tie, white shirt, black formal pants, formal shoes, clean shave. Short or long hair is acceptable.`;

export default function CreateCatering() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const createCatering = useMutation(api.caterings.createCatering);

  const [place, setPlace] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("day");
  const [specificTime, setSpecificTime] = useState("");
  const [date, setDate] = useState("");
  const [photoRequired, setPhotoRequired] = useState(false);
  const [dressCodeNotes, setDressCodeNotes] = useState(DEFAULT_DRESS_CODE);
  const [limitSlots, setLimitSlots] = useState(false);

  // Slots: { role, limit, pay }
  const [slots, setSlots] = useState([
    { role: "service_boy", limit: 30, pay: 0 },
    { role: "service_girl", limit: 10, pay: 0 },
    { role: "captain_male", limit: 10, pay: 0 },
    { role: "captain_female", limit: 0, pay: 0 },
  ]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateSlot = (index, key, value) => {
    setSlots((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!user || !user._id) {
      toast.error("User session not loaded. Please try again.");
      return;
    }

    setErrors({});
    let hasError = false;
    const newErrors = {};

    if (!place.trim()) { newErrors.place = "Place is required."; hasError = true; }
    if (!specificTime.trim()) { newErrors.specificTime = "Time is required."; hasError = true; }
    if (!date) { newErrors.date = "Date is required."; hasError = true; }

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
      const id = await createCatering({
        title: place,
        place,
        timeOfDay,
        specificTime,
        date,
        photoRequired,
        dressCodeNotes,
        limitSlots,
        slots: finalSlots,
        createdBy: user._id,
        token,
      });
      toast.success("Event created successfully");
      navigate(`/catering/${id}`);
    } catch (e) {
      const rawMsg = e.data || e.message || "";
      const msg = typeof rawMsg === "string" ? rawMsg : "Something went wrong.";
      
      // Clean up technical prefixes like [CONVEX M(caterings:createCatering)]
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

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h2 className="text-2xl font-bold mb-8 text-stone-900 tracking-tight">Create Event</h2>

      <div className="flex flex-col gap-6">
        {/* Card 1: Venue & Timing */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="text-stone-400" size={18} />
            <h3 className="font-semibold text-stone-800 text-[16px]">Venue & Timing</h3>
          </div>
          <div className="flex flex-col gap-5">
            <div>
              <label className="label">Place / Venue</label>
              <input 
                type="text" 
                placeholder="e.g. Ludhiana Convention Centre" 
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
                    { label: "Night", value: "night", icon: Moon }
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
                    <p className="text-[11px] font-bold text-[#1a5c3a] ml-1 flex items-center gap-1">
                      <Clock size={10} /> Preview: {formatTime12h(specificTime)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Schedule */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Calendar className="text-stone-400" size={18} />
            <h3 className="font-semibold text-stone-800 text-[16px]">Schedule</h3>
          </div>
          <div className="flex flex-col gap-5">
            <div>
              <label className="label">Date</label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => { setDate(e.target.value); if(errors.date) setErrors(e=>({...e, date:""})) }} 
                className={errors.date ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}
              />
              {errors.date && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.date}</p>}
            </div>
          </div>
        </div>

        {/* Card 3: Roles and Pay */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="font-semibold text-stone-800 text-[16px]">Roles & Pay</h3>
          </div>
          
          <div className="mb-6 p-4 bg-stone-50 border border-cream-200 rounded-xl">
            <Toggle 
              label="Enable Slot Limits & Queue"
              description="If off, anyone can register and get confirmed. If on, people after the limit go to waitlist."
              checked={limitSlots}
              onChange={setLimitSlots}
            />
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[1fr_90px_100px] sm:grid-cols-[1fr_120px_120px] gap-3">
              <div />
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide text-center">Slots</p>
              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide text-center">Pay (₹)</p>
            </div>
            {slots.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_90px_100px] sm:grid-cols-[1fr_120px_120px] gap-3 items-center">
                <div className="px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-[14px] text-stone-700 font-medium">
                  {getRoleLabel(s.role)}
                </div>
                <input
                  type="number"
                  placeholder="0"
                  value={s.limit || ""}
                  onChange={(e) => updateSlot(i, "limit", e.target.value === "" ? "" : Number(e.target.value))}
                  min={0}
                />
                <input
                  type="number"
                  placeholder="0"
                  value={s.pay || ""}
                  onChange={(e) => updateSlot(i, "pay", e.target.value === "" ? "" : Number(e.target.value))}
                  min={0}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Requirements */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Shirt className="text-stone-400" size={18} />
            <h3 className="font-semibold text-stone-800 text-[16px]">Requirements</h3>
          </div>
          <div className="flex flex-col gap-6">
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


        <button className="btn-primary w-full py-4 mt-2" onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating Event..." : (
            <>
              <CheckCircle2 size={18} />
              Publish Event
            </>
          )}
        </button>
      </div>
    </div>
  );
}
