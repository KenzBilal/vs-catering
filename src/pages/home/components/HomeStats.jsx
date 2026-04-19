export default function HomeStats({ activeCount, registeredCount }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-8">
      <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-sm">
        <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Open Events</p>
        <p className="text-2xl font-black text-stone-800">{activeCount}</p>
      </div>
      <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-sm">
        <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Registered</p>
        <p className="text-2xl font-black text-stone-800">{registeredCount}</p>
      </div>
    </div>
  );
}
