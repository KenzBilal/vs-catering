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
  const [isTwoDay, setIsTwoDay] = useState(false);
  const [dates, setDates] = useState(["", ""]);
  const [joinRule, setJoinRule] = useState("any_day");
  const [photoRequired, setPhotoRequired] = useState(false);
  const [dressCodeNotes, setDressCodeNotes] = useState(DEFAULT_DRESS_CODE);
  const [sameSlotsForBothDays, setSameSlotsForBothDays] = useState(true);
  const [limitSlots, setLimitSlots] = useState(false);

  // Slots: { role, day, limit, pay }
  const [slots, setSlots] = useState([
    { role: "service_boy", day: 0, limit: 30, pay: 0 },
    { role: "service_girl", day: 0, limit: 10, pay: 0 },
    { role: "captain_male", day: 0, limit: 10, pay: 0 },
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

  const day0Slots = slots.filter((s) => s.day === 0);

  const buildFinalSlots = () => {
    if (!isTwoDay) return slots.filter((s) => s.day === 0);
    if (sameSlotsForBothDays) {
      const day1 = day0Slots.map((s) => ({ ...s, day: 1 }));
      return [...day0Slots, ...day1];
    }
    return slots;
  };

  const ensureDay1Slots = () => {
    const day1Exists = slots.some((s) => s.day === 1);
    if (!day1Exists) {
      const day1 = day0Slots.map((s) => ({ ...s, day: 1 }));
      setSlots((prev) => [...prev, ...day1]);
    }
  };

  const handleTwoDayToggle = (val) => {
    setIsTwoDay(val);
    if (val) ensureDay1Slots();
  };

  const handleSubmit = async () => {
    setErrors({});
    let hasError = false;
    const newErrors = {};

    if (!place.trim()) { newErrors.place = "Place is required."; hasError = true; }
    if (!specificTime.trim()) { newErrors.specificTime = "Time is required."; hasError = true; }
    if (!dates[0]) { newErrors.date1 = "Date is required."; hasError = true; }
    if (isTwoDay && !dates[1]) { newErrors.date2 = "Second date is required for a two-day event."; hasError = true; }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    const finalDates = (isTwoDay ? dates : [dates[0]]).map(d => 
      d instanceof Date ? d.toISOString() : d
    );
    const rawSlots = buildFinalSlots();
    const finalSlots = rawSlots.map(s => ({
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
        dates: finalDates,
        isTwoDay,
        sameSlotsForBothDays,
        joinRule: isTwoDay ? joinRule : "any_day",
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
              <label className="label mb-3">Duration</label>
              <SegmentedControl
                options={[
                  { label: "One Day Event", value: false },
                  { label: "Two Day Event", value: true, icon: CalendarRange }
                ]}
                value={isTwoDay}
                onChange={handleTwoDayToggle}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">{isTwoDay ? "Day 1 Date" : "Date"}</label>
                <input 
                  type="date" 
                  value={dates[0]} 
                  onChange={(e) => { setDates([e.target.value, dates[1]]); if(errors.date1) setErrors(e=>({...e, date1:""})) }} 
                  className={errors.date1 ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}
                />
                {errors.date1 && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.date1}</p>}
              </div>
              {isTwoDay && (
                <div>
                  <label className="label">Day 2 Date</label>
                  <input 
                    type="date" 
                    value={dates[1]} 
                    onChange={(e) => { setDates([dates[0], e.target.value]); if(errors.date2) setErrors(e=>({...e, date2:""})) }} 
                    className={errors.date2 ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : ''}
                  />
                  {errors.date2 && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.date2}</p>}
                </div>
              )}
            </div>

            {isTwoDay && (
              <div className="pt-2">
                <label className="label mb-3">Student Joining Rule</label>
                <SegmentedControl
                  options={[
                    { label: "Can join either day", value: "any_day" },
                    { label: "Must attend both days", value: "both_days" }
                  ]}
                  value={joinRule}
                  onChange={setJoinRule}
                />
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Roles and Pay */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <h3 className="font-semibold text-stone-800 text-[16px]">{isTwoDay ? "Roles & Pay (Day 1)" : "Roles & Pay"}</h3>
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
            {day0Slots.map((s, i) => (
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

          {isTwoDay && (
            <div className="mt-8 pt-6 border-t border-cream-200">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-stone-800 text-[16px]">Roles & Pay (Day 2)</h3>
                <div className="w-48">
                  <Toggle
                    label="Same as Day 1"
                    checked={sameSlotsForBothDays}
                    onChange={setSameSlotsForBothDays}
                  />
                </div>
              </div>
              {!sameSlotsForBothDays && (
                <div className="flex flex-col gap-3 animate-fade-in">
                  <div className="grid grid-cols-[1fr_90px_100px] sm:grid-cols-[1fr_120px_120px] gap-3">
                    <div />
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide text-center">Slots</p>
                    <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wide text-center">Pay (₹)</p>
                  </div>
                  {slots.filter((s) => s.day === 1).map((s, i) => {
                    const realIndex = slots.findIndex((sl) => sl.day === 1 && sl.role === s.role);
                    return (
                      <div key={i} className="grid grid-cols-[1fr_90px_100px] sm:grid-cols-[1fr_120px_120px] gap-3 items-center">
                        <div className="px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl text-[14px] text-stone-700 font-medium">
                          {getRoleLabel(s.role)}
                        </div>
                        <input type="number" placeholder="0" value={s.limit || ""} onChange={(e) => updateSlot(realIndex, "limit", e.target.value === "" ? "" : Number(e.target.value))} min={0} />
                        <input type="number" placeholder="0" value={s.pay || ""} onChange={(e) => updateSlot(realIndex, "pay", e.target.value === "" ? "" : Number(e.target.value))} min={0} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
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
