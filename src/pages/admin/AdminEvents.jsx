import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { formatDate, formatCurrency, getStatusBadgeClass, getStatusLabel, getRoleLabel, formatTime12h } from "../../lib/helpers";
import { useState } from "react";
import { Plus, Search, UserCheck, CreditCard, CalendarDays, Clock, Users, Edit, XCircle, AlertTriangle, PlayCircle } from "lucide-react";

import { useAuth } from "../../lib/AuthContext";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import EmptyState from "../../components/shared/EmptyState";
import ConfirmModal from "../../components/shared/ConfirmModal";
import toast from "react-hot-toast";


const STATUS_FILTERS = ["All", "Upcoming", "Today", "Tomorrow", "Ended"];

export default function AdminEvents() {
  const { user, token, permissions } = useAuth();
  const navigate = useNavigate();

  const canManageCaterings = user?.role === "admin" || permissions.some(p => p.permission === "manage_caterings" && p.enabled);
  const canMarkAttendance = user?.role === "admin" || permissions.some(p => p.permission === "mark_attendance" && p.enabled);
  const canManagePayments = user?.role === "admin" || permissions.some(p => p.permission === "manage_payments" && p.enabled);
  const cateringsRaw = useQuery(api.caterings.listCaterings, { token });
  const { data: caterings, timedOut } = useQueryWithTimeout(cateringsRaw);
  const cancelCatering = useMutation(api.caterings.cancelCatering);

  if (timedOut) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [confirmCancel, setConfirmCancel] = useState(null); // cateringId
  const [cancelling, setCancelling] = useState(false);


  const filtered = (caterings || []).filter((c) => {
    const matchesSearch = c.place.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || c.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleCancel = async (cateringId) => {
    setCancelling(true);
    try {
      await cancelCatering({ cateringId, token });
      setConfirmCancel(null);
      toast.success("Cancelled");
    } catch (e) {
      const msg = e.data || e.message.replace(/^ConvexError: \[.*?\] /, "").replace(/^ConvexError: /, "");
      toast.error(msg || "Failed to cancel");
    } finally {

      setCancelling(false);
    }

  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Events</h1>
          <p className="text-[14px] font-medium text-stone-500 mt-1">
            {caterings?.length ?? "—"} total events
          </p>
        </div>
        {canManageCaterings && (
          <button
            className="btn-primary py-2.5 px-4 text-[14px] self-start sm:self-auto"
            onClick={() => navigate("/admin/events/create")}
          >
            <Plus size={16} /> New Event
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input
            type="text"
            placeholder="Search by venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-all duration-150 active:scale-95 ${
                statusFilter === f
                  ? "bg-stone-900 text-cream-50 shadow-sm"
                  : "bg-white text-stone-500 border border-cream-200 hover:bg-cream-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {caterings === undefined && (
        <LoadingState rows={3} />
      )}

      {/* Empty */}
      {caterings !== undefined && filtered.length === 0 && (
        <EmptyState 
          icon={CalendarDays} 
          title="No events found" 
          description={search ? "Try a different search term or filter." : "There are no events matching your current filter."}
        />
      )}

      {/* Event list */}
      <div className="flex flex-col gap-3">
        {filtered.map((c) => {
          const totalSlots = c.slots
            .filter((s) => s.day === 0)
            .reduce((sum, s) => sum + s.limit, 0);

          return (
            <div key={c._id} className="card bg-white p-5 hover:border-stone-300 transition-all duration-150">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold text-[16px] text-stone-900 truncate">{c.place}</h3>
                    <span className={`${getStatusBadgeClass(c.status)} shrink-0`}>
                      {getStatusLabel(c.status)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-[13px] font-medium text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={14} />
                      {c.isTwoDay
                        ? `${formatDate(c.dates[0])} – ${formatDate(c.dates[1])}`
                        : formatDate(c.dates[0])}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} /> {formatTime12h(c.specificTime)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={14} /> {totalSlots} slots
                    </span>
                    <div className="flex gap-3 ml-2 border-l border-cream-200 pl-4">
                      <span className="flex items-center gap-1">
                        <span className="text-stone-400 font-bold uppercase text-[10px]">Reg:</span>
                        <span className="text-stone-800 font-bold">{c.registeredCount || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-[#1a5c3a] font-bold uppercase text-[10px]">Ver:</span>
                        <span className="text-[#1a5c3a] font-black">{c.verifiedCount || 0}</span>
                      </span>
                    </div>
                  </div>


                  {/* Role pay summary */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {c.slots
                      .filter((s) => s.day === 0 && s.limit > 0)
                      .map((s, i) => (
                        <span
                          key={i}
                          className="text-[11.5px] font-semibold bg-cream-50 border border-cream-200 text-stone-600 px-2.5 py-1 rounded-lg"
                        >
                          {getRoleLabel(s.role)} · {formatCurrency(s.pay)}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap sm:flex-nowrap shrink-0">

                  {(() => {
                    const eventDate = new Date(c.dates[0] + "T" + c.specificTime);
                    const now = new Date();
                    const diffHours = (eventDate - now) / (1000 * 60 * 60);
                    const isNear = diffHours <= 48 && c.status !== "ended" && c.status !== "cancelled";
                    
                    if (isNear && !c.attendanceStarted) {
                      return (
                        <button
                          className={`btn-secondary py-1.5 px-3 text-[12px] flex items-center gap-1.5 ${
                            c.verificationStatus === "active" ? "bg-[#e8f5ee] text-[#1a5c3a] border-[#1a5c3a]/20" : "bg-stone-900 text-white border-stone-900 hover:bg-stone-800"
                          }`}
                          onClick={() => navigate(`/catering/${c._id}`)}
                        >
                          <PlayCircle size={14} /> {c.verificationStatus === "active" ? "Re-verify" : "Verify"}
                        </button>
                      );
                    }
                    return null;
                  })()}
                  {c.status !== "cancelled" && c.status !== "ended" && !c.attendanceStarted && canManageCaterings && (
                    <button
                      className="btn-secondary py-1.5 px-3 text-[12px]"
                      onClick={() => navigate(`/admin/catering/${c._id}/edit`)}
                    >
                      <Edit size={14} /> Edit
                    </button>
                  )}
                  {canMarkAttendance && (
                    <button
                      className="btn-secondary py-1.5 px-3 text-[12px]"
                      onClick={() => navigate(`/admin/catering/${c._id}/attendance`)}
                    >
                      <UserCheck size={14} /> Attendance
                    </button>
                  )}
                  {canManagePayments && (
                    <button
                      className="btn-secondary py-1.5 px-3 text-[12px]"
                      onClick={() => navigate(`/admin/catering/${c._id}/payments`)}
                    >
                      <CreditCard size={14} /> Payments
                    </button>
                  )}
                  {c.status !== "cancelled" && c.status !== "ended" && !c.attendanceStarted && canManageCaterings && (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-600 border border-red-100 bg-white hover:bg-red-50 transition-all active:scale-95"
                      onClick={() => { setConfirmCancel(c._id); }}
                    >
                      <XCircle size={14} /> Cancel
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal 
        isOpen={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => handleCancel(confirmCancel)}
        title="Cancel Event"
        message="Are you sure you want to cancel this event? This action cannot be undone and students will be notified."
        variant="danger"
      />
    </div>
  );
}

