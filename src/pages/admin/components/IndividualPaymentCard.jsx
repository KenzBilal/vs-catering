import React from "react";
import { formatCurrency, getRoleLabel } from "../../../lib/helpers";
import { CheckCircle2, UserPlus, Users } from "lucide-react";

export default function IndividualPaymentCard({
  reg,
  payment,
  getPayForRole,
  methods,
  setMethods,
  saving,
  handleCreatePayment,
  setConfirmClear,
  setSelectedReg,
  setViewingTeam,
}) {
  const pay = getPayForRole(reg.role);
  const isGroupHead = payment?.group && payment?.group?.headUserId === reg.userId;

  return (
    <div className={`card transition-all p-5 ${payment?.status === 'cleared' ? 'bg-[#fcfcfc] border-stone-200' : 'bg-white shadow-sm hover:border-cream-300'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className={`font-bold text-[15.5px] truncate ${payment?.status === 'cleared' ? 'text-stone-700' : 'text-stone-900'}`}>
              {reg.user?.name}
            </p>
            {isGroupHead && (
              <span className="text-[10px] font-bold bg-[#f3e5f5] text-[#2e003e] px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-tight">
                <Users size={10} /> Lead
              </span>
            )}
            {payment?.status === 'cleared' && (
              <span className="text-[9.5px] font-black text-[#1a5c3a] bg-[#e8f5ee] px-2 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
                <CheckCircle2 size={10} strokeWidth={3} /> Paid
              </span>
            )}
          </div>
          <p className="text-[12.5px] font-medium text-stone-500 mb-2">{reg.user?.phone}</p>
          <div className="flex flex-wrap items-center gap-2">
             <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${payment?.status === 'cleared' ? 'bg-stone-100 border-stone-200 text-stone-600' : 'bg-cream-50 border-cream-100 text-stone-700'}`}>
               {getRoleLabel(reg.role)}
             </span>
             {isGroupHead && payment?.group && (
               <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white border border-stone-200 shadow-sm text-stone-600">
                 {payment.group.memberRegIds.length} Members
               </span>
             )}
          </div>
        </div>

        <div className="w-full sm:w-auto flex flex-col items-stretch sm:items-end gap-3">
          <div className={`text-[18px] font-black ${payment?.status === 'cleared' ? 'text-stone-400' : 'text-stone-900'}`}>
             {formatCurrency(isGroupHead && payment?.group ? payment.group.totalAmount : pay)}
          </div>

          {!payment && (
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <select
                 value={methods[reg._id] || "cash"}
                 onChange={(e) => setMethods({ ...methods, [reg._id]: e.target.value })}
                 className="w-full sm:w-auto px-3 py-1.5 text-[12.5px] font-bold bg-white border border-cream-200 rounded-xl"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
              </select>
              <button
                disabled={saving[reg._id] || !pay}
                onClick={() => handleCreatePayment(reg)}
                className="w-full sm:w-auto bg-stone-900 text-white text-[12.5px] font-bold px-4 py-1.5 rounded-xl hover:bg-stone-800 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                Create
              </button>
            </div>
          )}

          {payment?.status === "pending" && !isGroupHead && (
            <div className="flex gap-2 w-full sm:w-auto">
               <button
                  onClick={() => setSelectedReg(reg)}
                  className="bg-white border border-cream-200 text-stone-600 hover:bg-cream-50 px-3 py-1.5 rounded-xl text-[12.5px] font-bold shadow-sm transition-all active:scale-[0.98] w-full sm:w-auto flex items-center justify-center gap-1.5"
               >
                 <UserPlus size={14} /> Team
               </button>
               <button
                  disabled={saving[payment._id]}
                  onClick={() => setConfirmClear({ id: payment._id, price: formatCurrency(pay), method: payment.method })}
                  className="bg-[#242424] text-white hover:bg-black px-4 py-1.5 rounded-xl text-[12.5px] font-bold shadow-sm transition-all active:scale-[0.98] w-full sm:w-auto"
               >
                 Clear
               </button>
            </div>
          )}
          
          {isGroupHead && payment?.group?.status === "pending" && (
             <div className="flex gap-2 w-full sm:w-auto">
               <button
                  onClick={() => setViewingTeam(payment.group)}
                  className="bg-white border border-cream-200 text-stone-600 hover:bg-cream-50 px-3 py-1.5 rounded-xl text-[12.5px] font-bold shadow-sm transition-all active:scale-[0.98] w-full sm:w-auto flex items-center justify-center gap-1.5"
               >
                 <Users size={14} /> Manage
               </button>
               <button
                  disabled={saving[payment.group._id]}
                  onClick={() => setConfirmClear({ id: payment._id, groupId: payment.group._id, price: formatCurrency(payment.group.totalAmount) })}
                  className="bg-[#242424] text-white hover:bg-black px-4 py-1.5 rounded-xl text-[12.5px] font-bold shadow-sm transition-all active:scale-[0.98] w-full sm:w-auto"
               >
                  Clear Team
               </button>
             </div>
          )}

          {payment?.status === "cleared" && (
            <p className="text-[12px] font-medium text-stone-500 flex flex-col sm:items-end w-full sm:w-auto">
               <span>Cleared {formatDate(payment.clearedAt)}</span>
               {payment.upiRef && <span className="text-stone-400 mt-0.5 break-all">Ref: {payment.upiRef}</span>}
            </p>
          )}

        </div>
      </div>
    </div>
  );
}