import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { formatDate, formatCurrency, getRoleLabel, getStatusBadgeClass, getStatusLabel } from "../../lib/helpers";
import { Link } from "react-router-dom";
import { useState } from "react";
import { CalendarDays, CheckCircle2, Clock, AlertCircle, XCircle, ArrowRight, AlertTriangle } from "lucide-react";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import EmptyState from "../../components/shared/EmptyState";
import toast from "react-hot-toast";

const ATTENDANCE_STYLE = {
  attended:   { text: "Attended", color: "text-[#1a5c3a]", bg: "bg-[#e8f5ee]" },
  absent:     { text: "Absent",   color: "text-stone-600",  bg: "bg-cream-100" },
  rejected:   { text: "Rejected", color: "text-red-700",    bg: "bg-red-50" },
  registered: { text: "Pending",  color: "text-stone-400",  bg: "bg-cream-50" },
};

export default function MyEvents() {
  const { user, token } = useAuth();
  const registrationsRaw = useQuery(api.registrations.getRegistrationsByUser, 
    user ? { userId: user._id, token } : "skip"
  );
  const paymentsRaw = useQuery(api.payments.getPaymentsByUser, 
    user ? { userId: user._id, token } : "skip"
  );
  const { data: registrations, timedOut: regTimeout } = useQueryWithTimeout(registrationsRaw);
  const { data: payments, timedOut: payTimeout } = useQueryWithTimeout(paymentsRaw);
  const cancelRegistration = useMutation(api.registrations.cancelRegistration);

  if (regTimeout || payTimeout) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const [confirmCancel, setConfirmCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const pendingPayments = (payments || []).filter((p) => p.status === "pending");
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  const handleCancel = async () => {
    setCancelling(true);
    setCancelError("");
    try {
      await cancelRegistration({ registrationId: confirmCancel, token });
      setConfirmCancel(null);
      toast.success("Registration cancelled");
    } catch (e) {
      setCancelError(e.message || "Failed to cancel.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">My Events</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">Your registrations and payment status.</p>
      </div>

      {/* Pending payment alert */}
      {pendingPayments.length > 0 && (
        <div className="bg-[#fdf8f3] border border-[#f5d0aa] rounded-2xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-[#a05020] shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <p className="font-bold text-[15px] text-[#8b3a00]">Payment Due — {formatCurrency(totalPending)}</p>
              <p className="text-[13px] text-[#a05020] font-medium mt-1">
                {pendingPayments.length} unpaid amount{pendingPayments.length > 1 ? "s" : ""} from past events.
              </p>
              <div className="mt-3 flex flex-col gap-1.5">
                {pendingPayments.map((p) => (
                  <div key={p._id} className="flex justify-between text-[13px]">
                    <span className="font-medium text-stone-600">{p.catering?.place} · {getRoleLabel(p.role)}</span>
                    <span className="font-bold text-[#8b3a00]">{formatCurrency(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {registrations === undefined && (
        <LoadingState rows={2} />
      )}

      {registrations !== undefined && registrations.length === 0 && (
        <EmptyState 
          icon={CalendarDays} 
          title="No registrations yet" 
          description="Browse events and register for one to see them here." 
          action={{ label: "Browse Events", href: "/" }}
        />
      )}

      <div className="flex flex-col gap-4">
        {(registrations || []).map((reg) => {
          const relatedPayments = (payments || []).filter((p) => p.cateringId === reg.cateringId);
          const att = ATTENDANCE_STYLE[reg.status] || ATTENDANCE_STYLE.registered;
          const canCancel = reg.status !== "attended" && reg.catering?.status !== "ended" && reg.catering?.status !== "cancelled";

          return (
            <div key={reg._id} className="card bg-white p-5">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="min-w-0">
                  <Link to={`/catering/${reg.cateringId}`} className="hover:underline underline-offset-2">
                    <h3 className="font-bold text-[16px] text-stone-900 truncate">{reg.catering?.place}</h3>
                  </Link>
                  <p className="text-[13px] font-medium text-stone-500 mt-0.5 flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    {reg.catering ? formatDate(reg.catering.date) : ""}
                  </p>
                </div>
                {reg.catering && (
                  <span className={`${getStatusBadgeClass(reg.catering.status)} shrink-0`}>
                    {getStatusLabel(reg.catering.status)}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <StatBox label="Role"       value={getRoleLabel(reg.role)} />
                <StatBox label="Spot"       value={reg.isConfirmed ? "Confirmed" : `Waitlist #${reg.queuePosition}`} green={reg.isConfirmed} />
                <StatBox label="Drop Point" value={reg.dropPoint} />
                <div className="bg-cream-50 border border-cream-100 rounded-xl px-3 py-2.5">
                  <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Attendance</p>
                  <span className={`text-[12.5px] font-bold px-2 py-0.5 rounded-md ${att.bg} ${att.color}`}>{att.text}</span>
                </div>
              </div>

              {reg.status === "rejected" && reg.rejectionReason && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4 text-[13px]">
                  <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="font-medium text-red-700">Reason: {reg.rejectionReason}</p>
                </div>
              )}

              {relatedPayments.length > 0 && (
                <div className="pt-3 border-t border-cream-100 flex flex-col gap-2 mb-4">
                  {relatedPayments.map((p) => (
                    <div key={p._id} className="flex justify-between items-center text-[13.5px]">
                      <span className="font-medium text-stone-600">Payment · {getRoleLabel(p.role)}</span>
                      <span className={`flex items-center gap-1.5 font-bold ${p.status === "cleared" ? "text-[#1a5c3a]" : "text-[#8b3a00]"}`}>
                        {p.status === "cleared" ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        {formatCurrency(p.amount)} · {p.status === "cleared" ? "Paid" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {canCancel && (
                <button
                  onClick={() => { setConfirmCancel(reg._id); setCancelError(""); }}
                  className="w-full py-2 text-[13px] font-semibold text-stone-400 hover:text-red-600 border border-cream-200 hover:border-red-100 hover:bg-red-50 rounded-xl transition-all active:scale-[0.98]"
                >
                  Cancel Registration
                </button>
              )}
            </div>
          );
        })}
      </div>

      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-cream-200 p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="font-bold text-[15px] text-stone-900">Cancel Registration</p>
                <p className="text-[13px] text-stone-500 mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <p className="text-[14px] text-stone-600 mb-5">Your spot will be freed up for someone else on the waitlist.</p>
            {cancelError && <p className="text-[13px] text-red-600 font-medium mb-3">{cancelError}</p>}
            <div className="flex gap-2">
              <button className="flex-1 py-2.5 rounded-xl bg-red-700 text-white text-[13px] font-bold hover:bg-red-800 transition-colors active:scale-[0.98] disabled:opacity-60" disabled={cancelling} onClick={handleCancel}>
                {cancelling ? "Cancelling..." : "Yes, Cancel"}
              </button>
              <button className="flex-1 btn-secondary py-2.5 text-[13px]" onClick={() => setConfirmCancel(null)}>Keep It</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, green }) {
  return (
    <div className="bg-cream-50 border border-cream-100 rounded-xl px-3 py-2.5">
      <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-[13px] font-bold truncate ${green ? "text-[#1a5c3a]" : "text-stone-800"}`}>{value}</p>
    </div>
  );
}
