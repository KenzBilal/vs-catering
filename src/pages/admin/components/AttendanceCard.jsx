import { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Camera, Filter } from "lucide-react";
import { getRoleLabel } from "../../../lib/helpers";

export default function AttendanceCard({
  reg,
  isLocked,
  isPaid,
  saving,
  handleMark,
  handleRoleChange,
  setViewPhoto
}) {
  const [rejectionInput, setRejectionInput] = useState("");
  const isAttended = reg.status !== "registered";

  return (
    <div
      className={`card transition-all animate-fade-in p-5 ${
        isPaid
          ? "bg-[#fcfcfc] border-stone-200 shadow-none opacity-90"
          : isLocked
          ? "bg-stone-50/40 border-stone-100 grayscale-[0.2]"
          : "bg-white hover:border-cream-300 shadow-sm"
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p
              className={`font-bold text-[15.5px] truncate ${
                isPaid ? "text-stone-700" : "text-stone-900"
              }`}
            >
              {reg.user?.name}
            </p>
            {isPaid && (
              <span className="text-[9.5px] font-black text-[#1a5c3a] bg-[#e8f5ee] px-2 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
                <CheckCircle2 size={10} strokeWidth={3} /> Paid
              </span>
            )}
          </div>

          <p className="text-[12.5px] font-medium text-stone-500 mb-2">
            {reg.user?.phone}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                isPaid
                  ? "bg-stone-100 border-stone-200 text-stone-600"
                  : "bg-cream-50 border-cream-100 text-stone-700"
              }`}
            >
              {getRoleLabel(reg.role)}
            </span>

            {isAttended && (
              <span
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wide ${
                  reg.status === "attended"
                    ? "bg-[#e8f5ee] border-[#b8dfc8] text-[#1a5c3a]"
                    : reg.status === "absent"
                    ? "bg-stone-100 border-stone-200 text-stone-500"
                    : "bg-red-50 border-red-100 text-red-600"
                }`}
              >
                {reg.status}
              </span>
            )}
          </div>

          {(reg.photoStorageId || reg.photoUrl) && (
            <button
              onClick={() =>
                setViewPhoto({
                  storageId: reg.photoStorageId,
                  url: reg.photoUrl,
                })
              }
              className="flex items-center gap-1.5 mt-3 text-[11.5px] font-bold text-stone-500 hover:text-stone-900 transition-colors"
            >
              <Camera size={14} /> View Student Photo
            </button>
          )}
        </div>

        {!isPaid && (
          <div className="flex flex-col gap-3 w-full sm:w-auto sm:items-end">
            <div className="relative">
              <select
                value={reg.role}
                disabled={isLocked}
                onChange={(e) => handleRoleChange(reg._id, e.target.value)}
                className={`w-full sm:w-auto pl-3 pr-10 py-1.5 text-[12px] font-bold appearance-none bg-white border rounded-xl ${
                  isLocked
                    ? "opacity-50 cursor-not-allowed border-stone-100"
                    : "border-cream-200"
                }`}
              >
                {["service_boy", "service_girl", "captain_male", "captain_female"]
                  .filter((r) => {
                    if (reg.user?.gender === "male")
                      return r === "service_boy" || r === "captain_male";
                    return r === "service_girl" || r === "captain_female";
                  })
                  .map((r) => (
                    <option key={r} value={r}>
                      {getRoleLabel(r)}
                    </option>
                  ))}
              </select>
              {!isLocked && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                  <Filter size={12} />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                disabled={saving || isLocked}
                onClick={() => handleMark(reg._id, "attended")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all duration-200 active:scale-[0.98] ${
                  reg.status === "attended"
                    ? "bg-[#e8f5ee] text-[#1a5c3a] border border-[#b8dfc8] shadow-sm"
                    : "bg-white text-stone-400 border border-cream-200 hover:bg-cream-50"
                }`}
              >
                <CheckCircle2 size={15} /> Attended
              </button>
              <button
                disabled={saving || isLocked}
                onClick={() => handleMark(reg._id, "absent")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all duration-200 active:scale-[0.98] ${
                  reg.status === "absent"
                    ? "bg-stone-100 text-stone-600 border border-stone-200 shadow-sm"
                    : "bg-white text-stone-400 border border-cream-200 hover:bg-cream-50"
                }`}
              >
                <XCircle size={15} /> Absent
              </button>
            </div>
          </div>
        )}
      </div>

      {!isPaid && (
        <div className="mt-4 pt-4 border-t border-cream-100">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Rejection reason..."
              value={rejectionInput}
              disabled={isLocked}
              onChange={(e) => setRejectionInput(e.target.value)}
              className="flex-1 bg-white border border-cream-200 text-stone-800 rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all disabled:opacity-50"
            />
            <button
              disabled={saving || isLocked}
              onClick={() => handleMark(reg._id, "rejected", rejectionInput)}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-[12.5px] font-bold transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                reg.status === "rejected"
                  ? "bg-red-50 text-red-700 border border-red-200 shadow-sm"
                  : "bg-white text-red-600 border border-red-100 hover:bg-red-50"
              }`}
            >
              <AlertCircle size={15} /> Mark Rejected
            </button>
          </div>

          {reg.status === "rejected" && reg.rejectionReason && (
            <p className="flex items-center gap-1.5 text-[12px] font-medium text-red-600 mt-2 bg-red-50/50 p-2 rounded-md">
              <AlertCircle size={14} /> Reason: {reg.rejectionReason}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
