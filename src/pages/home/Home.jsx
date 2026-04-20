import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import EmptyState from "../../components/shared/EmptyState";
import LoadingState from "../../components/shared/LoadingState";

// Sub-components
import HomeStats from "./components/HomeStats";
import HomeFilters from "./components/HomeFilters";
import EventCard from "./components/EventCard";
import FinancialSummary from "./components/FinancialSummary";

export default function Dashboard() {
  const { user, token } = useAuth();
  const cateringsRaw = useQuery(api.caterings.listCaterings, { token: token || undefined });
  const registrationsRaw = useQuery(api.registrations.getRegistrationsByUser, 
    user ? { userId: user._id, token } : "skip"
  );
  const financialSummary = useQuery(api.payments.getStudentFinancialSummary, { token: token || "" });

  const { data: caterings, timedOut: cateringTimeout } = useQueryWithTimeout(cateringsRaw);
  const { data: registrations } = useQueryWithTimeout(registrationsRaw);
  const [filter, setFilter] = useState("All");

  if (cateringTimeout) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const registeredIds = new Set((registrations || []).map((r) => r.cateringId));

  const filtered = (caterings || [])
    .filter((c) => c.status !== "cancelled")
    .filter((c) => filter === "All" || c.status === filter.toLowerCase());

  const groups = {
    today:    filtered.filter((c) => c.status === "today"),
    tomorrow: filtered.filter((c) => c.status === "tomorrow"),
    upcoming: filtered.filter((c) => c.status === "upcoming"),
    ended:    filtered.filter((c) => c.status === "ended"),
  };

  const openCaterings = (caterings || []).filter(
    (c) => c.status === "upcoming"
  );

  const registeredUpcomingCount = (registrations || []).filter((r) => {
    const catering = (caterings || []).find(c => c._id === r.cateringId);
    return r.status !== "cancelled" && catering?.status === "upcoming";
  }).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Welcome back, {user?.name?.split(" ")[0] || "User"}.
        </p>
      </div>

      <FinancialSummary data={financialSummary} />

      <HomeStats activeCount={openCaterings.length} registeredCount={registeredUpcomingCount} />

      <HomeFilters filter={filter} setFilter={setFilter} />

      {caterings === undefined ? (
        <LoadingState rows={3} />
      ) : filtered.length === 0 ? (
        <EmptyState 
          icon={CalendarDays} 
          title="No events found" 
          description="There are no events matching your current filter." 
        />
      ) : (
        filter === "All" ? (
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
        )
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
