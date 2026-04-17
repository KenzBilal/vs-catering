import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { formatCurrency, formatDate, getRoleLabel } from "../../lib/helpers";
import { useState } from "react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const caterings = useQuery(api.caterings.listCaterings);
  const pendingPayments = useQuery(api.payments.getPendingPayments);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const analytics = useQuery(api.payments.getMonthlyAnalytics, { month, year });

  const activeCaterings = (caterings || []).filter(
    (c) => c.status === "today" || c.status === "tomorrow" || c.status === "upcoming"
  );

  // Group pending payments by user
  const byUser = {};
  (pendingPayments || []).forEach((p) => {
    const key = p.userId;
    if (!byUser[key]) byUser[key] = { user: p.user, payments: [] };
    byUser[key].payments.push(p);
  });

  const monthNames = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
            Admin Dashboard
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {user?.role === "admin" ? "Admin" : "Sub-Admin"} — {user?.name}
          </p>
        </div>
        {user?.role === "admin" && (
          <button
            className="btn-primary"
            onClick={() => navigate("/admin/create-catering")}
          >
            + New Catering
          </button>
        )}
      </div>

      {/* Active caterings */}
      <div style={{ marginBottom: 24 }}>
        <p className="section-title">Active Caterings</p>
        {activeCaterings.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No upcoming caterings.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {activeCaterings.map((c) => (
            <div
              key={c._id}
              className="card"
              style={{ cursor: "pointer" }}
              onClick={() => navigate(`/catering/${c._id}`)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{c.place}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {c.isTwoDay
                      ? `${formatDate(c.dates[0])} – ${formatDate(c.dates[1])}`
                      : formatDate(c.dates[0])}
                    {" · "}{c.specificTime}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: "6px 10px" }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/catering/${c._id}/attendance`); }}
                  >
                    Attendance
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: "6px 10px" }}
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/catering/${c._id}/payments`); }}
                  >
                    Payments
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending payments */}
      <div style={{ marginBottom: 24 }}>
        <p className="section-title">
          All Pending Payments
          {pendingPayments && pendingPayments.length > 0 && (
            <span
              style={{
                marginLeft: 8,
                background: "#fdf0e6",
                color: "#8b3a00",
                border: "1px solid #f5d0aa",
                borderRadius: 12,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {pendingPayments.length}
            </span>
          )}
        </p>

        {pendingPayments === undefined && (
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</p>
        )}

        {pendingPayments?.length === 0 && (
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>No pending payments.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.values(byUser).map(({ user: u, payments }) => {
            const total = payments.reduce((sum, p) => sum + p.amount, 0);
            return (
              <div key={u?._id} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{u?.name}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{u?.phone}</p>
                  </div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "#8b3a00" }}>
                    {formatCurrency(total)} pending
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {payments.map((p) => (
                    <div
                      key={p._id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "var(--text-muted)",
                        paddingTop: 4,
                        borderTop: "1px solid var(--cream-border)",
                      }}
                    >
                      <span>{p.catering?.place} · {getRoleLabel(p.role)}</span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
                <button
                  className="btn-secondary"
                  style={{ marginTop: 10, fontSize: 12, padding: "6px 10px" }}
                  onClick={() => navigate(`/admin/catering/${payments[0].cateringId}/payments`)}
                >
                  Go to payments
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly analytics */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <p className="section-title" style={{ marginBottom: 0 }}>Monthly Summary</p>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {analytics && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <StatCard label="Caterings" value={analytics.totalCaterings} />
            <StatCard label="Students Paid" value={analytics.uniqueStudents} />
            <StatCard label="Total Paid Out" value={formatCurrency(analytics.totalPayout)} />
            <StatCard label="Payments Cleared" value={analytics.paymentsCleared} />
            <StatCard label="Payments Pending" value={analytics.paymentsPending} highlight />
            <StatCard label="Amount Pending" value={formatCurrency(analytics.pendingPayout)} highlight />
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div
      style={{
        background: highlight ? "#fdf0e6" : "var(--cream-card)",
        border: `1px solid ${highlight ? "#f5d0aa" : "var(--cream-border)"}`,
        borderRadius: 10,
        padding: "14px 16px",
      }}
    >
      <p style={{ fontSize: 11, color: highlight ? "#a05020" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        {label}
      </p>
      <p style={{ fontSize: 20, fontWeight: 700, color: highlight ? "#8b3a00" : "var(--text-primary)" }}>
        {value}
      </p>
    </div>
  );
}
