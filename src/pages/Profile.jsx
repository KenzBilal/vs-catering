import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";

export default function Profile() {
  const { user, login, logout } = useAuth();
  const dropPoints = useQuery(api.dropPoints.getDropPoints);
  const updatePrefs = useMutation(api.users.updatePreferences);

  const [dropPoint, setDropPoint] = useState(user?.defaultDropPoint || "Main Gate");
  const [stayType, setStayType] = useState(user?.stayType || "hostel");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePrefs({ userId: user._id, defaultDropPoint: dropPoint, stayType });
      login({ ...user, defaultDropPoint: dropPoint, stayType });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = {
    student: "Student",
    sub_admin: "Sub-Admin",
    admin: "Admin",
  };

  return (
    <div className="page-container" style={{ maxWidth: 500 }}>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        Profile
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Your account details and preferences.
      </p>

      {/* Account info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="section-title">Account</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Row label="Name" value={user?.name} />
          <Row label="Phone" value={user?.phone} />
          <Row label="Gender" value={user?.gender === "male" ? "Male" : "Female"} />
          <Row label="Role" value={roleLabel[user?.role] || "Student"} />
        </div>
      </div>

      {/* Editable preferences */}
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="section-title">Preferences</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="label">Where do you stay?</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[["hostel", "Hostel"], ["day_scholar", "Day Scholar"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setStayType(val)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 6,
                    border: `1px solid ${stayType === val ? "var(--accent)" : "var(--cream-border)"}`,
                    background: stayType === val ? "var(--accent)" : "var(--cream-card)",
                    color: stayType === val ? "var(--cream-50)" : "var(--text-primary)",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Default Drop Point</label>
            <select
              value={dropPoint}
              onChange={(e) => setDropPoint(e.target.value)}
            >
              {(dropPoints || []).map((dp) => (
                <option key={dp._id} value={dp.name}>{dp.name}</option>
              ))}
            </select>
          </div>

          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : saved ? "Saved" : "Save Preferences"}
          </button>
        </div>
      </div>

      <button
        onClick={logout}
        className="btn-secondary"
        style={{ width: "100%" }}
      >
        Log Out
      </button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
