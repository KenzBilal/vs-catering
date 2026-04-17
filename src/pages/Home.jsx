import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import CateringCard from "../components/shared/CateringCard";
import { useState } from "react";

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
    <div className="page-container" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Caterings
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Showing last 30 days and upcoming.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${filter === f ? "var(--accent)" : "var(--cream-border)"}`,
              background: filter === f ? "var(--accent)" : "var(--cream-card)",
              color: filter === f ? "var(--cream-50)" : "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {caterings === undefined && (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Loading...</p>
      )}

      {caterings !== undefined && filtered.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
            No caterings found.
          </p>
        </div>
      )}

      {filter === "All" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {groups.today.length > 0 && (
            <Section title="Today" items={groups.today} />
          )}
          {groups.tomorrow.length > 0 && (
            <Section title="Tomorrow" items={groups.tomorrow} />
          )}
          {groups.upcoming.length > 0 && (
            <Section title="Upcoming" items={groups.upcoming} />
          )}
          {groups.ended.length > 0 && (
            <Section title="Past 30 Days" items={groups.ended} />
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: 10,
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((c) => (
          <CateringCard key={c._id} catering={c} />
        ))}
      </div>
    </div>
  );
}
