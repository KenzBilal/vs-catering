import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { formatCurrency, formatDate, getRoleLabel, formatTime12h } from "../../lib/helpers";
import CustomSelect from "../../components/ui/CustomSelect";
import { useState } from "react";
import {
  Plus, UserCheck, CreditCard, AlertCircle, BarChart3,
  TrendingUp, CalendarDays, Users, IndianRupee, Clock, ArrowRight, PlayCircle
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
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"},{" "}
          {user?.name?.split(" ")[0] || "Admin"}.
        </p>
      </div>

      {canManagePayments && (
        <>
          <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-[13px] font-bold text-stone-400 uppercase tracking-widest">
              Overview
            </h2>
            <div className="flex bg-white border border-cream-200 rounded-2xl p-1 shadow-sm gap-1">
              <CustomSelect
                options={monthNames.map((m, i) => ({ label: m, value: i + 1 }))}
                value={month}
                onChange={setMonth}
                className="w-[90px]"
              />
              <div className="w-px h-6 bg-cream-200 self-center" />
              <CustomSelect
                options={[2024, 2025, 2026].map(y => ({ label: y.toString(), value: y }))}
                value={year}
                onChange={setYear}
                className="w-[90px]"
              />
            </div>
          </div>

          {analytics ? (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <StatCard icon={<CalendarDays size={14}/>} label="Events" value={analytics.totalCaterings} />
                <StatCard icon={<IndianRupee size={14}/>} label="Total Paid Out" value={formatCurrency(analytics.totalPayout)} />
                <StatCard icon={<Clock size={14}/>} label="Pending" value={analytics.paymentsPending} highlight />
                <StatCard icon={<TrendingUp size={14}/>} label="Amt Pending" value={formatCurrency(analytics.pendingPayout)} highlight />
              </div>

              {/* Graph Version (Visual Insights) */}
              {prefs.showAnalytics && (
                <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm mb-8 animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[13px] font-bold text-stone-800 flex items-center gap-2">
                      <BarChart3 size={16} className="text-stone-400" /> Data Insights
                    </h3>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest bg-cream-50 px-2 py-1 rounded-md">Live Trends</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Payout Trend Graph (CSS Bars) */}
                    <div>
                      <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <TrendingUp size={12} /> Weekly Payout Volume
                      </p>
                      <div className="flex items-end justify-between h-[120px] gap-2 px-2 border-b border-cream-100">
                        {analytics.weeklyTrends.map((t, i) => {
                          const max = Math.max(...analytics.weeklyTrends.map(x => x.payout + x.pending), 1000);
                          const payoutHeight = (t.payout / max) * 100;
                          const pendingHeight = (t.pending / max) * 100;
                          return (
                            <div key={i} className="flex-1 flex flex-col justify-end gap-0.5 group relative">
                              {/* Tooltip */}
                              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-stone-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-xl font-bold">
                                ₹{t.payout + t.pending} (Week {t.week})
                              </div>
                              <div className="w-full bg-[#f5d0aa] rounded-t-sm transition-all duration-500 hover:brightness-95" style={{ height: `${pendingHeight}%` }} />
                              <div className="w-full bg-[#1a5c3a] rounded-t-sm transition-all duration-500 hover:brightness-110" style={{ height: `${payoutHeight}%` }} />
                              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-stone-400">W{t.week}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Payment Health (Donut / Progress) */}
                    <div>
                      <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <CreditCard size={12} /> Payment Completion
                      </p>
                      <div className="flex flex-col gap-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-[#1a5c3a]">Cleared</span>
                            <span className="text-stone-400">{Math.round((analytics.totalPayout / (analytics.totalPayout + analytics.pendingPayout || 1)) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#1a5c3a] transition-all duration-1000" 
                              style={{ width: `${(analytics.totalPayout / (analytics.totalPayout + analytics.pendingPayout || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-[#8b3a00]">Pending</span>
                            <span className="text-stone-400">{Math.round((analytics.pendingPayout / (analytics.totalPayout + analytics.pendingPayout || 1)) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-[#f5d0aa] transition-all duration-1000" 
                              style={{ width: `${(analytics.pendingPayout / (analytics.totalPayout + analytics.pendingPayout || 1)) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <LoadingState rows={2} />
          )}
        </>
      )}

      <div className={`grid grid-cols-1 ${canManageCaterings && canManagePayments ? "lg:grid-cols-2" : ""} gap-6`}>
        {/* Active Events */}
        {canManageCaterings && prefs.showActiveEvents && (
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
              <EmptyState 
                icon={CalendarDays} 
                title="No active events" 
                description="There are no events currently today, tomorrow, or upcoming."
              />
            )}

            <div className="flex flex-col gap-2">
              {activeCaterings.map((c) => (
                <div 
                  key={c._id} 
                  className="bg-white border border-cream-200 rounded-xl p-4 hover:border-stone-300 hover:shadow-sm transition-all cursor-pointer group"
                  onClick={() => navigate(`/catering/${c._id}`)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[14.5px] text-stone-900 truncate group-hover:text-stone-800 transition-colors">{c.place}</p>
                      <p className="text-[12.5px] font-medium text-stone-500 mt-0.5">
                        {c.isTwoDay
                          ? `${formatDate(c.dates[0])} – ${formatDate(c.dates[1])}`
                          : formatDate(c.dates[0])}
                        <span className="mx-1.5">·</span>{formatTime12h(c.specificTime)}
                      </p>
                      <div className="flex gap-2.5 mt-2">
                        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                          Reg: <span className="text-stone-700">{c.registeredCount || 0}</span>
                        </span>
                        <span className="text-[10px] font-bold text-[#1a5c3a] uppercase tracking-wider flex items-center gap-1">
                          Ver: <span className="text-[#1a5c3a] font-black">{c.verifiedCount || 0}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {(() => {
                        const eventDate = new Date(c.dates[0] + "T" + c.specificTime);
                        const now = new Date();
                        const diffHours = (eventDate - now) / (1000 * 60 * 60);
                        const isNear = diffHours <= 48 && c.status !== "ended" && c.status !== "cancelled";
                        
                        if (isNear && !c.attendanceStarted) {

                          return (
                            <button
                              className={`p-1.5 rounded-lg border transition-all ${
                                c.verificationStatus === "active"
                                  ? "bg-[#e8f5ee] border-[#1a5c3a]/20 text-[#1a5c3a]"
                                  : "bg-stone-900 border-stone-900 text-white"
                              }`}
                              onClick={() => navigate(`/catering/${c._id}`)}
                              title={c.verificationStatus === "active" ? "Verification Active" : "Start Verification"}
                            >
                              <PlayCircle size={14} />
                            </button>
                          );
                        }

                        return null;
                      })()}
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
        )}

        {/* Pending Payments */}
        {canManagePayments && prefs.showPendingPayments && (
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
              <EmptyState 
                icon={UserCheck} 
                title="All clear" 
                description="There are no pending payments to be resolved."
              />
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
                      onClick={() => {
                        if (payments && payments.length > 0) {
                          navigate(`/admin/catering/${payments[0].cateringId}/payments`);
                        }
                      }}
                    >
                      Resolve
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
