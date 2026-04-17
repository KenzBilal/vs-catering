import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate } from "react-router-dom";
import { formatDate, formatCurrency, getStatusBadgeClass, getStatusLabel, getRoleLabel } from "../../lib/helpers";
import { useState } from "react";
import { Plus, Search, UserCheck, CreditCard, CalendarDays, Clock, Users, Filter } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

const STATUS_FILTERS = ["All", "Upcoming", "Today", "Tomorrow", "Ended"];

export default function AdminEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const caterings = useQuery(api.caterings.listCaterings);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = (caterings || []).filter((c) => {
    const matchesSearch = c.place.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || c.status === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

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
                      <Clock size={14} /> {c.specificTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={14} /> {totalSlots} slots
                    </span>
                  </div>

                  {/* Role pay summary */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {c.slots
                      .filter((s) => s.day === 0)
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
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
