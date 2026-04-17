import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { Link } from "react-router-dom";
import { formatDate, formatCurrency, getStatusBadgeClass, getStatusLabel, getRoleLabel, formatTime12h } from "../lib/helpers";
import { useState } from "react";
import { CalendarDays, Clock, Users, Search, ArrowRight } from "lucide-react";

const FILTERS = ["All", "Today", "Tomorrow", "Upcoming", "Ended"];

export default function Dashboard() {
  const { user } = useAuth();
  const caterings = useQuery(api.caterings.listCaterings);
  const registrations = useQuery(api.registrations.getRegistrationsByUser, { userId: user._id });
  const [filter, setFilter] = useState("All");

  const registeredIds = new Set((registrations || []).map((r) => r.cateringId));

  const filtered = (caterings || [])
    .filter((c) => c.status !== "cancelled") // students don't see cancelled
    .filter((c) => filter === "All" || c.status === filter.toLowerCase());

  const groups = {
    today:    filtered.filter((c) => c.status === "today"),
    tomorrow: filtered.filter((c) => c.status === "tomorrow"),
    upcoming: filtered.filter((c) => c.status === "upcoming"),
    ended:    filtered.filter((c) => c.status === "ended"),
  };

  const activeCaterings = (caterings || []).filter(
    (c) => c.status === "today" || c.status === "tomorrow" || c.status === "upcoming"
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Welcome back, {user?.name.split(" ")[0]}.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Open Events</p>
          <p className="text-2xl font-black text-stone-800">{activeCaterings.length}</p>
        </div>
        <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-sm">
          <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Registered</p>
          <p className="text-2xl font-black text-stone-800">{registeredIds.size}</p>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all duration-150 active:scale-95 ${
              filter === f
                ? "bg-stone-900 text-cream-50 shadow-sm"
                : "bg-white text-stone-500 border border-cream-200 hover:bg-cream-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Loading */}
      {caterings === undefined && (
        <div className="animate-pulse flex flex-col gap-3">
          {[1, 2, 3].map((n) => <div key={n} className="h-32 bg-cream-100 rounded-2xl" />)}
        </div>
      )}

      {/* Empty */}
      {caterings !== undefined && filtered.length === 0 && (
        <div className="card text-center py-14 bg-white">
          <CalendarDays size={36} className="mx-auto text-cream-300 mb-3" />
          <p className="text-stone-500 font-medium">No events for this filter.</p>
        </div>
      )}

      {/* Grouped list */}
      {filter === "All" ? (
        <div className="flex flex-col gap-8 animate-fade-in">
          {groups.today.length > 0    && <Section title="Today"        items={groups.today}    registeredIds={registeredIds} />}
          {groups.tomorrow.length > 0 && <Section title="Tomorrow"     items={groups.tomorrow} registeredIds={registeredIds} />}
          {groups.upcoming.length > 0 && <Section title="Upcoming"     items={groups.upcoming} registeredIds={registeredIds} />}
          {groups.ended.length > 0    && <Section title="Past 30 Days" items={groups.ended}    registeredIds={registeredIds} />}
        </div>
      ) : (
        <div className="flex flex-col gap-3 animate-fade-in">
          {filtered.map((c) => <EventCard key={c._id} c={c} isRegistered={registeredIds.has(c._id)} />)}
        </div>
      )}
    </div>
  );
}

function Section({ title, items, registeredIds }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-widest uppercase text-stone-400 mb-3 ml-1">{title}</p>
      <div className="flex flex-col gap-3">
        {items.map((c) => <EventCard key={c._id} c={c} isRegistered={registeredIds.has(c._id)} />)}
      </div>
    </div>
  );
}

function EventCard({ c, isRegistered }) {
  return (
    <Link to={`/catering/${c._id}`} className="block">
      <div className={`card p-5 bg-white hover:border-stone-300 transition-all duration-150 ${isRegistered ? "border-stone-300" : ""}`}>
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-[16px] text-stone-900 truncate">{c.place}</h3>
              {isRegistered && (
                <span className="text-[10.5px] font-bold bg-stone-900 text-cream-50 px-2 py-0.5 rounded-full shrink-0">
                  Registered
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[13px] font-medium text-stone-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={13} />
                {c.isTwoDay
                  ? `${formatDate(c.dates[0])} – ${formatDate(c.dates[1])}`
                  : formatDate(c.dates[0])}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} />{formatTime12h(c.specificTime)}
              </span>
            </div>
          </div>
          <span className={`${getStatusBadgeClass(c.status)} shrink-0`}>{getStatusLabel(c.status)}</span>
        </div>

        <div className="pt-4 border-t border-cream-100 flex flex-wrap gap-2">
          {c.slots.filter((s) => s.day === 0).map((s, i) => (
            <div key={i} className="flex items-center gap-2 bg-cream-50 border border-cream-200 rounded-lg px-3 py-1.5 text-[12px]">
              <Users size={12} className="text-stone-400" />
              <span className="text-stone-700 font-semibold">{getRoleLabel(s.role)}</span>
              <span className="text-stone-400">·</span>
              <span className="text-stone-500 font-medium">{s.limit} slots · {formatCurrency(s.pay)}</span>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
