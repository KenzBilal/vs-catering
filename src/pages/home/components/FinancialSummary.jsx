import { IndianRupee, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FinancialSummary({ data }) {
  const navigate = useNavigate();
  const { totalEarned = 0, pendingAmount = 0, recentPayments = [] } = data || {};

  return (
    <div className="flex flex-col lg:flex-row gap-5 mb-8 animate-fade-in">
      {/* Left Column: Totals */}
      <div className="flex-[1.5] grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Earned Card */}
        <div className="card bg-stone-900 border-stone-800 p-6 flex flex-col justify-between overflow-hidden relative">
          <div>
            <div className="w-10 h-10 rounded-xl bg-stone-800 flex items-center justify-center mb-4 border border-stone-700">
              <IndianRupee className="text-cream-50" size={20} />
            </div>
            <p className="text-stone-400 text-[11px] font-bold uppercase tracking-widest">Total Earned</p>
            <h2 className="text-3xl font-bold text-cream-50 mt-1 tracking-tight">₹{totalEarned.toLocaleString()}</h2>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-800">
             <p className="text-[11px] text-stone-500 font-medium tracking-tight">All cleared payments</p>
          </div>
        </div>

        {/* Pending Payout Card */}
        <div className="card bg-white border-cream-200 p-6 flex flex-col justify-between overflow-hidden relative shadow-sm">
          <div>
            <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center mb-4 border border-cream-200">
              <Clock className="text-stone-900" size={20} />
            </div>
            <p className="text-stone-500 text-[11px] font-bold uppercase tracking-widest">Pending Payout</p>
            <h2 className="text-3xl font-bold text-stone-900 mt-1 tracking-tight">₹{pendingAmount.toLocaleString()}</h2>
          </div>
          <div className="mt-4 pt-4 border-t border-cream-100">
             <p className="text-[11px] text-stone-400 font-medium tracking-tight">Estimated from attended events</p>
          </div>
        </div>
      </div>

      {/* Right Column: Recent History */}
      <div className="flex-1 card bg-white border-cream-200 p-6 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-900 text-[15px] flex items-center gap-2">
            <TrendingUp size={18} className="text-stone-400" /> Recent Payouts
          </h3>
          <button 
            onClick={() => navigate("/history")}
            className="text-[12px] font-bold text-stone-500 hover:text-stone-900 flex items-center gap-0.5 transition-colors"
          >
            Full History <ChevronRight size={14} />
          </button>
        </div>

        <div className="space-y-3 flex-1">
          {recentPayments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-6 text-center opacity-50">
              <p className="text-[13px] font-medium text-stone-400">No payout history yet.</p>
            </div>
          ) : (
            recentPayments.map((p, i) => (
              <div 
                key={p._id} 
                className={`flex items-center justify-between p-3 rounded-xl border ${p.status === 'cleared' ? 'bg-stone-50 border-stone-100' : 'bg-orange-50/30 border-orange-100/50'}`}
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-stone-900 truncate pr-2">{p.cateringTitle}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-bold text-stone-400 uppercase">
                      {p.status === 'cleared' ? 'CLEARED' : `DUE: ${p.payoutDate || 'TBD'}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[14px] font-black ${p.status === 'cleared' ? 'text-stone-900' : 'text-orange-600'}`}>
                    ₹{p.amount}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
