import { Link } from "react-router-dom";
import { CalendarDays, Clock, Users } from "lucide-react";
import { formatDate, formatCurrency, getStatusBadgeClass, getStatusLabel, getRoleLabel, formatTime12h } from "../../../lib/helpers";

export default function EventCard({ c, isRegistered }) {
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
          {c.slots.filter((s) => s.day === 0 && s.limit > 0).map((s, i) => (
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
