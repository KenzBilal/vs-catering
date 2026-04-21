export default function SegmentedControl({ options, value, onChange, disabled = false }) {
  return (
    <div className={`flex rounded-xl bg-cream-100 p-1 border border-cream-200 w-full ${disabled ? "opacity-70" : ""}`}>
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            onClick={(e) => {
              e.preventDefault();
              if (disabled) return;
              onChange(option.value);
            }}
            disabled={disabled}
            className={`${
              isSelected
                ? 'bg-white shadow-sm text-stone-900 font-semibold border border-cream-200/50'
                : 'text-stone-500 hover:text-stone-700 font-medium border border-transparent hover:bg-cream-200/50'
            } flex-1 rounded-lg py-2.5 text-sm transition-all duration-200 ease-in-out flex items-center justify-center gap-2 disabled:cursor-not-allowed`}
          >
            {option.icon && <option.icon size={16} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
