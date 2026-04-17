import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import {
  formatDate,
  formatCurrency,
  getRoleLabel,
  getStatusBadgeClass,
  getStatusLabel,
  generateWhatsAppMessage,
} from "../lib/helpers";
import { useState } from "react";

export default function CateringDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const catering = useQuery(api.caterings.getCatering, { cateringId: id });
  const registrations = useQuery(api.registrations.getRegistrationsByCatering, { cateringId: id });
  const [copied, setCopied] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "sub_admin";

  if (catering === undefined) {
    return (
      <div className="page-container">
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  if (!catering) {
    return (
      <div className="page-container">
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Catering not found.</p>
      </div>
    );
  }

  // Check if current user is already registered
  const myReg = registrations?.find((r) => r.userId === user?._id);

  // Drop point counts
  const dropCounts = {};
  (registrations || []).forEach((r) => {
    dropCounts[r.dropPoint] = (dropCounts[r.dropPoint] || 0) + 1;
  });

  // Role fill counts
  const roleCounts = {};
  (registrations || []).forEach((r) => {
    const key = `${r.role}-${r.days[0]}`;
    roleCounts[key] = (roleCounts[key] || 0) + 1;
  });

  const handleCopyMessage = () => {
    const url = `${window.location.origin}/catering/${catering._id}`;
    const msg = generateWhatsAppMessage(catering, url);
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      {/* Back */}
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

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            {catering.place}
          </h2>
          <span className={getStatusBadgeClass(catering.status)}>
            {getStatusLabel(catering.status)}
          </span>
        </div>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {catering.isTwoDay
            ? `${formatDate(catering.dates[0])} and ${formatDate(catering.dates[1])}`
            : formatDate(catering.dates[0])}
          {" · "}
          {catering.specificTime} ({catering.timeOfDay})
        </p>
      </div>

      {/* Info cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <InfoItem label="Pickup" value="Main Gate" />
        <InfoItem label="Photo Required" value={catering.photoRequired ? "Yes" : "No"} />
        {catering.isTwoDay && (
          <InfoItem
            label="Joining Rule"
            value={catering.joinRule === "both_days" ? "Must attend both days" : "Can join either day"}
          />
        )}
      </div>

      {/* Slots */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p className="section-title">Roles and Pay</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {catering.slots.map((s, i) => {
            const key = `${s.role}-${s.day}`;
            const filled = roleCounts[key] || 0;
            const confirmed = Math.min(filled, s.limit);
            const waiting = Math.max(0, filled - s.limit);

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: "var(--cream-bg)",
                  border: "1px solid var(--cream-border)",
                  borderRadius: 8,
                }}
              >
                <div>
                  <p style={{ fontWeight: 500, fontSize: 14, color: "var(--text-primary)" }}>
                    {getRoleLabel(s.role)}
                    {catering.isTwoDay && (
                      <span style={{ color: "var(--text-muted)", fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
                        Day {s.day + 1}
                      </span>
                    )}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {confirmed}/{s.limit} confirmed
                    {waiting > 0 && ` · ${waiting} waiting`}
                  </p>
                </div>
                <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
                  {formatCurrency(s.pay)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dress Code */}
      <div className="card" style={{ marginBottom: 12 }}>
        <p className="section-title">Dress Code</p>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {catering.dressCodeNotes}
        </p>
      </div>

      {/* Drop point counts — admin only */}
      {isAdmin && registrations && registrations.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p className="section-title">Drop Point Summary</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {Object.entries(dropCounts).map(([point, count]) => (
              <div
                key={point}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 14,
                  padding: "6px 0",
                  borderBottom: "1px solid var(--cream-border)",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>{point}</span>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {count} {count === 1 ? "student" : "students"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp share — admin only */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: 12 }}>
          <p className="section-title">Share on WhatsApp</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
            Copy the message below and send it to the WhatsApp group.
          </p>
          <div
            style={{
              background: "var(--cream-bg)",
              border: "1px solid var(--cream-border)",
              borderRadius: 6,
              padding: 12,
              fontSize: 13,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              lineHeight: 1.7,
              fontFamily: "DM Mono, monospace",
              marginBottom: 10,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {generateWhatsAppMessage(catering, `${window.location.origin}/catering/${catering._id}`)}
          </div>
          <button className="btn-secondary" onClick={handleCopyMessage}>
            {copied ? "Copied!" : "Copy Message"}
          </button>
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/admin/catering/${id}/attendance`)}
          >
            Manage Attendance
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/admin/catering/${id}/payments`)}
          >
            Manage Payments
          </button>
          {user?.role === "admin" && (
            <button
              className="btn-secondary"
              onClick={() => navigate(`/admin/catering/${id}/edit`)}
            >
              Edit Catering
            </button>
          )}
        </div>
      )}

      {/* Register button — students */}
      {!isAdmin && catering.status !== "ended" && (
        <div>
          {myReg ? (
            <div
              className="card"
              style={{
                background: "#f0f7f3",
                border: "1px solid #b8dfc8",
                textAlign: "center",
              }}
            >
              <p style={{ fontWeight: 500, fontSize: 14, color: "#1a5c3a" }}>
                You are registered
              </p>
              <p style={{ fontSize: 13, color: "#2d7a52", marginTop: 4 }}>
                Role: {getRoleLabel(myReg.role)} ·{" "}
                {myReg.isConfirmed ? "Confirmed" : "On waiting list"} · Drop: {myReg.dropPoint}
              </p>
            </div>
          ) : (
            <button
              className="btn-primary"
              style={{ width: "100%", padding: "14px" }}
              onClick={() => navigate(`/catering/${id}/register`)}
            >
              Register for this Catering
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div
      style={{
        background: "var(--cream-bg)",
        border: "1px solid var(--cream-border)",
        borderRadius: 8,
        padding: "10px 12px",
      }}
    >
      <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
        {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{value}</p>
    </div>
  );
}
