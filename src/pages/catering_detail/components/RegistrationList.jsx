import { UserCheck, User } from "lucide-react";
import ConvexImage from "../../../components/shared/ConvexImage";
import { getRoleLabel } from "../../../lib/helpers";

export default function RegistrationList({ registrations, isAdmin, setViewUser }) {
  return (
    <div className="card mb-6 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <UserCheck className="text-stone-400" size={18} />
          <h3 className="section-title !mb-0 text-stone-800">Registered Students</h3>
        </div>
        <span className="text-[12px] font-bold text-stone-400 bg-cream-50 px-2.5 py-1 rounded-full border border-cream-200">
          {registrations?.length || 0} Total
        </span>
      </div>
      
      {registrations && registrations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {registrations.map((r) => (
            isAdmin ? (
              <button
                key={r._id}
                onClick={() => setViewUser({
                  name: r.user?.name,
                  photo: r.photoStorageId || r.user?.photoStorageId,
                  phone: r.user?.phone,
                  stayType: r.user?.stayType,
                  registrationNumber: r.user?.registrationNumber
                })}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-cream-100 hover:border-stone-300 hover:bg-white transition-all text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-cream-100 border border-cream-200 overflow-hidden flex items-center justify-center shrink-0">
                  {r.photoStorageId || r.user?.photoStorageId ? (
                    <ConvexImage storageId={r.photoStorageId || r.user?.photoStorageId} className="w-full h-full object-cover" />
                  ) : (
                    <User size={14} className="text-stone-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-stone-800 truncate group-hover:text-stone-900">{r.user?.name}</p>
                  <p className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">{getRoleLabel(r.role)}</p>
                </div>
              </button>
            ) : (
              <div 
                key={r._id}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border border-cream-100 bg-cream-50/30"
              >
                <div className="w-6 h-6 rounded-full bg-cream-100 flex items-center justify-center">
                  <User size={12} className="text-stone-400" />
                </div>
                <p className="text-[13px] font-semibold text-stone-700 truncate">{r.user?.name}</p>
              </div>
            )
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-[14px] text-stone-400 font-medium">No students registered yet.</p>
        </div>
      )}
    </div>
  );
}
