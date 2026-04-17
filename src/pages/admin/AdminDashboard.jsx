import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { formatCurrency, formatDate, getRoleLabel } from "../../lib/helpers";
import { useState } from "react";
import { Plus, UserCheck, CreditCard, AlertCircle, BarChart3, TrendingUp, CalendarDays, Users } from "lucide-react";

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
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Admin Dashboard</h2>
          <p className="text-[14.5px] text-stone-500 font-medium mt-1">
            {user?.role === "admin" ? "Admin" : "Sub-Admin"} <span className="mx-1">•</span> {user?.name}
          </p>
        </div>
        {user?.role === "admin" && (
          <button className="btn-primary py-2.5 px-4 text-[14px]" onClick={() => navigate("/admin/create-catering")}>
            <Plus size={16} /> New Event
          </button>
        )}
      </div>

      {/* Active Events */}
      <div className="mb-10">
        <h3 className="section-title mb-4">Active Events</h3>
        {activeCaterings.length === 0 && (
          <p className="text-[14.5px] text-stone-500 bg-cream-50 border border-cream-200 rounded-xl p-4 text-center font-medium">
            No active events.
          </p>
        )}
        <div className="flex flex-col gap-3">
          {activeCaterings.map((c) => (
            <div
              key={c._id}
              className="card bg-white p-5 hover:border-stone-300 card-hover cursor-pointer"
              onClick={() => navigate(`/catering/${c._id}`)}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <p className="font-bold text-[16px] text-stone-900">{c.place}</p>
                  <p className="text-[13.5px] font-medium text-stone-500 mt-1">
                    {c.isTwoDay
                      ? `${formatDate(c.dates[0])} – ${formatDate(c.dates[1])}`
                      : formatDate(c.dates[0])}
                    <span className="mx-1.5">•</span>{c.specificTime}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-secondary py-1.5 px-3 text-[12px]"
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/catering/${c._id}/attendance`); }}
                  >
                    <UserCheck size={14} /> Attendance
                  </button>
                  <button
                    className="btn-secondary py-1.5 px-3 text-[12px]"
                    onClick={(e) => { e.stopPropagation(); navigate(`/admin/catering/${c._id}/payments`); }}
                  >
                    <CreditCard size={14} /> Payments
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Payments Alert */}
      {pendingPayments !== undefined && pendingPayments.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="section-title !mb-0 text-[#8b3a00]">Pending Payments</h3>
            <span className="bg-[#fdf0e6] text-[#8b3a00] border border-[#f5d0aa] text-[11px] font-bold px-2 py-0.5 rounded-full">
              {pendingPayments.length}
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            {Object.values(byUser).map(({ user: u, payments }) => {
              const total = payments.reduce((sum, p) => sum + p.amount, 0);
              return (
                <div key={u?._id} className="card bg-white p-5 border-[#f5d0aa] bg-[#fdf0e6]/20">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="font-bold text-[15.5px] text-stone-900">{u?.name}</p>
                      <p className="text-[13px] font-medium text-stone-500">{u?.phone}</p>
                    </div>
                    <p className="font-black text-[18px] text-[#8b3a00] bg-[#fdf0e6] px-3 py-1 rounded-lg border border-[#f5d0aa]">
                      {formatCurrency(total)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {payments.map((p) => (
                      <div key={p._id} className="flex justify-between items-center text-[13px] text-stone-600 pt-2 border-t border-[#f5d0aa]/50">
                        <span className="font-medium">{p.catering?.place} <span className="mx-1">•</span> {getRoleLabel(p.role)}</span>
                        <span className="font-bold text-stone-800">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn-secondary w-full py-2.5 mt-4 text-[13px] bg-white border-[#f5d0aa] hover:bg-[#fdf0e6] text-[#8b3a00]"
                    onClick={() => navigate(`/admin/catering/${payments[0].cateringId}/payments`)}
                  >
                    Resolve Payments
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="section-title !mb-0 flex items-center gap-2"><BarChart3 size={18} className="text-stone-400"/> Monthly Summary</h3>
          <div className="flex gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-white border border-cream-200 text-stone-700 text-[13px] font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-stone-800/10 cursor-pointer"
            >
              {monthNames.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="bg-white border border-cream-200 text-stone-700 text-[13px] font-medium rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-stone-800/10 cursor-pointer"
            >
              {[2024, 2025, 2026].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {analytics ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard icon={<CalendarDays size={14}/>} label="Events" value={analytics.totalCaterings} />
            <StatCard icon={<Users size={14}/>} label="Students" value={analytics.uniqueStudents} />
            <StatCard icon={<TrendingUp size={14}/>} label="Total Paid" value={formatCurrency(analytics.totalPayout)} />
            <StatCard icon={<CheckCircle2 size={14}/>} label="Cleared" value={analytics.paymentsCleared} />
            <StatCard icon={<AlertCircle size={14}/>} label="Pending" value={analytics.paymentsPending} highlight />
            <StatCard icon={<CreditCard size={14}/>} label="Amt Pending" value={formatCurrency(analytics.pendingPayout)} highlight />
          </div>
        ) : (
          <div className="animate-pulse flex gap-3">
            {[1,2,3].map(n => <div key={n} className="h-24 bg-cream-100 rounded-2xl flex-1"></div>)}
          </div>
        )}
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
        {value}
      </p>
    </div>
  );
}
