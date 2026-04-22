import { IndianRupee, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function FinancialSummary({ data }) {
  const navigate = useNavigate();
  const { totalEarned = 0, pendingAmount = 0, recentPayments = [] } = data || {};

  return (
    <div className="flex flex-col lg:flex-row gap-5 mb-8 animate-fade-in">
      {/* Financial Overview Card */}
      <div className="flex-[1.2]">
        <div className="card bg-stone-900 border-stone-800 p-8 flex flex-col justify-center h-full min-h-[180px] relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-stone-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-2">Total Career Earnings</p>
            <h2 className="text-5xl font-bold text-cream-50 tracking-tight flex items-baseline gap-2">
              <span className="text-2xl font-medium opacity-50">₹</span>
              {totalEarned.toLocaleString()}
            </h2>
            
            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-stone-800 border border-stone-700 px-3 py-1.5 rounded-full">
                <Clock className="text-stone-400" size={14} />
                <span className="text-cream-50 text-[12px] font-bold">₹{pendingAmount.toLocaleString()} Pending</span>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">From {recentPayments.length} events</p>
            </div>
          </div>

          {/* Global Payout Info Overlay/Tag */}
          {data?.globalPayoutSettings?.nextPayoutDate && (
            <div className="absolute top-0 right-0 p-4">
              <div className="bg-[#1a5c3a] text-white px-3 py-2 rounded-xl border border-white/10 shadow-lg animate-pulse-subtle">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">Next Payout</p>
                <p className="text-[14px] font-bold">{data.globalPayoutSettings.nextPayoutDate}</p>
                {data.globalPayoutSettings.payoutNote && (
                  <p className="text-[10px] mt-1 opacity-80 leading-tight max-w-[120px] italic">
                    "{data.globalPayoutSettings.payoutNote}"
                  </p>
                )}
              </div>
            </div>
          )}
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
            recentPayments.map((p) => (
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
