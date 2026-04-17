import { Link } from "react-router-dom";
import { formatDate, formatCurrency, getStatusBadgeClass, getStatusLabel, getRoleLabel } from "../../lib/helpers";
import { MapPin, Clock, CalendarDays, Users } from "lucide-react";

export default function CateringCard({ catering }) {
  const badgeClass = getStatusBadgeClass(catering.status);

  return (
    <Link to={`/catering/${catering._id}`} className="block outline-none">
      <div className="card p-5 bg-white hover:border-stone-300 card-hover transition-all duration-200">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div>
            <h3 className="font-bold text-[17px] text-stone-900 leading-tight mb-1">
              {catering.place}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-[13px] font-medium text-stone-500">
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                {catering.isTwoDay
                  ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}`
                  : formatDate(catering.dates[0])}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={14} />
                {catering.specificTime}
              </span>
            </div>
          </div>
          <span className={badgeClass}>{getStatusLabel(catering.status)}</span>
        </div>

        <div className="pt-4 border-t border-cream-100 flex flex-wrap gap-2">
          {catering.slots
            .filter((s) => s.day === 0)
            .map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-cream-50 border border-cream-200 rounded-lg px-3 py-1.5 text-[12px]"
              >
                <Users size={12} className="text-stone-400" />
                <span className="text-stone-700 font-semibold">{getRoleLabel(s.role)}</span>
                <span className="text-stone-400 mx-0.5">•</span>
                <span className="text-stone-500 font-medium">
                  {s.limit} slots <span className="mx-1">•</span> {formatCurrency(s.pay)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </Link>
  );
}
