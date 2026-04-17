import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { getRoleLabel, formatDate, formatCurrency, DRESS_CODE_DEFAULTS } from "../lib/helpers";

export default function Register() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const catering = useQuery(api.caterings.getCatering, { cateringId: id });
  const dropPoints = useQuery(api.dropPoints.getDropPoints);
  const registerMutation = useMutation(api.registrations.register);

  const [role, setRole] = useState("");
  const [dropPoint, setDropPoint] = useState(user?.defaultDropPoint || "Main Gate");
  const [selectedDays, setSelectedDays] = useState([0]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (catering === undefined) {
    return <div className="page-container"><p style={{ color: "var(--text-muted)" }}>Loading...</p></div>;
  }

  if (!catering) {
    return <div className="page-container"><p style={{ color: "var(--text-muted)" }}>Catering not found.</p></div>;
  }

  // Unique roles from day 0 slots
  const availableRoles = [...new Set(catering.slots.filter((s) => s.day === 0).map((s) => s.role))];

  // If joinRule is both_days, always register for both
  const daysToRegister =
    catering.isTwoDay && catering.joinRule === "both_days"
      ? [0, 1]
      : selectedDays;

  const handleDayToggle = (day) => {
    if (catering.joinRule === "both_days") return;
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async () => {
    setError("");
    if (!role) return setError("Please select a role.");
    if (daysToRegister.length === 0) return setError("Please select at least one day.");
    if (catering.photoRequired && !photoUrl.trim()) return setError("A photo link is required for this catering.");

    setLoading(true);
    try {
      await registerMutation({
        userId: user._id,
        cateringId: id,
        days: daysToRegister,
        role,
        dropPoint,
        ...(catering.photoRequired ? { photoUrl } : {}),
      });
      setDone(true);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="page-container" style={{ maxWidth: 500 }}>
        <div
          className="card"
          style={{ textAlign: "center", padding: "40px 24px" }}
        >
          <p style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
            Registered
          </p>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 20 }}>
            You are registered for {catering.place}. Your spot will be confirmed based on slot availability.
          </p>
          <button className="btn-primary" onClick={() => navigate(`/catering/${id}`)}>
            View Catering
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 500 }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: "var(--text-muted)",
          fontSize: 13,
          cursor: "pointer",
          padding: 0,
          marginBottom: 16,
        }}
      >
        ← Back
      </button>

      <div style={{ marginBottom: 20 }}>
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Register
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {catering.place} ·{" "}
          {catering.isTwoDay
            ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}`
            : formatDate(catering.dates[0])}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Role selection */}
        <div>
          <label className="label">Select Role</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {availableRoles.map((r) => {
              const slot = catering.slots.find((s) => s.role === r && s.day === 0);
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: `1px solid ${role === r ? "var(--accent)" : "var(--cream-border)"}`,
                    background: role === r ? "var(--accent)" : "var(--cream-card)",
                    color: role === r ? "var(--cream-50)" : "var(--text-primary)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{getRoleLabel(r)}</span>
                  {slot && (
                    <span style={{ fontSize: 13, opacity: 0.8 }}>{formatCurrency(slot.pay)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dress code reminder */}
        {role && (
          <div
            style={{
              background: "var(--cream-bg)",
              border: "1px solid var(--cream-border)",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              Dress Code
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {catering.dressCodeNotes || DRESS_CODE_DEFAULTS[role]}
            </p>
          </div>
        )}

        {/* Day selection — only if two-day and any_day rule */}
        {catering.isTwoDay && catering.joinRule === "any_day" && (
          <div>
            <label className="label">Select Day(s)</label>
            <div style={{ display: "flex", gap: 10 }}>
              {catering.dates.map((date, i) => (
                <button
                  key={i}
                  onClick={() => handleDayToggle(i)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 8,
                    border: `1px solid ${selectedDays.includes(i) ? "var(--accent)" : "var(--cream-border)"}`,
                    background: selectedDays.includes(i) ? "var(--accent)" : "var(--cream-card)",
                    color: selectedDays.includes(i) ? "var(--cream-50)" : "var(--text-primary)",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Day {i + 1} — {formatDate(date)}
                </button>
              ))}
            </div>
          </div>
        )}

        {catering.isTwoDay && catering.joinRule === "both_days" && (
          <div
            style={{
              background: "#fdf0e6",
              border: "1px solid #f5d0aa",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            <p style={{ fontSize: 13, color: "#8b3a00" }}>
              This catering requires attendance on both days. Registering here confirms you for both {formatDate(catering.dates[0])} and {formatDate(catering.dates[1])}.
            </p>
          </div>
        )}

        {/* Drop point */}
        <div>
          <label className="label">Drop Point</label>
          <select
            value={dropPoint}
            onChange={(e) => setDropPoint(e.target.value)}
          >
            {(dropPoints || []).map((dp) => (
              <option key={dp._id} value={dp.name}>{dp.name}</option>
            ))}
          </select>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Pickup is from Main Gate for everyone.
          </p>
        </div>

        {/* Photo */}
        {catering.photoRequired && (
          <div>
            <label className="label">Photo Link {catering.photoRequired ? "(Required)" : "(Optional)"}</label>
            <input
              type="url"
              placeholder="Paste a link to your photo (Google Drive, etc.)"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>
        )}

        {error && (
          <p style={{ fontSize: 13, color: "#b91c1c" }}>{error}</p>
        )}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading}
          style={{ padding: "14px", marginTop: 4 }}
        >
          {loading ? "Registering..." : "Confirm Registration"}
        </button>
      </div>
    </div>
  );
}
