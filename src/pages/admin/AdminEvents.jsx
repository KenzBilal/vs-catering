import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { formatDate, formatCurrency, getStatusBadgeClass, getStatusLabel, getRoleLabel, formatTime12h } from "../../lib/helpers";
import { useState } from "react";
import { Plus, Search, UserCheck, CreditCard, CalendarDays, Clock, Users, Edit, XCircle, AlertTriangle } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";

const STATUS_FILTERS = ["All", "Upcoming", "Today", "Tomorrow", "Ended"];

export default function AdminEvents() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const cateringsRaw = useQuery(api.caterings.listCaterings);
  const { data: caterings, timedOut } = useQueryWithTimeout(cateringsRaw);
  const cancelCatering = useMutation(api.caterings.cancelCatering);

  if (timedOut) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [confirmCancel, setConfirmCancel] = useState(null); // cateringId
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const filtered = (caterings || []).filter((c) => {
    const matchesSearch = c.place.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || c.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleCancel = async (cateringId) => {
    setCancelling(true);
    setCancelError("");
    try {
      await cancelCatering({ cateringId, token });
      setConfirmCancel(null);
    } catch (e) {
      setCancelError(e.message || "Failed to cancel event.");
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
        {user?.role === "admin" && (
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
        <div className="flex flex-col gap-3 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-cream-100 rounded-2xl w-full" />
          ))}
        </div>
      )}

      {/* Empty */}
      {caterings !== undefined && filtered.length === 0 && (
        <div className="card text-center py-16 bg-white">
          <CalendarDays size={40} className="mx-auto text-cream-300 mb-3" />
          <p className="font-semibold text-stone-600 text-[15px]">No events found.</p>
          {search && (
            <p className="text-stone-400 text-[13px] mt-1">Try a different search term.</p>
          )}
        </div>
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
                  {c.status !== "cancelled" && c.status !== "ended" && user?.role === "admin" && (
                    <button
                      className="btn-secondary py-1.5 px-3 text-[12px]"
                      onClick={() => navigate(`/admin/catering/${c._id}/edit`)}
                    >
                      <Edit size={14} /> Edit
                    </button>
                  )}
                  <button
                    className="btn-secondary py-1.5 px-3 text-[12px]"
                    onClick={() => navigate(`/admin/catering/${c._id}/attendance`)}
                  >
                    <UserCheck size={14} /> Attendance
                  </button>
                  <button
                    className="btn-secondary py-1.5 px-3 text-[12px]"
                    onClick={() => navigate(`/admin/catering/${c._id}/payments`)}
                  >
                    <CreditCard size={14} /> Payments
                  </button>
                  {c.status !== "cancelled" && c.status !== "ended" && user?.role === "admin" && (
                    <button
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-red-600 border border-red-100 bg-white hover:bg-red-50 transition-all active:scale-95"
                      onClick={() => { setConfirmCancel(c._id); setCancelError(""); }}
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

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-cream-200 p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="font-bold text-[15px] text-stone-900">Cancel Event</p>
                <p className="text-[13px] text-stone-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-[14px] text-stone-600 mb-5">
              Are you sure you want to cancel this event? Students will still see it as cancelled in their registrations.
            </p>
            {cancelError && (
              <p className="text-[13px] text-red-600 font-medium mb-3">{cancelError}</p>
            )}
            <div className="flex gap-2">
              <button
                className="flex-1 py-2.5 rounded-xl bg-red-700 text-white text-[13px] font-bold hover:bg-red-800 transition-colors active:scale-[0.98] disabled:opacity-60"
                disabled={cancelling}
                onClick={() => handleCancel(confirmCancel)}
              >
                {cancelling ? "Cancelling..." : "Yes, Cancel Event"}
              </button>
              <button
                className="flex-1 btn-secondary py-2.5 text-[13px]"
                onClick={() => setConfirmCancel(null)}
              >
                Keep Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
