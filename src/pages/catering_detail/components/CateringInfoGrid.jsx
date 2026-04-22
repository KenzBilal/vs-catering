import { MapPin, Camera, AlertCircle } from "lucide-react";

export default function CateringInfoGrid({ catering }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
      <InfoItem icon={<MapPin size={16}/>} label="Pickup" value="Main Gate" />
      <InfoItem icon={<Camera size={16}/>} label="Photo Required" value={catering.photoRequired ? "Yes" : "No"} />
    </div>
  );
}

function InfoItem({ label, value, icon }) {
  return (
    <div className="bg-white border border-cream-200 rounded-xl p-3 shadow-sm flex flex-col justify-center">
      <p className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1.5">
        {icon} {label}
      </p>
      <p className="text-[14.5px] font-semibold text-stone-800">{value}</p>
    </div>
  );
}
