import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { formatDate, formatCurrency, getRoleLabel } from "../../lib/helpers";
import { CalendarDays, CheckCircle2, Clock, XCircle, Ban, TrendingUp, IndianRupee, UserCheck } from "lucide-react";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import EmptyState from "../../components/shared/EmptyState";

export default function History() {
  const { user, token } = useAuth();
  const registrationsRaw = useQuery(api.registrations.getRegistrationsByUser, 
    user ? { userId: user._id, token } : "skip"
  );
  const paymentsRaw = useQuery(api.payments.getPaymentsByUser, 
    user ? { userId: user._id, token } : "skip"
  );
  const { data: registrations, timedOut: regTimeout } = useQueryWithTimeout(registrationsRaw);
  const { data: payments, timedOut: payTimeout } = useQueryWithTimeout(paymentsRaw);

  if (regTimeout || payTimeout) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const regs = registrations || [];
  const pays = payments || [];

  const stats = {
    total:     regs.length,
    attended:  regs.filter((r) => r.status === "attended").length,
    absent:    regs.filter((r) => r.status === "absent").length,
    rejected:  regs.filter((r) => r.status === "rejected").length,
    pending:   regs.filter((r) => r.status === "registered").length,
    earned:    pays.filter((p) => p.status === "cleared").reduce((s, p) => s + p.amount, 0),
    outstanding: pays.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0),
    payRecords: pays.length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">History</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">A full record of your activity.</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard icon={<UserCheck size={14} />} label="Attended"    value={stats.attended} />
        <StatCard icon={<Clock size={14} />}     label="Absent"      value={stats.absent} />
        <StatCard icon={<XCircle size={14} />}   label="Rejected"    value={stats.rejected} />
        <StatCard icon={<CalendarDays size={14} />} label="Upcoming" value={stats.pending} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1">
            <IndianRupee size={11} /> Total Paid
          </p>
          <p className="text-[22px] font-black text-[#1a5c3a]">{formatCurrency(stats.earned)}</p>
        </div>
        <div className="bg-[#fdf0e6] border border-[#f5d0aa] rounded-xl p-4">
          <p className="text-[10.5px] font-bold text-[#a05020] uppercase tracking-widest mb-1 flex items-center gap-1">
            <Clock size={11} /> Outstanding
          </p>
          <p className="text-[22px] font-black text-[#8b3a00]">{formatCurrency(stats.outstanding)}</p>
        </div>
      </div>

      {/* Full timeline */}
      {registrations === undefined && (
        <LoadingState rows={3} />
      )}

      {regs.length === 0 && registrations !== undefined && (
        <EmptyState 
          icon={TrendingUp} 
          title="No history yet" 
          description="Register for an event to get started and see your history here." 
        />
      )}

      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
        {regs.map((reg, idx) => {
          const relatedPays = pays.filter((p) => p.cateringId === reg.cateringId);
          const totalPay = relatedPays.reduce((s, p) => s + p.amount, 0);
          const cleared  = relatedPays.filter((p) => p.status === "cleared").reduce((s, p) => s + p.amount, 0);
          const pending  = relatedPays.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);

          const STATUS_STYLE = {
            attended:   { label: "Attended",  cls: "bg-[#e8f5ee] text-[#1a5c3a]" },
            absent:     { label: "Absent",    cls: "bg-cream-100 text-stone-600" },
            rejected:   { label: "Rejected",  cls: "bg-red-50 text-red-700" },
            registered: { label: "Upcoming",  cls: "bg-cream-50 text-stone-400" },
          };
          const st = STATUS_STYLE[reg.status] || STATUS_STYLE.registered;

          return (
            <div
              key={reg._id}
              className={`px-5 py-4 ${idx !== regs.length - 1 ? "border-b border-cream-100" : ""} hover:bg-cream-50/50 transition-colors`}
            >
              <div className="flex justify-between items-start gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-bold text-[14.5px] text-stone-900 truncate">{reg.catering?.place || "Event"}</p>
                  <p className="text-[12.5px] font-medium text-stone-500 flex items-center gap-1.5 mt-0.5">
                    <CalendarDays size={12} />
                    {reg.catering
                      ? formatDate(reg.catering.date)
                      : ""}
                  </p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 ${st.cls}`}>{st.label}</span>
              </div>

              {/* Details row */}
              <div className="flex flex-wrap gap-2 text-[12px] mt-2">
                <Tag>{getRoleLabel(reg.role)}</Tag>
                <Tag>{reg.isConfirmed ? "Confirmed" : `Waitlist #${reg.queuePosition}`}</Tag>
                <Tag>{reg.dropPoint}</Tag>
              </div>

              {/* Rejection reason */}
              {reg.status === "rejected" && reg.rejectionReason && (
                <p className="text-[12px] text-red-600 font-medium mt-2 flex items-center gap-1.5">
                  <XCircle size={13} /> {reg.rejectionReason}
                </p>
              )}

              {/* Payments */}
              {relatedPays.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-cream-100 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px]">
                  {cleared > 0 && (
                    <span className="font-semibold text-[#1a5c3a] flex items-center gap-1">
                      <CheckCircle2 size={13} /> Paid {formatCurrency(cleared)}
                    </span>
                  )}
                  {pending > 0 && (
                    <span className="font-semibold text-[#8b3a00] flex items-center gap-1">
                      <Clock size={13} /> Pending {formatCurrency(pending)}
                    </span>
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

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-sm">
      <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">{icon}{label}</p>
      <p className="text-[22px] font-black text-stone-800">{value}</p>
    </div>
  );
}

function Tag({ children }) {
  return (
    <span className="bg-cream-50 border border-cream-200 text-stone-600 font-semibold px-2 py-0.5 rounded-md">
      {children}
    </span>
  );
}
