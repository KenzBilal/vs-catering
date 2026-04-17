import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { formatDate, formatCurrency, getRoleLabel, getStatusBadgeClass, getStatusLabel } from "../lib/helpers";
import { Link } from "react-router-dom";

export default function MyCaterings() {
  const { user } = useAuth();
  const registrations = useQuery(api.registrations.getRegistrationsByUser, { userId: user._id });
  const payments = useQuery(api.payments.getPaymentsByUser, { userId: user._id });

  const pendingPayments = (payments || []).filter((p) => p.status === "pending");
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <h2 className="text-xl font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        My Caterings
      </h2>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Your registrations and payment status.
      </p>

      {/* Pending payments banner */}
      {pendingPayments.length > 0 && (
        <div
          style={{
            background: "#fdf0e6",
            border: "1px solid #f5d0aa",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 20,
          }}
        >
          <p style={{ fontWeight: 600, fontSize: 14, color: "#8b3a00" }}>
            Payment Pending — {formatCurrency(totalPending)}
          </p>
          <p style={{ fontSize: 13, color: "#a05020", marginTop: 4 }}>
            You have unpaid amounts from {pendingPayments.length} catering{pendingPayments.length > 1 ? "s" : ""}.
          </p>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            {pendingPayments.map((p) => (
              <div
                key={p._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 13,
                  color: "#8b3a00",
                }}
              >
                <span>{p.catering?.place} · {getRoleLabel(p.role)}</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {registrations === undefined && (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</p>
      )}

      {registrations !== undefined && registrations.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            You have not registered for any caterings yet.
          </p>
          <Link to="/" style={{ display: "inline-block", marginTop: 12 }}>
            <button className="btn-primary">Browse Caterings</button>
          </Link>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(registrations || []).map((reg) => {
          const relatedPayments = (payments || []).filter(
            (p) => p.cateringId === reg.cateringId
          );

          return (
            <div key={reg._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <Link
                    to={`/catering/${reg.cateringId}`}
                    style={{ textDecoration: "none" }}
                  >
                    <p style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
                      {reg.catering?.place}
                    </p>
                  </Link>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {reg.catering
                      ? reg.catering.isTwoDay
                        ? `${formatDate(reg.catering.dates[0])} – ${formatDate(reg.catering.dates[1])}`
                        : formatDate(reg.catering.dates[0])
                      : ""}
                  </p>
                </div>
                {reg.catering && (
                  <span className={getStatusBadgeClass(reg.catering.status)}>
                    {getStatusLabel(reg.catering.status)}
                  </span>
                )}
              </div>

              <hr className="divider" style={{ margin: "8px 0" }} />

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                <Stat label="Role" value={getRoleLabel(reg.role)} />
                <Stat
                  label="Spot"
                  value={reg.isConfirmed ? "Confirmed" : `Waiting (#${reg.queuePosition})`}
                  highlight={reg.isConfirmed}
                />
                <Stat label="Drop Point" value={reg.dropPoint} />
                <Stat
                  label="Attendance"
                  value={
                    reg.status === "attended"
                      ? "Attended"
                      : reg.status === "rejected"
                      ? "Rejected"
                      : reg.status === "absent"
                      ? "Absent"
                      : "Not marked yet"
                  }
                />
              </div>

              {reg.status === "rejected" && reg.rejectionReason && (
                <div
                  style={{
                    marginTop: 10,
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    borderRadius: 6,
                    padding: "8px 10px",
                    fontSize: 12,
                    color: "#b91c1c",
                  }}
                >
                  Reason: {reg.rejectionReason}
                </div>
              )}

              {relatedPayments.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  {relatedPayments.map((p) => (
                    <div
                      key={p._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        padding: "6px 0",
                        borderTop: "1px solid var(--cream-border)",
                      }}
                    >
                      <span style={{ color: "var(--text-secondary)" }}>
                        Payment · {getRoleLabel(p.role)}
                      </span>
                      <span
                        style={{
                          fontWeight: 600,
                          color: p.status === "cleared" ? "#1a5c3a" : "#8b3a00",
                        }}
                      >
                        {formatCurrency(p.amount)} · {p.status === "cleared" ? "Paid" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div>
      <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
        {label}
      </p>
      <p
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: highlight ? "#1a5c3a" : "var(--text-primary)",
        }}
      >
        {value}
      </p>
    </div>
  );
}
