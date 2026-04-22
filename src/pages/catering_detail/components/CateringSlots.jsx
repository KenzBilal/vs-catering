import { Users } from "lucide-react";
import { getRoleLabel, formatCurrency } from "../../../lib/helpers";

export default function CateringSlots({ catering, roleCounts }) {
  return (
    <div className="card mb-6 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="text-stone-400" size={18} />
        <h3 className="section-title !mb-0">Roles and Pay</h3>
      </div>
      <div className="flex flex-col gap-3">
        {catering.slots.filter(s => s.limit > 0).map((s, i) => {
          const key = s.role;
          const filled = roleCounts[key] || 0;
          const confirmed = Math.min(filled, s.limit);
          const waiting = Math.max(0, filled - s.limit);

          return (
            <div key={i} className="flex justify-between items-center px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl">
              <div>
                <p className="font-semibold text-[15px] text-stone-900 flex items-center gap-2">
                  {getRoleLabel(s.role)}
                </p>
                <p className="text-[13px] text-stone-500 font-medium mt-1">
                  <span className={confirmed >= s.limit ? "text-[#1a5c3a]" : ""}>{confirmed}/{s.limit} confirmed</span>
                  {waiting > 0 && <span className="text-orange-600"> · {waiting} waitlist</span>}
                </p>
              </div>
              <p className="font-bold text-[16px] text-stone-900 bg-white px-3 py-1 rounded-lg border border-cream-200 shadow-sm">
                {formatCurrency(s.pay)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
