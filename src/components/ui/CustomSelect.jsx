import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function CustomSelect({ options, value, onChange, placeholder = "Select...", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border border-cream-200 rounded-xl text-[14px] font-medium text-stone-700 hover:border-stone-300 transition-all active:scale-[0.98] ${isOpen ? "ring-2 ring-stone-900/5 border-stone-800" : ""}`}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={16} className={`text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-2 py-1.5 bg-white border border-cream-200 rounded-xl shadow-xl animate-fade-in max-h-[240px] overflow-y-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitScrollbar: { display: 'none' } }}
        >
          <style dangerouslySetInnerHTML={{ __html: `
            .absolute::-webkit-scrollbar { display: none; }
          ` }} />
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-[13.5px] font-medium transition-colors ${
                value === opt.value 
                  ? "bg-stone-900 text-cream-50" 
                  : "text-stone-600 hover:bg-cream-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
