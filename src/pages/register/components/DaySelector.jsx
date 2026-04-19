import { AlertCircle } from "lucide-react";
import { formatDate } from "../../../lib/helpers";

export default function DaySelector({ catering, selectedDays, handleDayToggle, errors }) {
  if (!catering.isTwoDay) return null;

  return (
    <div>
      {catering.joinRule === "any_day" ? (
        <>
          <label className="label">Select Day(s)</label>
          <div className="flex gap-2">
            {catering.dates.map((date, i) => {
              const isSelected = selectedDays.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => handleDayToggle(i)}
                  className={`flex-1 py-3 rounded-xl border text-[14px] font-semibold transition-all duration-200 active:scale-[0.98] ${
                    isSelected
                      ? "bg-stone-800 border-stone-800 text-cream-50"
                      : "bg-white border-cream-200 hover:bg-cream-50 text-stone-700"
                  }`}
                >
                  Day {i + 1}
                </button>
              );
            })}
          </div>
          {errors.days && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.days}</p>}
        </>
      ) : (
        <div className="bg-[#fdf0e6] border border-[#f5d0aa] rounded-xl p-4 flex gap-3">
          <AlertCircle className="text-[#a05020] shrink-0" size={20} />
          <p className="text-[13.5px] font-medium text-[#8b3a00] leading-relaxed">
            This event requires attendance on both days. Registering confirms you for both {formatDate(catering.dates[0])} and {formatDate(catering.dates[1])}.
          </p>
        </div>
      )}
    </div>
  );
}
