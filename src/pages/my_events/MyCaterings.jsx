import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { formatDate, formatCurrency, getRoleLabel, getStatusBadgeClass, getStatusLabel } from "../lib/helpers";
import { Link } from "react-router-dom";
import { CalendarDays, CheckCircle2, Clock, AlertCircle, XCircle, ArrowRight } from "lucide-react";

const ATTENDANCE_LABEL = {
  attended: { text: "Attended", color: "text-[#1a5c3a]", bg: "bg-[#e8f5ee]" },
  absent:   { text: "Absent",   color: "text-stone-600",   bg: "bg-cream-100" },
  rejected: { text: "Rejected", color: "text-red-700",     bg: "bg-red-50" },
  registered:{ text: "Pending", color: "text-stone-400",   bg: "bg-cream-50" },
};

export default function MyCaterings() {
  const { user } = useAuth();
  const registrations = useQuery(api.registrations.getRegistrationsByUser, { userId: user._id });
  const payments = useQuery(api.payments.getPaymentsByUser, { userId: user._id });

  const pendingPayments = (payments || []).filter((p) => p.status === "pending");
  const totalPending = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">My Events</h2>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Your registrations and payment status.
        </p>
      </div>

      {/* Pending payment alert */}
      {pendingPayments.length > 0 && (
        <div className="bg-[#fdf8f3] border border-[#f5d0aa] rounded-2xl p-5 mb-6 animate-fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-[#a05020] shrink-0 mt-0.5" size={18} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[15px] text-[#8b3a00]">
                Payment Due — {formatCurrency(totalPending)}
              </p>
              <p className="text-[13px] text-[#a05020] font-medium mt-1">
                You have unpaid amounts from {pendingPayments.length} event{pendingPayments.length > 1 ? "s" : ""}.
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

      {/* Loading */}
      {registrations === undefined && (
        <div className="animate-pulse flex flex-col gap-3">
          {[1, 2].map((n) => <div key={n} className="h-36 bg-cream-100 rounded-2xl" />)}
        </div>
      )}

      {/* Empty */}
      {registrations !== undefined && registrations.length === 0 && (
        <div className="card text-center py-16">
          <CalendarDays size={40} className="mx-auto text-cream-300 mb-3" />
          <p className="font-semibold text-stone-600 text-[15px]">No registrations yet.</p>
          <p className="text-stone-400 text-[13.5px] mt-1 mb-6">Find an upcoming event and register.</p>
          <Link to="/">
            <button className="btn-primary py-2.5 px-5 text-[14px]">
              Browse Events <ArrowRight size={15} />
            </button>
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {(registrations || []).map((reg) => {
          const relatedPayments = (payments || []).filter((p) => p.cateringId === reg.cateringId);
          const attendance = ATTENDANCE_LABEL[reg.status] || ATTENDANCE_LABEL.registered;

          return (
            <div key={reg._id} className="card bg-white p-5">
              {/* Header */}
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="min-w-0">
                  <Link to={`/catering/${reg.cateringId}`} className="hover:underline underline-offset-2 decoration-cream-400">
                    <h3 className="font-bold text-[16px] text-stone-900 truncate">{reg.catering?.place}</h3>
                  </Link>
                  <p className="text-[13px] font-medium text-stone-500 mt-0.5 flex items-center gap-1.5">
                    <CalendarDays size={13} />
                    {reg.catering
                      ? reg.catering.isTwoDay
                        ? `${formatDate(reg.catering.dates[0])} – ${formatDate(reg.catering.dates[1])}`
                        : formatDate(reg.catering.dates[0])
                      : ""}
                  </p>
                </div>
                {reg.catering && (
                  <span className={`${getStatusBadgeClass(reg.catering.status)} shrink-0`}>
                    {getStatusLabel(reg.catering.status)}
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <StatBox label="Role" value={getRoleLabel(reg.role)} />
                <StatBox
                  label="Spot"
                  value={reg.isConfirmed ? "Confirmed" : `Waitlist #${reg.queuePosition}`}
                  green={reg.isConfirmed}
                />
                <StatBox label="Drop Point" value={reg.dropPoint} />
                <div className="bg-cream-50 border border-cream-100 rounded-xl px-3 py-2.5">
                  <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Attendance</p>
                  <span className={`text-[12.5px] font-bold px-2 py-0.5 rounded-md ${attendance.bg} ${attendance.color}`}>
                    {attendance.text}
                  </span>
                </div>
              </div>

              {/* Rejection reason */}
              {reg.status === "rejected" && reg.rejectionReason && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5 mb-4 text-[13px]">
                  <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="font-medium text-red-700">Reason: {reg.rejectionReason}</p>
                </div>
              )}

              {/* Payments */}
              {relatedPayments.length > 0 && (
                <div className="pt-3 border-t border-cream-100 flex flex-col gap-2">
                  {relatedPayments.map((p) => (
                    <div key={p._id} className="flex justify-between items-center text-[13.5px]">
                      <span className="font-medium text-stone-600">
                        Payment · {getRoleLabel(p.role)}
                      </span>
                      <span className={`flex items-center gap-1.5 font-bold ${
                        p.status === "cleared" ? "text-[#1a5c3a]" : "text-[#8b3a00]"
                      }`}>
                        {p.status === "cleared"
                          ? <CheckCircle2 size={14} />
                          : <Clock size={14} />}
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

function StatBox({ label, value, green }) {
  return (
    <div className="bg-cream-50 border border-cream-100 rounded-xl px-3 py-2.5">
      <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-[13px] font-bold ${green ? "text-[#1a5c3a]" : "text-stone-800"}`}>{value}</p>
    </div>
  );
}
