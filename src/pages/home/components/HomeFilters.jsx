const FILTERS = ["All", "Today", "Tomorrow", "Upcoming", "Ended"];

export default function HomeFilters({ filter, setFilter }) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {FILTERS.map((f) => (
        <button
          key={f}
          onClick={() => setFilter(f)}
          className={`px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold transition-all duration-150 active:scale-95 ${
            filter === f
              ? "bg-stone-900 text-cream-50 shadow-sm"
              : "bg-white text-stone-500 border border-cream-200 hover:bg-cream-50"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
