import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { formatCurrency, getRoleLabel, formatDate } from "../../lib/helpers";
import { useState } from "react";
import { ArrowLeft, MapPin, CalendarDays, CheckCircle2, Clock, IndianRupee, HandCoins } from "lucide-react";

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

  const getPaymentForReg = (regId) => (payments || []).find((p) => p.registrationId === regId);

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
        upiRef: upiRefs[paymentId] || undefined,
        token,
      });
      setConfirmClear(null);
    } finally {
      setSaving((s) => ({ ...s, [paymentId]: false }));
    }
  };

  const totalPaid = (payments || []).filter((p) => p.status === "cleared").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = (payments || []).filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Payments</h2>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-[14px] text-stone-500 font-medium">
          <span className="flex items-center gap-1.5"><MapPin size={16} /> {catering?.place}</span>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={16} /> 
            {catering ? (catering.isTwoDay ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}` : formatDate(catering.dates[0])) : ""}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1">
            <CheckCircle2 size={14} /> Attended
          </div>
          <p className="text-3xl font-black text-stone-800">{attendedRegs.length}</p>
        </div>
        <div className="bg-[#e8f5ee] border border-[#b8dfc8] rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2d7a52] uppercase tracking-widest mb-1">
            <IndianRupee size={14} /> Paid Out
          </div>
          <p className="text-3xl font-black text-[#1a5c3a]">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-[#fdf0e6] border border-[#f5d0aa] rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#a05020] uppercase tracking-widest mb-1">
            <Clock size={14} /> Pending
          </div>
          <p className="text-3xl font-black text-[#8b3a00]">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {catering?.status === "upcoming" && (
        <div className="card text-center py-16 bg-white border-dashed">
          <Clock size={48} className="mx-auto text-cream-300 mb-4" />
          <p className="text-stone-500 font-bold text-[17px]">Event has not started yet</p>
          <p className="text-stone-400 text-[14px] mt-2 max-w-sm mx-auto font-medium">
            Payment management will be available once the event starts and attendance is marked.
          </p>
        </div>
      )}

      {catering?.status !== "upcoming" && attendedRegs.length === 0 && (
        <div className="card text-center py-12">
          <HandCoins size={48} className="mx-auto text-cream-300 mb-4" />
          <p className="text-stone-500 font-medium text-[15px]">No attended students yet.</p>
          <p className="text-stone-400 text-[14px] mt-1">Mark attendance first before managing payments.</p>
        </div>
      )}

      {catering?.status !== "upcoming" && attendedRegs.length > 0 && (
        <div className="flex flex-col gap-4">
        {attendedRegs.map((reg) => {
          const payment = getPaymentForReg(reg._id);
          const pay = getPayForRole(reg.role, reg.days[0]);

          return (
            <div key={reg._id} className="card bg-white p-5 hover:border-cream-300 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div>
                  <p className="font-bold text-[16px] text-stone-900">{reg.user?.name}</p>
                  <p className="text-[13px] text-stone-500 mt-0.5 font-medium">
                    {reg.user?.phone} <span className="mx-1.5">•</span> {getRoleLabel(reg.role)}
                  </p>
                </div>
                <div className="bg-cream-100 border border-cream-200 px-3 py-1.5 rounded-lg">
                  <p className="font-bold text-[16px] text-stone-900">{formatCurrency(pay)}</p>
                </div>
              </div>

              {!payment && (
                <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-cream-100">
                  <select
                    value={methods[reg._id] || "cash"}
                    onChange={(e) => setMethods((m) => ({ ...m, [reg._id]: e.target.value }))}
                    className="w-auto px-4 py-2"
                  >
                    <option value="cash">Cash Payment</option>
                    <option value="upi">UPI Transfer</option>
                  </select>
                  <button
                    className="btn-secondary py-2 text-[13px]"
                    disabled={saving[reg._id]}
                    onClick={() => handleCreatePayment(reg)}
                  >
                    <Clock size={16} /> Add to Pending
                  </button>
                </div>
              )}

              {payment && payment.status === "pending" && (
                <div className="pt-4 border-t border-cream-100">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8b3a00] bg-[#fdf0e6] border border-[#f5d0aa] rounded-full px-2.5 py-1">
                      <Clock size={12} /> Pending ({payment.method === "upi" ? "UPI" : "Cash"})
                    </span>
                  </div>
                  
                  {payment.method === "upi" && (
                    <input
                      type="text"
                      placeholder="UPI Transaction ID (optional)"
                      value={upiRefs[payment._id] || ""}
                      onChange={(e) => setUpiRefs((u) => ({ ...u, [payment._id]: e.target.value }))}
                      className="mb-3 bg-white border border-cream-200 text-stone-800 rounded-lg px-3 py-2 text-[13px] w-full max-w-sm outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-800/10 transition-all"
                    />
                  )}
                  
                  {confirmClear === payment._id ? (
                    <div className="flex flex-wrap gap-2 animate-fade-in">
                      <button
                        className="btn-primary py-2 text-[13px] bg-[#1a5c3a] hover:bg-[#134229] ring-[#1a5c3a]"
                        disabled={saving[payment._id]}
                        onClick={() => handleClearPayment(payment._id)}
                      >
                        <CheckCircle2 size={16} /> Confirm Payment
                      </button>
                      <button 
                        className="btn-secondary py-2 text-[13px]" 
                        onClick={() => setConfirmClear(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-primary py-2 text-[13px]"
                      onClick={() => setConfirmClear(payment._id)}
                    >
                      Mark as Paid
                    </button>
                  )}
                </div>
              )}

              {payment && payment.status === "cleared" && (
                <div className="pt-4 border-t border-cream-100 flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1a5c3a] bg-[#e8f5ee] border border-[#b8dfc8] rounded-full px-2.5 py-1">
                    <CheckCircle2 size={12} /> Paid ({payment.method === "upi" ? "UPI" : "Cash"})
                  </span>
                  {payment.upiRef && (
                    <span className="text-[12px] font-mono text-stone-500 bg-cream-100 px-2 py-1 rounded-md">
                      Ref: {payment.upiRef}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </div>
  );
}
