import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import CateringCard from "../components/shared/CateringCard";
import { useState } from "react";
import { Search } from "lucide-react";

const FILTERS = ["All", "Today", "Tomorrow", "Upcoming", "Ended"];

export default function Home() {
  const caterings = useQuery(api.caterings.listCaterings);
  const [filter, setFilter] = useState("All");

  const filtered = (caterings || []).filter((c) => {
    if (filter === "All") return true;
    return c.status === filter.toLowerCase();
  });

  const groups = {
    today: filtered.filter((c) => c.status === "today"),
    tomorrow: filtered.filter((c) => c.status === "tomorrow"),
    upcoming: filtered.filter((c) => c.status === "upcoming"),
    ended: filtered.filter((c) => c.status === "ended"),
  };

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Events</h2>
        <p className="text-[14px] text-stone-500 mt-1 font-medium">
          Showing upcoming and recently ended events.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-200 active:scale-95 ${
              filter === f
                ? "bg-stone-800 text-cream-50 shadow-md"
                : "bg-white text-stone-600 border border-cream-200 hover:bg-cream-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {caterings === undefined && (
        <div className="animate-pulse flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-cream-100 rounded-2xl w-full"></div>
          ))}
        </div>
      )}

      {caterings !== undefined && filtered.length === 0 && (
        <div className="card text-center py-16">
          <Search size={48} className="mx-auto text-cream-300 mb-4" />
          <p className="text-stone-500 font-medium text-[15px]">No events found for this filter.</p>
        </div>
      )}

      {filter === "All" ? (
        <div className="flex flex-col gap-8 animate-fade-in">
          {groups.today.length > 0 && <Section title="Today" items={groups.today} />}
          {groups.tomorrow.length > 0 && <Section title="Tomorrow" items={groups.tomorrow} />}
          {groups.upcoming.length > 0 && <Section title="Upcoming" items={groups.upcoming} />}
          {groups.ended.length > 0 && <Section title="Past 30 Days" items={groups.ended} />}
        </div>
      ) : (
        <div className="flex flex-col gap-4 animate-fade-in">
          {filtered.map((c) => (
            <CateringCard key={c._id} catering={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function Section({ title, items }) {
  return (
    <div>
      <p className="text-[11px] font-bold tracking-widest uppercase text-stone-400 mb-3 ml-1">
        {title}
      </p>
      <div className="flex flex-col gap-3">
        {items.map((c) => (
          <CateringCard key={c._id} catering={c} />
        ))}
      </div>
    </div>
  );
}
