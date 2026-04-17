import { Link } from "react-router-dom";
import { formatDate, formatCurrency, getStatusBadgeClass, getStatusLabel, getRoleLabel } from "../../lib/helpers";

export default function CateringCard({ catering }) {
  const badgeClass = getStatusBadgeClass(catering.status);

  // Unique roles for day 0 (or combined)
  const roles = [...new Set(catering.slots.filter((s) => s.day === 0).map((s) => s.role))];

  return (
    <Link
      to={`/catering/${catering._id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="card"
        style={{
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#b8a898")}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--cream-border)")}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <p className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              {catering.place}
            </p>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              {catering.isTwoDay
                ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}`
                : formatDate(catering.dates[0])}
              {" · "}
              {catering.specificTime}
            </p>
          </div>
          <span className={badgeClass}>{getStatusLabel(catering.status)}</span>
        </div>

        <hr className="divider" style={{ margin: "10px 0" }} />

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {catering.slots
            .filter((s) => s.day === 0)
            .map((s, i) => (
              <div
                key={i}
                style={{
                  background: "var(--cream-bg)",
                  border: "1px solid var(--cream-border)",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 12,
                }}
              >
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
                  {getRoleLabel(s.role)}
                </span>
                <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>
                  {s.limit} slots · {formatCurrency(s.pay)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </Link>
  );
}
