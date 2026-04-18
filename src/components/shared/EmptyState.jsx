import { Inbox } from "lucide-react";

export default function EmptyState({ icon: Icon = Inbox, title = "No data found", description = "There is nothing to display here right now." }) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center shadow-sm w-full">
      <div className="w-16 h-16 bg-cream-50 rounded-full flex items-center justify-center mb-4">
        <Icon size={32} className="text-stone-300" />
      </div>
      <h3 className="text-lg font-bold text-stone-900 mb-1 tracking-tight">{title}</h3>
      <p className="text-[14px] text-stone-500 font-medium max-w-sm">{description}</p>
    </div>
  );
}
