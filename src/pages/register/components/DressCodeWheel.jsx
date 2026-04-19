import { Shirt } from "lucide-react";
import { getRoleLabel, DRESS_CODE_DEFAULTS } from "../../../lib/helpers";

export default function DressCodeWheel({ catering, selectedRole }) {
  const roles = Array.from(new Set(catering.slots.map((s) => s.role)));
  const activeIndex = roles.indexOf(selectedRole);

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="relative h-[140px] perspective-[1000px] overflow-hidden rounded-2xl border border-cream-200 bg-[#fdfaf5] shadow-inner shadow-stone-900/5">
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-[#fdfaf5] via-[#fdfaf5]/0 10% via-[#fdfaf5]/0 90% to-[#fdfaf5]" />
        <div className="absolute left-4 top-4 flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest z-20 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-cream-100">
          <Shirt size={12} /> Dress Requirements
        </div>
        <div
          className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: `translateY(${activeIndex === -1 ? 0 : -activeIndex * 100 + 35}px)` }}
        >
          {roles.map((r, i) => {
            const isSelected = r === selectedRole;
            const offset = i - activeIndex;
            const rotation = offset * 25;
            const opacity = isSelected ? 1 : 0.15;
            const blur = isSelected ? 0 : 3;
            const scale = isSelected ? 1 : 0.8;
            return (
              <div
                key={r}
                className="h-[100px] flex flex-col justify-center px-6 transition-all duration-700"
                style={{ transform: `rotateX(${rotation}deg) scale(${scale})`, opacity, filter: `blur(${blur}px)`, transformOrigin: "center center" }}
              >
                <p className={`text-[11px] font-black uppercase tracking-tighter mb-1.5 ${isSelected ? "text-stone-900" : "text-stone-400"}`}>
                  {getRoleLabel(r)}
                </p>
                <p className={`text-[13.5px] leading-[1.6] font-medium ${isSelected ? "text-stone-700 font-bold" : "text-stone-300"}`}>
                  {DRESS_CODE_DEFAULTS[r] || "Standard formal dress code applies."}
                </p>
              </div>
            );
          })}
          {activeIndex === -1 && (
            <div className="h-full flex items-center justify-center px-10 text-center">
              <p className="text-[13px] font-medium text-stone-400 italic">Select a role above to see requirements</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
