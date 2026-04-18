import { XCircle, User, Phone, Hash, Home, MapPin } from "lucide-react";
import ConvexImage from "../../../components/shared/ConvexImage";

export default function UserProfileModal({ viewUser, setViewUser }) {
  if (!viewUser) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setViewUser(null)} />
      <div className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-slide-up border border-white/20">
        <div className="h-24 bg-stone-900 relative">
           <button 
            onClick={() => setViewUser(null)}
            className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
           >
             <XCircle size={18} />
           </button>
        </div>
        <div className="px-8 pb-8 -mt-12 text-center">
          <div className="inline-block relative">
            <div className="w-24 h-24 rounded-[28px] bg-white p-1.5 shadow-xl mx-auto">
              <div className="w-full h-full rounded-[24px] bg-cream-100 overflow-hidden border border-cream-200 flex items-center justify-center">
                {viewUser.photo ? (
                  <ConvexImage storageId={viewUser.photo} className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-stone-300" />
                )}
              </div>
            </div>
          </div>
          
          <h4 className="text-xl font-bold text-stone-900 mt-4 tracking-tight">{viewUser.name}</h4>
          <p className="text-[13px] font-bold text-stone-400 uppercase tracking-widest mt-1">Student Profile</p>
          
          <div className="mt-8 flex flex-col gap-3">
            <ModalRow icon={<Phone size={16}/>} label="Phone" value={viewUser.phone} />
            {viewUser.registrationNumber && (
              <ModalRow icon={<Hash size={16}/>} label="Reg Number" value={viewUser.registrationNumber} />
            )}
            <ModalRow 
              icon={viewUser.stayType === "hostel" ? <Home size={16}/> : <MapPin size={16}/>} 
              label="Accommodation" 
              value={viewUser.stayType === "hostel" ? "Hosteler" : "Day Scholar"} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ModalRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-3 bg-cream-50 rounded-2xl border border-cream-100">
      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-stone-400 shadow-sm border border-cream-100 shrink-0">
        {icon}
      </div>
      <div className="text-left">
        <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wide">{label}</p>
        <p className="text-[14px] font-bold text-stone-800">{value}</p>
      </div>
    </div>
  );
}
