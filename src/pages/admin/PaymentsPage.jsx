import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { formatCurrency, getRoleLabel, formatDate } from "../../lib/helpers";
import { useState } from "react";

export default function PaymentsPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const catering = useQuery(api.caterings.getCatering, { cateringId: id });
  const registrations = useQuery(api.registrations.getRegistrationsByCatering, { cateringId: id });
  const payments = useQuery(api.payments.getPaymentsByCatering, { cateringId: id });
  const createPayment = useMutation(api.payments.createPayment);
  const clearPayment = useMutation(api.payments.clearPayment);

  const [upiRefs, setUpiRefs] = useState({});
  const [methods, setMethods] = useState({});
  const [saving, setSaving] = useState({});
  const [confirmClear, setConfirmClear] = useState(null);

  // Only attended students
  const attendedRegs = (registrations || []).filter((r) => r.status === "attended");

  const getPaymentForReg = (regId) =>
    (payments || []).find((p) => p.registrationId === regId);

  const getPayForRole = (role, day) => {
    const slot = catering?.slots.find((s) => s.role === role && s.day === day);
    return slot?.pay || 0;
  };

  const handleCreatePayment = async (reg) => {
    const pay = getPayForRole(reg.role, reg.days[0]);
    const method = methods[reg._id] || "cash";
    setSaving((s) => ({ ...s, [reg._id]: true }));
    try {
      await createPayment({
        userId: reg.userId,
        cateringId: id,
        registrationId: reg._id,
        day: reg.days[0],
        role: reg.role,
        amount: pay,
        method,
        token,
      });
    } finally {
      setSaving((s) => ({ ...s, [reg._id]: false }));
    }
  };

  const handleClearPayment = async (paymentId) => {
    setSaving((s) => ({ ...s, [paymentId]: true }));
    try {
      await clearPayment({
        paymentId,
        clearedBy: user._id,
        upiRef: upiRefs[paymentId] || undefined,
        token,
      });
      setConfirmClear(null);
    } finally {
      setSaving((s) => ({ ...s, [paymentId]: false }));
    }
  };

  const totalPaid = (payments || [])
    .filter((p) => p.status === "cleared")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = (payments || [])
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16 }}>
        ← Back
      </button>

      <div style={{ marginBottom: 20 }}>
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>Payments</h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {catering?.place} · {catering ? (catering.isTwoDay ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}` : formatDate(catering.dates[0])) : ""}
        </p>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        <div className="card" style={{ textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Attended</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)" }}>{attendedRegs.length}</p>
        </div>
        <div className="card" style={{ textAlign: "center", background: "#e8f5ee", border: "1px solid #b8dfc8" }}>
          <p style={{ fontSize: 11, color: "#2d7a52", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Paid Out</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#1a5c3a" }}>{formatCurrency(totalPaid)}</p>
        </div>
        <div className="card" style={{ textAlign: "center", background: "#fdf0e6", border: "1px solid #f5d0aa" }}>
          <p style={{ fontSize: 11, color: "#a05020", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Pending</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: "#8b3a00" }}>{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {attendedRegs.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 32 }}>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            No attended students yet. Mark attendance first.
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {attendedRegs.map((reg) => {
          const payment = getPaymentForReg(reg._id);
          const pay = getPayForRole(reg.role, reg.days[0]);

          return (
            <div key={reg._id} className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{reg.user?.name}</p>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {reg.user?.phone} · {getRoleLabel(reg.role)}
                  </p>
                </div>
                <p style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>{formatCurrency(pay)}</p>
              </div>

              {!payment && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    value={methods[reg._id] || "cash"}
                    onChange={(e) => setMethods((m) => ({ ...m, [reg._id]: e.target.value }))}
                    style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                  </select>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: "6px 12px" }}
                    disabled={saving[reg._id]}
                    onClick={() => handleCreatePayment(reg)}
                  >
                    Add to Pending
                  </button>
                </div>
              )}

              {payment && payment.status === "pending" && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "#8b3a00", background: "#fdf0e6", border: "1px solid #f5d0aa", borderRadius: 12, padding: "3px 10px", fontWeight: 500 }}>
                      Pending · {payment.method === "upi" ? "UPI" : "Cash"}
                    </span>
                  </div>
                  {payment.method === "upi" && (
                    <input
                      type="text"
                      placeholder="UPI Transaction ID (optional)"
                      value={upiRefs[payment._id] || ""}
                      onChange={(e) => setUpiRefs((u) => ({ ...u, [payment._id]: e.target.value }))}
                      style={{ marginBottom: 8, fontSize: 13 }}
                    />
                  )}
                  {confirmClear === payment._id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn-primary"
                        style={{ fontSize: 12, padding: "6px 12px" }}
                        disabled={saving[payment._id]}
                        onClick={() => handleClearPayment(payment._id)}
                      >
                        Confirm — Mark as Paid
                      </button>
                      <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 12px" }} onClick={() => setConfirmClear(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={() => setConfirmClear(payment._id)}
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              )}

              {payment && payment.status === "cleared" && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#1a5c3a", background: "#e8f5ee", border: "1px solid #b8dfc8", borderRadius: 12, padding: "3px 10px", fontWeight: 500 }}>
                    Paid · {payment.method === "upi" ? "UPI" : "Cash"}
                  </span>
                  {payment.upiRef && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Ref: {payment.upiRef}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
