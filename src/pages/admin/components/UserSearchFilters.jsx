import { Search } from "lucide-react";

const ROLE_FILTERS = ["All", "Admin", "Sub-Admin", "Student"];

export default function UserSearchFilters({ search, setSearch, roleFilter, setRoleFilter }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-white"
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        {ROLE_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setRoleFilter(f)}
            className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-all duration-150 active:scale-95 ${
              roleFilter === f
                ? "bg-stone-900 text-cream-50 shadow-sm"
                : "bg-white text-stone-500 border border-cream-200 hover:bg-cream-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
}
