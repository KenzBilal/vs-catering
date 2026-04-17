import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { formatCurrency, formatDate, getRoleLabel } from "../../lib/helpers";
import { useState } from "react";
import {
  Plus, UserCheck, CreditCard, AlertCircle, BarChart3,
  TrendingUp, CalendarDays, Users, IndianRupee, Clock, ArrowRight
} from "lucide-react";

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

  const byUser = {};
  (pendingPayments || []).forEach((p) => {
    const key = p.userId;
    if (!byUser[key]) byUser[key] = { user: p.user, payments: [] };
    byUser[key].payments.push(p);
  });

  const monthNames = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"},{" "}
          {user?.name.split(" ")[0]}.
        </p>
      </div>

      {/* Analytics Strip */}
      <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold text-stone-400 uppercase tracking-widest">
          Monthly Overview
        </h2>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-white border border-cream-200 text-stone-700 text-[12px] font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-stone-800/10 cursor-pointer"
          >
            {monthNames.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-white border border-cream-200 text-stone-700 text-[12px] font-semibold rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-stone-800/10 cursor-pointer"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {analytics ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <StatCard icon={<CalendarDays size={14}/>} label="Events" value={analytics.totalCaterings} />
          <StatCard icon={<Users size={14}/>} label="Students Paid" value={analytics.uniqueStudents} />
          <StatCard icon={<IndianRupee size={14}/>} label="Total Paid Out" value={formatCurrency(analytics.totalPayout)} />
          <StatCard icon={<UserCheck size={14}/>} label="Cleared" value={analytics.paymentsCleared} />
          <StatCard icon={<Clock size={14}/>} label="Pending" value={analytics.paymentsPending} highlight />
          <StatCard icon={<TrendingUp size={14}/>} label="Amt Pending" value={formatCurrency(analytics.pendingPayout)} highlight />
        </div>
      ) : (
        <div className="animate-pulse grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[1,2,3,4,5,6].map(n => <div key={n} className="h-20 bg-cream-100 rounded-xl" />)}
        </div>
      )}

      {/* Two columns: active events + pending payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Events */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-bold text-stone-400 uppercase tracking-widest">Active Events</h2>
            <button
              className="text-[12px] font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 transition-colors"
              onClick={() => navigate("/admin/events")}
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          {activeCaterings.length === 0 && (
            <div className="bg-white border border-cream-200 rounded-xl p-6 text-center">
              <CalendarDays size={28} className="mx-auto text-cream-300 mb-2" />
              <p className="text-[13px] font-medium text-stone-400">No active events right now.</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {activeCaterings.map((c) => (
              <div key={c._id} className="bg-white border border-cream-200 rounded-xl p-4 hover:border-stone-300 transition-colors">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-[14.5px] text-stone-900 truncate">{c.place}</p>
                    <p className="text-[12.5px] font-medium text-stone-500 mt-0.5">
                      {c.isTwoDay
                        ? `${formatDate(c.dates[0])} – ${formatDate(c.dates[1])}`
                        : formatDate(c.dates[0])}
                      <span className="mx-1.5">·</span>{c.specificTime}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      className="p-1.5 rounded-lg bg-cream-50 border border-cream-200 text-stone-500 hover:text-stone-900 hover:bg-cream-100 transition-colors"
                      onClick={() => navigate(`/admin/catering/${c._id}/attendance`)}
                      title="Attendance"
                    >
                      <UserCheck size={14} />
                    </button>
                    <button
                      className="p-1.5 rounded-lg bg-cream-50 border border-cream-200 text-stone-500 hover:text-stone-900 hover:bg-cream-100 transition-colors"
                      onClick={() => navigate(`/admin/catering/${c._id}/payments`)}
                      title="Payments"
                    >
                      <CreditCard size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Payments */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-[13px] font-bold text-stone-400 uppercase tracking-widest">Pending Payments</h2>
            {pendingPayments && pendingPayments.length > 0 && (
              <span className="bg-[#fdf0e6] text-[#8b3a00] border border-[#f5d0aa] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingPayments.length}
              </span>
            )}
          </div>

          {pendingPayments?.length === 0 && (
            <div className="bg-white border border-cream-200 rounded-xl p-6 text-center">
              <UserCheck size={28} className="mx-auto text-[#b8dfc8] mb-2" />
              <p className="text-[13px] font-medium text-stone-400">All payments cleared.</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {Object.values(byUser).map(({ user: u, payments }) => {
              const total = payments.reduce((sum, p) => sum + p.amount, 0);
              return (
                <div key={u?._id} className="bg-[#fdf8f3] border border-[#f5d0aa] rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-bold text-[14.5px] text-stone-900">{u?.name}</p>
                      <p className="text-[12px] font-medium text-stone-500">{u?.phone}</p>
                    </div>
                    <p className="font-black text-[16px] text-[#8b3a00]">{formatCurrency(total)}</p>
                  </div>
                  {payments.map((p) => (
                    <div key={p._id} className="flex justify-between text-[12px] text-stone-500 pt-1.5 border-t border-[#f5d0aa]/60 mt-1.5">
                      <span className="font-medium">{p.catering?.place} · {getRoleLabel(p.role)}</span>
                      <span className="font-bold text-stone-700">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                  <button
                    className="mt-3 w-full py-1.5 text-[12px] font-semibold text-[#8b3a00] bg-white border border-[#f5d0aa] rounded-lg hover:bg-[#fdf0e6] transition-colors"
                    onClick={() => navigate(`/admin/catering/${payments[0].cateringId}/payments`)}
                  >
                    Resolve
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, icon }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col justify-center shadow-sm ${
      highlight ? "bg-[#fdf0e6] border-[#f5d0aa]" : "bg-white border-cream-200"
    }`}>
      <p className={`flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-widest mb-1.5 ${
        highlight ? "text-[#a05020]" : "text-stone-400"
      }`}>
        {icon} {label}
      </p>
      <p className={`text-[22px] font-black tracking-tight ${
        highlight ? "text-[#8b3a00]" : "text-stone-800"
      }`}>
        {value ?? "—"}
      </p>
    </div>
  );
}
