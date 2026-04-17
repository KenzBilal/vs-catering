import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { DRESS_CODE_DEFAULTS, getRoleLabel } from "../../lib/helpers";

const ALL_ROLES = ["service_boy", "service_girl", "captain_male"];

const DEFAULT_DRESS_CODE = `Service Boy: Black formal pants, formal shoes, clean shave. Short or long hair is acceptable.
Service Girl: Black formal pants or skirt, formal shoes.
Captain: Black blazer, tie, white shirt, black formal pants, formal shoes, clean shave. Short or long hair is acceptable.`;

export default function CreateCatering() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const createCatering = useMutation(api.caterings.createCatering);

  const [place, setPlace] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("evening");
  const [specificTime, setSpecificTime] = useState("");
  const [isTwoDay, setIsTwoDay] = useState(false);
  const [dates, setDates] = useState(["", ""]);
  const [joinRule, setJoinRule] = useState("any_day");
  const [photoRequired, setPhotoRequired] = useState(false);
  const [dressCodeNotes, setDressCodeNotes] = useState(DEFAULT_DRESS_CODE);
  const [sameSlotsForBothDays, setSameSlotsForBothDays] = useState(true);

  // Slots: { role, day, limit, pay }
  const [slots, setSlots] = useState([
    { role: "service_boy", day: 0, limit: 30, pay: 0 },
    { role: "service_girl", day: 0, limit: 10, pay: 0 },
    { role: "captain_male", day: 0, limit: 10, pay: 0 },
  ]);

  const [error, setError] = useState("");
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
    setError("");
    if (!place.trim()) return setError("Place is required.");
    if (!specificTime.trim()) return setError("Time is required.");
    if (!dates[0]) return setError("Date is required.");
    if (isTwoDay && !dates[1]) return setError("Second date is required for a two-day catering.");

    const finalDates = isTwoDay ? dates : [dates[0]];
    const finalSlots = buildFinalSlots();

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
        slots: finalSlots,
        createdBy: user._id,
        token,
      });
      navigate(`/catering/${id}`);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16 }}
      >
        ← Back
      </button>

      <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
        New Catering
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

        {/* Place */}
        <div>
          <label className="label">Place / Venue</label>
          <input type="text" placeholder="e.g. Ludhiana Convention Centre" value={place} onChange={(e) => setPlace(e.target.value)} />
        </div>

        {/* Time */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="label">Time of Day</label>
            <select value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)}>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </div>
          <div>
            <label className="label">Specific Time</label>
            <input type="time" value={specificTime} onChange={(e) => setSpecificTime(e.target.value)} />
          </div>
        </div>

        {/* Two day toggle */}
        <div>
          <label className="label">Duration</label>
          <div style={{ display: "flex", gap: 10 }}>
            {[false, true].map((val) => (
              <button
                key={String(val)}
                onClick={() => handleTwoDayToggle(val)}
                style={{
                  flex: 1, padding: "10px", borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: `1px solid ${isTwoDay === val ? "var(--accent)" : "var(--cream-border)"}`,
                  background: isTwoDay === val ? "var(--accent)" : "var(--cream-card)",
                  color: isTwoDay === val ? "var(--cream-50)" : "var(--text-primary)",
                }}
              >
                {val ? "Two Days" : "One Day"}
              </button>
            ))}
          </div>
        </div>

        {/* Dates */}
        <div style={{ display: "grid", gridTemplateColumns: isTwoDay ? "1fr 1fr" : "1fr", gap: 10 }}>
          <div>
            <label className="label">{isTwoDay ? "Day 1 Date" : "Date"}</label>
            <input type="date" value={dates[0]} onChange={(e) => setDates([e.target.value, dates[1]])} />
          </div>
          {isTwoDay && (
            <div>
              <label className="label">Day 2 Date</label>
              <input type="date" value={dates[1]} onChange={(e) => setDates([dates[0], e.target.value])} />
            </div>
          )}
        </div>

        {/* Join rule — two day only */}
        {isTwoDay && (
          <div>
            <label className="label">Joining Rule</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[["any_day", "Can join either day"], ["both_days", "Must attend both days"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setJoinRule(val)}
                  style={{
                    flex: 1, padding: "10px", borderRadius: 6, fontSize: 13, fontWeight: 500,
                    border: `1px solid ${joinRule === val ? "var(--accent)" : "var(--cream-border)"}`,
                    background: joinRule === val ? "var(--accent)" : "var(--cream-card)",
                    color: joinRule === val ? "var(--cream-50)" : "var(--text-primary)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Slots — Day 1 */}
        <div>
          <label className="label">{isTwoDay ? "Roles and Pay — Day 1" : "Roles and Pay"}</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {day0Slots.map((s, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", gap: 8, alignItems: "center" }}>
                <div style={{ padding: "10px 12px", background: "var(--cream-bg)", border: "1px solid var(--cream-border)", borderRadius: 6, fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                  {getRoleLabel(s.role)}
                </div>
                <input
                  type="number"
                  placeholder="Slots"
                  value={s.limit}
                  onChange={(e) => updateSlot(i, "limit", Number(e.target.value))}
                  min={1}
                />
                <input
                  type="number"
                  placeholder="Pay ₹"
                  value={s.pay}
                  onChange={(e) => updateSlot(i, "pay", Number(e.target.value))}
                  min={0}
                />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", gap: 8 }}>
              <div />
              <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>Slots</p>
              <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>Pay (₹)</p>
            </div>
          </div>
        </div>

        {/* Slots Day 2 */}
        {isTwoDay && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label className="label" style={{ marginBottom: 0 }}>Roles and Pay — Day 2</label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-muted)", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={sameSlotsForBothDays}
                  onChange={(e) => setSameSlotsForBothDays(e.target.checked)}
                  style={{ width: "auto" }}
                />
                Same as Day 1
              </label>
            </div>
            {!sameSlotsForBothDays && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {slots.filter((s) => s.day === 1).map((s, i) => {
                  const realIndex = slots.findIndex((sl) => sl.day === 1 && sl.role === s.role);
                  return (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px", gap: 8, alignItems: "center" }}>
                      <div style={{ padding: "10px 12px", background: "var(--cream-bg)", border: "1px solid var(--cream-border)", borderRadius: 6, fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>
                        {getRoleLabel(s.role)}
                      </div>
                      <input type="number" placeholder="Slots" value={s.limit} onChange={(e) => updateSlot(realIndex, "limit", Number(e.target.value))} min={1} />
                      <input type="number" placeholder="Pay ₹" value={s.pay} onChange={(e) => updateSlot(realIndex, "pay", Number(e.target.value))} min={0} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Photo required */}
        <div>
          <label className="label">Photo Required from Students</label>
          <div style={{ display: "flex", gap: 10 }}>
            {[[false, "No"], [true, "Yes"]].map(([val, label]) => (
              <button
                key={String(val)}
                onClick={() => setPhotoRequired(val)}
                style={{
                  flex: 1, padding: "10px", borderRadius: 6, fontSize: 14, fontWeight: 500,
                  border: `1px solid ${photoRequired === val ? "var(--accent)" : "var(--cream-border)"}`,
                  background: photoRequired === val ? "var(--accent)" : "var(--cream-card)",
                  color: photoRequired === val ? "var(--cream-50)" : "var(--text-primary)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Dress code */}
        <div>
          <label className="label">Dress Code Instructions</label>
          <textarea
            value={dressCodeNotes}
            onChange={(e) => setDressCodeNotes(e.target.value)}
            rows={5}
            style={{ resize: "vertical" }}
          />
        </div>

        {error && <p style={{ fontSize: 13, color: "#b91c1c" }}>{error}</p>}

        <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ padding: "14px" }}>
          {loading ? "Creating..." : "Create Catering"}
        </button>
      </div>
    </div>
  );
}
