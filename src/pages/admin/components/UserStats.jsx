export default function UserStats({ counts }) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-8">
      <div className="bg-white border border-cream-200 rounded-xl p-4 text-center shadow-sm">
        <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Admins</p>
        <p className="text-2xl font-black text-stone-800">{counts.admin + counts.sub_admin}</p>
      </div>
      <div className="bg-white border border-cream-200 rounded-xl p-4 text-center shadow-sm">
        <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Students</p>
        <p className="text-2xl font-black text-stone-800">{counts.student}</p>
      </div>
      <div className="bg-white border border-cream-200 rounded-xl p-4 text-center shadow-sm">
        <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total</p>
        <p className="text-2xl font-black text-stone-800">{counts.total}</p>
      </div>
    </div>
  );
}
