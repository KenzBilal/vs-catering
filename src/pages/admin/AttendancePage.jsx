import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { getRoleLabel, formatDate } from "../../lib/helpers";
import { useState } from "react";

const STATUS_OPTIONS = [
  { value: "attended", label: "Attended", color: "#1a5c3a", bg: "#e8f5ee" },
  { value: "absent", label: "Absent", color: "#5c524a", bg: "#f0ece8" },
  { value: "rejected", label: "Rejected", color: "#b91c1c", bg: "#fef2f2" },
];

export default function AttendancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const catering = useQuery(api.caterings.getCatering, { cateringId: id });
  const registrations = useQuery(api.registrations.getRegistrationsByCatering, { cateringId: id });
  const markAttendance = useMutation(api.registrations.markAttendance);
  const changeRole = useMutation(api.registrations.changeRole);

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectionInput, setRejectionInput] = useState({});
  const [saving, setSaving] = useState({});

  const handleMark = async (regId, status, reason) => {
    setSaving((s) => ({ ...s, [regId]: true }));
    try {
      await markAttendance({ registrationId: regId, status, ...(reason ? { rejectionReason: reason } : {}) });
    } finally {
      setSaving((s) => ({ ...s, [regId]: false }));
    }
  };

  const handleRoleChange = async (regId, role) => {
    await changeRole({ registrationId: regId, role });
  };

  const filtered = (registrations || []).filter((r) => {
    if (roleFilter !== "all" && r.role !== roleFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const roles = [...new Set((registrations || []).map((r) => r.role))];

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16 }}>
        ← Back
      </button>

      <div style={{ marginBottom: 20 }}>
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Attendance
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {catering?.place} · {catering ? (catering.isTwoDay ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}` : formatDate(catering.dates[0])) : ""}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}>
          <option value="all">All Roles</option>
          {roles.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}>
          <option value="all">All Status</option>
          <option value="registered">Not Marked</option>
          <option value="attended">Attended</option>
          <option value="absent">Absent</option>
          <option value="rejected">Rejected</option>
        </select>
        <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-muted)", alignSelf: "center" }}>
          {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {registrations === undefined && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</p>}
      {registrations?.length === 0 && <p style={{ color: "var(--text-muted)", fontSize: 14 }}>No registrations yet.</p>}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((reg) => (
          <div key={reg._id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                  {reg.user?.name}
                  {!reg.isConfirmed && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: "var(--text-muted)", fontWeight: 400 }}>
                      Waitlist #{reg.queuePosition}
                    </span>
                  )}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{reg.user?.phone}</p>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <select
                  value={reg.role}
                  onChange={(e) => handleRoleChange(reg._id, e.target.value)}
                  style={{ width: "auto", padding: "5px 8px", fontSize: 12 }}
                >
                  {["service_boy", "service_girl", "captain_male"].map((r) => (
                    <option key={r} value={r}>{getRoleLabel(r)}</option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>→ {reg.dropPoint}</span>
              </div>
            </div>

            {/* Status buttons */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  disabled={saving[reg._id]}
                  onClick={() => {
                    if (opt.value === "rejected") return; // handled below
                    handleMark(reg._id, opt.value);
                  }}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    border: `1px solid ${reg.status === opt.value ? opt.color : "var(--cream-border)"}`,
                    background: reg.status === opt.value ? opt.bg : "var(--cream-card)",
                    color: reg.status === opt.value ? opt.color : "var(--text-muted)",
                    cursor: opt.value === "rejected" ? "default" : "pointer",
                    display: opt.value === "rejected" ? "none" : "block",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Rejection row */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                type="text"
                placeholder="Rejection reason (e.g. wrong pants)"
                value={rejectionInput[reg._id] || ""}
                onChange={(e) => setRejectionInput((prev) => ({ ...prev, [reg._id]: e.target.value }))}
                style={{ flex: 1, fontSize: 12, padding: "6px 10px" }}
              />
              <button
                disabled={saving[reg._id]}
                onClick={() => handleMark(reg._id, "rejected", rejectionInput[reg._id])}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 500,
                  border: `1px solid ${reg.status === "rejected" ? "#b91c1c" : "var(--cream-border)"}`,
                  background: reg.status === "rejected" ? "#fef2f2" : "var(--cream-card)",
                  color: reg.status === "rejected" ? "#b91c1c" : "var(--text-muted)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Mark Rejected
              </button>
            </div>

            {reg.status === "rejected" && reg.rejectionReason && (
              <p style={{ fontSize: 12, color: "#b91c1c", marginTop: 6 }}>
                Reason: {reg.rejectionReason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
