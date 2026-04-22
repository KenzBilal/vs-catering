import { CalendarDays, Clock } from "lucide-react";
import { getStatusBadgeClass, getStatusLabel, formatDate, formatTime12h, getTimeOfDayLabel } from "../../../lib/helpers";

export default function CateringHeader({ catering }) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight leading-tight">
          {catering.place}
        </h2>
        <span className={`${getStatusBadgeClass(catering.status)} self-start`}>
          {getStatusLabel(catering.status)}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-2 text-[14px] text-stone-500 font-medium">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={16} />
          {formatDate(catering.date)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={16} />
          {formatTime12h(catering.specificTime)} ({getTimeOfDayLabel(catering.timeOfDay)})
        </span>
      </div>
    </div>
  );
}
