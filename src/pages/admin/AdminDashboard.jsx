import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { formatCurrency, formatDate, getRoleLabel, formatTime12h } from "../../lib/helpers";
import CustomSelect from "../../components/ui/CustomSelect";
import { useState } from "react";
import {
  Plus, UserCheck, CreditCard, AlertCircle, BarChart3,
  TrendingUp, CalendarDays, Users, IndianRupee, Clock, ArrowRight
} from "lucide-react";

import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import EmptyState from "../../components/shared/EmptyState";

export default function AdminDashboard() {
  const { user, token, permissions } = useAuth();
  const navigate = useNavigate();

  const canManageCaterings = user?.role === "admin" || permissions.some(p => p.permission === "manage_caterings" && p.enabled);
  const canManagePayments = user?.role === "admin" || permissions.some(p => p.permission === "manage_payments" && p.enabled);

  const cateringsRaw = useQuery(api.caterings.listCaterings, canManageCaterings ? { token } : "skip");
  const pendingPaymentsRaw = useQuery(api.payments.getPendingPayments, canManagePayments ? { token } : "skip");

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const analyticsRaw = useQuery(api.payments.getMonthlyAnalytics, canManagePayments ? { month, year, token } : "skip");

  const { data: caterings, timedOut: catTimeout } = useQueryWithTimeout(cateringsRaw);
  const { data: pendingPayments, timedOut: payTimeout } = useQueryWithTimeout(pendingPaymentsRaw);
  const { data: analytics, timedOut: anaTimeout } = useQueryWithTimeout(analyticsRaw);

  if (catTimeout || payTimeout || anaTimeout) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const activeCaterings = (caterings || []).filter(
    (c) => c.status === "today" || c.status === "tomorrow" || c.status === "upcoming"
  );

  const prefs = user?.adminPreferences || {
    showAnalytics: true,
    showPendingPayments: true,
    showActiveEvents: true,
  };

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
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Dashboard</h1>
          <p className="text-[14.5px] font-medium text-stone-500 mt-1">
            Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"},{" "}
            <span className="text-stone-900 font-bold">{user?.name?.split(" ")[0] || "Admin"}</span>.
          </p>
        </div>
        
        {canManagePayments && (
           <div className="flex bg-white border border-stone-200/60 rounded-2xl p-1 shadow-sm gap-1 self-start">
            <CustomSelect
              options={monthNames.map((m, i) => ({ label: m, value: i + 1 }))}
              value={month}
              onChange={setMonth}
              className="w-[90px] !border-0 !shadow-none !bg-transparent font-bold text-[13px]"
            />
            <div className="w-px h-5 bg-stone-200 self-center" />
            <CustomSelect
              options={[2024, 2025, 2026].map(y => ({ label: y.toString(), value: y }))}
              value={year}
              onChange={setYear}
              className="w-[90px] !border-0 !shadow-none !bg-transparent font-bold text-[13px]"
            />
          </div>
        )}
      </div>

      {canManagePayments && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<CalendarDays size={16}/>} label="Events" value={analytics?.totalCaterings} />
            <StatCard icon={<IndianRupee size={16}/>} label="Paid" value={formatCurrency(analytics?.totalPayout)} />
            <StatCard icon={<Clock size={16}/>} label="Unpaid" value={analytics?.paymentsPending} highlight />
            <StatCard icon={<TrendingUp size={16}/>} label="Balance" value={formatCurrency(analytics?.pendingPayout)} highlight />
          </div>

          {analytics && prefs.showAnalytics && (
            <div className="bg-white border border-stone-200/60 rounded-[28px] p-6 shadow-sm mb-8 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-[14px] font-black text-stone-900 flex items-center gap-2.5 uppercase tracking-wider">
                  <BarChart3 size={18} className="text-stone-400" /> Revenue & Trends
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#1a5c3a]" />
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">Cleared</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#f5d0aa]" />
                    <span className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">Pending</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Weekly Trends Graph */}
                <div className="lg:col-span-2">
                  <div className="flex items-end justify-between h-[160px] gap-3 px-2 border-b border-stone-100">
                    {analytics.weeklyTrends.map((t, i) => {
                      const max = Math.max(...analytics.weeklyTrends.map(x => x.payout + x.pending), 1000);
                      const payoutHeight = (t.payout / max) * 100;
                      const pendingHeight = (t.pending / max) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col justify-end gap-1 group relative h-full">
                          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none z-10 shadow-2xl font-black translate-y-2 group-hover:translate-y-0">
                            Total: ₹{t.payout + t.pending}
                          </div>
                          <div 
                            className="w-full bg-[#f5d0aa] rounded-t-md transition-all duration-700 delay-75 hover:brightness-95" 
                            style={{ height: `${pendingHeight}%` }} 
                          />
                          <div 
                            className="w-full bg-[#1a5c3a] rounded-t-md transition-all duration-700 hover:brightness-110" 
                            style={{ height: `${payoutHeight}%` }} 
                          />
                          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-black text-stone-400 uppercase tracking-tighter">W{t.week}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Health Metrics */}
                <div className="flex flex-col justify-center gap-6 bg-stone-50/50 p-6 rounded-[20px] border border-stone-100">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-stone-400 uppercase tracking-widest">Payout Efficiency</span>
                      <span className="text-[18px] font-black text-[#1a5c3a]">{Math.round((analytics.totalPayout / (analytics.totalPayout + analytics.pendingPayout || 1)) * 100)}%</span>
                    </div>
                    <div className="h-3 bg-stone-200/50 rounded-full overflow-hidden p-0.5">
                      <div 
                        className="h-full bg-gradient-to-r from-[#2d7a52] to-[#1a5c3a] rounded-full transition-all duration-1000 shadow-sm" 
                        style={{ width: `${(analytics.totalPayout / (analytics.totalPayout + analytics.pendingPayout || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-stone-200/60">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400">
                          <AlertCircle size={20} />
                       </div>
                       <div>
                          <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest">At Risk</p>
                          <p className="text-[15px] font-bold text-stone-800">{analytics.paymentsPending} items pending</p>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className={`grid grid-cols-1 ${canManageCaterings && canManagePayments ? "lg:grid-cols-2" : ""} gap-8`}>
        {/* Active Events */}
        {canManageCaterings && prefs.showActiveEvents && (
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[13px] font-black text-stone-400 uppercase tracking-[0.15em]">Live Events</h2>
              <button
                className="text-[11px] font-black text-stone-500 hover:text-stone-900 uppercase tracking-widest flex items-center gap-1.5 transition-all group"
                onClick={() => navigate("/admin/events")}
              >
                View Catalog <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {activeCaterings.length === 0 && (
              <EmptyState 
                icon={CalendarDays} 
                title="No active events" 
                description="Everything is currently completed or cancelled."
              />
            )}

            <div className="flex flex-col gap-3">
              {activeCaterings.map((c) => (
                <div 
                  key={c._id} 
                  className="bg-white border border-stone-200/60 rounded-2xl p-5 hover:border-stone-400 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
                  onClick={() => navigate(`/catering/${c._id}`)}
                >
                  <div className="flex justify-between items-start gap-4 relative z-10">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                         <p className="font-black text-[17px] text-stone-900 truncate tracking-tight">{c.place}</p>
                         <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                           c.status === 'today' ? 'bg-[#1a5c3a] text-white border-[#1a5c3a]' : 'bg-stone-100 text-stone-500 border-stone-200'
                         }`}>
                           {c.status}
                         </span>
                      </div>
                      <p className="text-[13px] font-bold text-stone-500">
                        {formatDate(c.date)}
                        <span className="mx-2 text-stone-300">|</span>{formatTime12h(c.specificTime)}
                      </p>
                      
                      <div className="flex gap-4 mt-4">
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Registered</span>
                           <span className="text-[15px] font-black text-stone-800">{c.registeredCount || 0}</span>
                        </div>
                        <div className="w-px h-6 bg-stone-100 self-end mb-1" />
                        <div className="flex flex-col">
                           <span className="text-[9px] font-black text-[#1a5c3a] uppercase tracking-widest">Verified</span>
                           <span className="text-[15px] font-black text-[#1a5c3a]">{c.verifiedCount || 0}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white hover:shadow-md transition-all active:scale-95"
                        onClick={() => navigate(`/admin/catering/${c._id}/attendance`)}
                        title="Attendance"
                      >
                        <UserCheck size={18} />
                      </button>
                      <button
                        className="w-10 h-10 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-center text-stone-500 hover:text-stone-900 hover:bg-white hover:shadow-md transition-all active:scale-95"
                        onClick={() => navigate(`/admin/catering/${c._id}/payments`)}
                        title="Payments"
                      >
                        <CreditCard size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Payments */}
        {canManagePayments && prefs.showPendingPayments && (
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2 mb-4 px-1">
              <h2 className="text-[13px] font-black text-stone-400 uppercase tracking-[0.15em]">Pending Payouts</h2>
              {pendingPayments && pendingPayments.length > 0 && (
                <span className="bg-[#8b3a00] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-orange-100/50">
                  {pendingPayments.length}
                </span>
              )}
            </div>

            {pendingPayments?.length === 0 && (
              <EmptyState 
                icon={UserCheck} 
                title="Clear balance" 
                description="No students are currently awaiting payment."
              />
            )}

            <div className="flex flex-col gap-3">
              {Object.values(byUser).map(({ user: u, payments }) => {
                const total = payments.reduce((sum, p) => sum + p.amount, 0);
                return (
                  <div key={u?._id} className="bg-gradient-to-br from-[#fffdfa] to-[#fdf8f3] border border-[#f5d0aa] rounded-[24px] p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white border border-[#f5d0aa] flex items-center justify-center text-[#8b3a00]">
                            <Users size={20} />
                         </div>
                         <div>
                            <p className="font-black text-[16px] text-stone-900 tracking-tight leading-none">{u?.name}</p>
                            <p className="text-[12px] font-bold text-[#a05020]/60 mt-1.5 uppercase tracking-wide">{u?.phone}</p>
                         </div>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-[#f5d0aa] shadow-sm">
                        <p className="font-black text-[18px] text-[#8b3a00] leading-none">{formatCurrency(total)}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {payments.map((p) => (
                        <div key={p._id} className="flex justify-between items-center text-[12px] py-1.5 border-t border-[#f5d0aa]/40">
                          <span className="font-bold text-stone-500 uppercase tracking-tighter">{p.catering?.place} · {getRoleLabel(p.role)}</span>
                          <span className="font-black text-stone-800">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      className="w-full py-3 text-[12.5px] font-black text-white bg-[#8b3a00] rounded-xl hover:bg-[#722f00] transition-all shadow-lg shadow-orange-100/50 active:scale-95"
                      onClick={() => {
                        if (payments && payments.length > 0) {
                          navigate(`/admin/catering/${payments[0].cateringId}/payments`);
                        }
                      }}
                    >
                      Resolve All
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, icon }) {
  return (
    <div className={`p-5 rounded-2xl border flex flex-col justify-center transition-all duration-500 hover:shadow-xl hover:-translate-y-1 relative overflow-hidden group ${
      highlight 
        ? "bg-gradient-to-br from-[#fffdfa] to-[#fdf0e6] border-[#f5d0aa] shadow-orange-100/50" 
        : "bg-white border-stone-200/60 shadow-stone-100/40"
    }`}>
      {/* Decorative background element */}
      <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-[0.03] transition-transform duration-700 group-hover:scale-150 ${
        highlight ? "bg-[#8b3a00]" : "bg-stone-900"
      }`} />
      
      <p className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] mb-2.5 ${
        highlight ? "text-[#a05020]/70" : "text-stone-400"
      }`}>
        <span className={`${highlight ? "text-[#8b3a00]" : "text-stone-300"}`}>{icon}</span>
        {label}
      </p>
      
      <p className={`text-[26px] font-black tracking-tight leading-none ${
        highlight ? "text-[#8b3a00]" : "text-stone-900"
      }`}>
        {value ?? "—"}
      </p>

      <div className={`mt-2 h-1 w-8 rounded-full transition-all duration-500 group-hover:w-12 ${
        highlight ? "bg-[#f5d0aa]" : "bg-stone-100"
      }`} />
    </div>
  );
}
