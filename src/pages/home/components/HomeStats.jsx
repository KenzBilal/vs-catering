export default function HomeStats({ activeCount, registeredCount }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-10">
      <div className="bg-white border border-stone-200/60 rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md group relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-12 h-12 bg-stone-900 rounded-full opacity-[0.02] transition-transform duration-500 group-hover:scale-150" />
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.12em] mb-2">Available Jobs</p>
        <p className="text-3xl font-black text-stone-900 tracking-tighter">{activeCount}</p>
        <div className="mt-2.5 h-1 w-8 bg-stone-100 rounded-full group-hover:w-12 transition-all duration-500" />
      </div>
      <div className="bg-gradient-to-br from-[#fffdfa] to-[#fdf0e6] border border-[#f5d0aa] rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md group relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-12 h-12 bg-[#8b3a00] rounded-full opacity-[0.03] transition-transform duration-500 group-hover:scale-150" />
        <p className="text-[10px] font-black text-[#a05020]/70 uppercase tracking-[0.12em] mb-2">Your Spots</p>
        <p className="text-3xl font-black text-[#8b3a00] tracking-tighter">{registeredCount}</p>
        <div className="mt-2.5 h-1 w-8 bg-[#f5d0aa] rounded-full group-hover:w-12 transition-all duration-500" />
      </div>
    </div>
  );
}
