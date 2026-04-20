import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { formatCurrency, getRoleLabel, formatDate } from "../../lib/helpers";
import { useState } from "react";
import { ArrowLeft, MapPin, CalendarDays, CheckCircle2, Clock, IndianRupee, HandCoins, Users2, UserPlus, X, Trash2, ShieldCheck, Search } from "lucide-react";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import EmptyState from "../../components/shared/EmptyState";
import toast from "react-hot-toast";

export default function PaymentsPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const cateringRaw = useQuery(api.caterings.getCatering, { cateringId: id, token });
  const registrationsRaw = useQuery(api.registrations.getRegistrationsByCatering, { cateringId: id, token });
  const paymentsRaw = useQuery(api.payments.getPaymentsByCatering, { cateringId: id, token });
  
  const { data: catering, timedOut: catTimeout } = useQueryWithTimeout(cateringRaw);
  const { data: registrations, timedOut: regTimeout } = useQueryWithTimeout(registrationsRaw);
  const { data: payments, timedOut: payTimeout } = useQueryWithTimeout(paymentsRaw);
  
  const createPayment = useMutation(api.payments.createPayment);
  const clearPayment = useMutation(api.payments.clearPayment);
  const createGroup = useMutation(api.payments.createPaymentGroup);
  const clearGroup = useMutation(api.payments.clearPaymentGroup);
  const disbandGroup = useMutation(api.payments.disbandGroup);

  const [upiRefs, setUpiRefs] = useState({});
  const [methods, setMethods] = useState({});
  const [saving, setSaving] = useState({});
  const [confirmClear, setConfirmClear] = useState(null);
  const [confirmClearGroup, setConfirmClearGroup] = useState(null);

  // Group Creation State
  const [selectedReg, setSelectedReg] = useState(null); // For the initial options modal
  const [groupHead, setGroupHead] = useState(null); // The student being clicked to start a group
  const [selectedMembers, setSelectedMembers] = useState([]); // Array of registration IDs
  const [memberSearchQuery, setMemberSearchQuery] = useState("");

  if (catTimeout || regTimeout || payTimeout) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  // Only attended students
  const attendedRegs = (registrations || []).filter((r) => r.status === "attended");

  const getPaymentForReg = (regId) => (payments || []).find((p) => p.registrationId === regId);

  const getPayForRole = (role, day) => {
    const slot = catering?.slots.find((s) => s.role === role && s.day === day);
    return slot?.pay || 0;
  };

  const handleCreatePayment = async (reg) => {
    const pay = getPayForRole(reg.role, reg.days[0]);
    const method = methods[reg._id] || "cash";
    setSaving((s) => ({ ...s, [reg._id]: true }));
    try {
      await createPayment({
        cateringId: id,
        registrationId: reg._id,
        day: reg.days[0],
        role: reg.role,
        amount: pay,
        method,
        token,
      });
      toast.success("Payment added to pending");
    } catch (e) {
      toast.error(e.message || "Failed to create payment");
    } finally {
      setSaving((s) => ({ ...s, [reg._id]: false }));
    }
  };

  const handleClearPayment = async (paymentId) => {
    setSaving((s) => ({ ...s, [paymentId]: true }));
    try {
      await clearPayment({
        paymentId,
        upiRef: upiRefs[paymentId] || undefined,
        token,
      });
      setConfirmClear(null);
      toast.success("Payment marked as paid");
    } catch (e) {
      toast.error(e.message || "Failed to clear payment");
    } finally {
      setSaving((s) => ({ ...s, [paymentId]: false }));
    }
  };

  const handleCreateGroup = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Select at least one team member.");
      return;
    }
    
    setSaving((s) => ({ ...s, "group": true }));
    try {
      // Include the head in the members list
      const allMembers = [groupHead._id, ...selectedMembers];
      await createGroup({
        cateringId: id,
        headUserId: groupHead.userId,
        memberRegIds: allMembers,
        token,
      });
      toast.success("Team created successfully");
      setGroupHead(null);
      setSelectedMembers([]);
    } catch (e) {
      toast.error(e.message || "Failed to create team");
    } finally {
      setSaving((s) => ({ ...s, "group": false }));
    }
  };

  const handleClearGroup = async (groupId) => {
    setSaving((s) => ({ ...s, [groupId]: true }));
    try {
      await clearGroup({ groupId, token });
      setConfirmClearGroup(null);
      toast.success("Group payment cleared");
    } catch (e) {
      toast.error(e.message || "Failed to clear group");
    } finally {
      setSaving((s) => ({ ...s, [groupId]: false }));
    }
  };

  const handleDisbandGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to disband this team?")) return;
    try {
      await disbandGroup({ groupId, token });
      toast.success("Team disbanded");
    } catch (e) {
      toast.error(e.message || "Failed to disband team");
    }
  };

  const totalPaid = (payments || []).filter((p) => p.status === "cleared").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = (payments || []).filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Payments</h2>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-[14px] text-stone-500 font-medium">
          <span className="flex items-center gap-1.5"><MapPin size={16} /> {catering?.place}</span>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={16} /> 
            {catering ? (catering.isTwoDay ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}` : formatDate(catering.dates[0])) : ""}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1">
            <CheckCircle2 size={14} /> Attended
          </div>
          <p className="text-3xl font-black text-stone-800">{attendedRegs.length}</p>
        </div>
        <div className="bg-[#e8f5ee] border border-[#b8dfc8] rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2d7a52] uppercase tracking-widest mb-1">
            <IndianRupee size={14} /> Paid Out
          </div>
          <p className="text-3xl font-black text-[#1a5c3a]">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-[#fdf0e6] border border-[#f5d0aa] rounded-2xl p-5 shadow-sm flex flex-col items-center justify-center">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#a05020] uppercase tracking-widest mb-1">
            <Clock size={14} /> Pending
          </div>
          <p className="text-3xl font-black text-[#8b3a00]">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {catering?.status === "upcoming" && (
        <EmptyState 
          icon={Clock} 
          title="Event has not started yet" 
          description="Payment management will be available once the event starts and attendance is marked." 
        />
      )}

      {catering?.status !== "upcoming" && registrations === undefined && <LoadingState rows={3} />}

      {catering?.status !== "upcoming" && registrations !== undefined && attendedRegs.length === 0 && (
        <EmptyState 
          icon={HandCoins} 
          title="No attended students yet" 
          description="Mark attendance first before managing payments." 
        />
      )}

      {catering?.status !== "upcoming" && attendedRegs.length > 0 && (
        <div className="flex flex-col gap-4">
        {attendedRegs.map((reg) => {
          const payment = getPaymentForReg(reg._id);
          const pay = getPayForRole(reg.role, reg.days[0]);
          const isGroupHead = payment?.group && payment?.group?.headUserId === reg.userId;
          const isMember = payment?.group && payment?.group?.headUserId !== reg.userId;

          return (
            <div 
              key={reg._id} 
              onClick={() => {
                if (!payment || payment.status === 'cleared') return;
                setSelectedReg(reg);
              }}
              className={`card bg-white p-5 hover:border-stone-300 transition-all cursor-pointer group animate-fade-in ${payment?.status === 'pending' ? 'ring-1 ring-transparent hover:ring-stone-200' : ''}`}
            >
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-10 h-10 rounded-xl flex items-center justify-center border ${isGroupHead ? 'bg-stone-900 border-stone-800 text-cream-50' : isMember ? 'bg-cream-100 border-cream-200 text-stone-400' : 'bg-stone-50 border-stone-100 text-stone-400'}`}>
                    {isGroupHead ? <ShieldCheck size={20} /> : <HandCoins size={20} />}
                  </div>
                  <div>
                    <p className="font-bold text-[16px] text-stone-900 flex items-center gap-2">
                      {reg.user?.name}
                      {isGroupHead && (
                        <span className="bg-stone-900 text-cream-50 text-[9px] font-bold uppercase tracking-tight px-2 py-0.5 rounded-full">Team Head</span>
                      )}
                    </p>
                    <p className="text-[13px] text-stone-500 mt-0.5 font-medium">
                      {reg.user?.phone} <span className="mx-1.5">•</span> {getRoleLabel(reg.role)}
                    </p>
                  </div>
                </div>
                <div className="bg-cream-100 border border-cream-200 px-3 py-1.5 rounded-lg flex flex-col items-end">
                  <p className="font-bold text-[16px] text-stone-900">{formatCurrency(pay)}</p>
                  {isGroupHead && (
                    <p className="text-[10px] font-bold text-stone-500 uppercase mt-0.5">Team Total: {formatCurrency(payment.group.totalAmount)}</p>
                  )}
                </div>
              </div>

              {!payment && (
                 <div className="pt-4 border-t border-cream-100 flex items-center justify-between">
                    <p className="text-[12px] font-medium text-stone-400">Payment not initialized yet.</p>
                    <button className="text-[12px] font-bold text-stone-900 hover:underline" onClick={(e) => { e.stopPropagation(); handleCreatePayment(reg); }}>Initialize Now</button>
                 </div>
              )}

              {payment && payment.status === "pending" && (
                <div className="pt-4 border-t border-cream-100">
                  {isMember ? (
                    <div className="flex items-center justify-between">
                       <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400 bg-stone-50 border border-stone-100 rounded-full px-2.5 py-1">
                        <Users2 size={12} /> Part of {payment.groupHead?.name}'s Team
                      </span>
                      <p className="text-[11px] font-medium text-stone-400">Paid to Head</p>
                    </div>
                  ) : isGroupHead ? (
                    <div className="flex flex-col gap-3">
                       <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8b3a00] bg-[#fdf0e6] border border-[#f5d0aa] rounded-full px-2.5 py-1">
                          <Users2 size={12} /> TEAM PENDING (Total: {formatCurrency(payment.group.totalAmount)})
                        </span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDisbandGroup(payment.group._id); }}
                          className="text-stone-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {confirmClearGroup === payment.group._id ? (
                        <div className="flex items-center gap-2 animate-fade-in">
                          <button
                            className="btn-primary flex-1 py-2 text-[13px] bg-[#1a5c3a] hover:bg-[#134229] border-[#1a5c3a]"
                            disabled={saving[payment.group._id]}
                            onClick={(e) => { e.stopPropagation(); handleClearGroup(payment.group._id); }}
                          >
                            <CheckCircle2 size={16} /> Confirm Bulk Payment
                          </button>
                          <button className="btn-secondary py-2 text-[13px]" onClick={(e) => { e.stopPropagation(); setConfirmClearGroup(null); }}>Cancel</button>
                        </div>
                      ) : (
                        <button
                          className="btn-primary w-full py-2.5 text-[13px]"
                          onClick={(e) => { e.stopPropagation(); setConfirmClearGroup(payment.group._id); }}
                        >
                          Mark Team as Paid
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8b3a00] bg-[#fdf0e6] border border-[#f5d0aa] rounded-full px-2.5 py-1">
                          <Clock size={12} /> Pending
                        </span>
                      </div>
                      
                      {confirmClear === payment._id ? (
                        <div className="flex items-center gap-2 animate-fade-in">
                          <button
                            className="btn-primary py-2 text-[13px] bg-[#1a5c3a] hover:bg-[#134229] border-[#1a5c3a]"
                            disabled={saving[payment._id]}
                            onClick={(e) => { e.stopPropagation(); handleClearPayment(payment._id); }}
                          >
                            Confirm
                          </button>
                          <button className="btn-secondary py-2 text-[13px]" onClick={(e) => { e.stopPropagation(); setConfirmClear(null); }}>Cancel</button>
                        </div>
                      ) : (
                        <button
                          className="btn-primary py-2 text-[13px] px-4"
                          onClick={(e) => { e.stopPropagation(); setConfirmClear(payment._id); }}
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {payment && payment.status === "cleared" && (
                <div className="pt-4 border-t border-cream-100 flex flex-wrap items-center gap-3">
                  <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1 border ${isMember ? 'text-stone-400 bg-stone-50 border-stone-100' : 'text-[#1a5c3a] bg-[#e8f5ee] border-[#b8dfc8]'}`}>
                    <CheckCircle2 size={12} /> {isMember ? 'PAID TO HEAD' : 'PAID'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}

      {/* Options Modal */}
      {selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedReg(null)}>
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-up" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-stone-900 mb-1">Payment Strategy</h3>
              <p className="text-[13px] text-stone-500 mb-6">Choose how you want to handle {selectedReg.user?.name}'s payment.</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setConfirmClear(getPaymentForReg(selectedReg._id)._id);
                    setSelectedReg(null);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-stone-50 border border-stone-100 rounded-xl hover:bg-stone-100 transition-all text-left"
                >
                  <div>
                    <p className="font-bold text-stone-900 text-[14px]">Individual Payout</p>
                    <p className="text-[12px] text-stone-500">Pay only this student directly.</p>
                  </div>
                  <IndianRupee className="text-stone-400" size={20} />
                </button>

                <button 
                  onClick={() => {
                    setGroupHead(selectedReg);
                    setSelectedReg(null);
                  }}
                  className="w-full flex items-center justify-between p-4 bg-cream-50 border border-cream-100 rounded-xl hover:bg-cream-100 transition-all text-left"
                >
                  <div>
                    <p className="font-bold text-stone-900 text-[14px]">Create Team</p>
                    <p className="text-[12px] text-stone-500">Pay multiple students via {selectedReg.user?.name}.</p>
                  </div>
                  <Users2 className="text-stone-400" size={20} />
                </button>
              </div>

              <button className="w-full mt-4 text-[13px] font-bold text-stone-400 py-2" onClick={() => setSelectedReg(null)}>Cancel</button>
           </div>
        </div>
      )}

      {/* Group Creation Modal */}
      {groupHead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full flex flex-col max-h-[85vh] animate-scale-up overflow-hidden">
            <div className="p-6 border-b border-cream-100 flex justify-between items-center bg-stone-900 text-cream-50">
               <div>
                  <h3 className="text-lg font-bold">Create Team</h3>
                  <p className="text-[12px] text-cream-100/60 font-medium tracking-tight uppercase">Head: {groupHead.user?.name}</p>
               </div>
               <button onClick={() => { setGroupHead(null); setSelectedMembers([]); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                 <X size={20} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-cream-50/30">
              <div className="mb-6 relative">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                 <input 
                  type="text" 
                  placeholder="Search by name or phone..."
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-cream-200 focus:border-stone-400 py-2.5 text-[14px]"
                 />
              </div>

              <p className="text-[11px] font-black text-stone-400 uppercase tracking-widest mb-4">Available Members</p>
              <div className="flex flex-col gap-2">
                {attendedRegs
                  .filter(r => r._id !== groupHead._id && !getPaymentForReg(r._id)?.groupId && getPaymentForReg(r._id)?.status !== 'cleared')
                  .filter(r => {
                    if (!memberSearchQuery.trim()) return true;
                    const q = memberSearchQuery.toLowerCase().trim();
                    return (r.user?.name?.toLowerCase().includes(q)) || (r.user?.phone?.includes(q));
                  })
                  .map(r => {
                    const isSelected = selectedMembers.includes(r._id);
                    return (
                      <div 
                        key={r._id} 
                        onClick={() => setSelectedMembers(prev => isSelected ? prev.filter(id => id !== r._id) : [...prev, r._id])}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${isSelected ? 'bg-stone-900 border-stone-800 text-cream-50 shadow-lg scale-[1.02]' : 'bg-white border-cream-200 text-stone-900 hover:border-stone-300'}`}
                      >
                         <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isSelected ? 'bg-stone-800 text-cream-50' : 'bg-cream-100 text-stone-500'}`}>
                             {isSelected ? <ShieldCheck size={16} /> : <UserPlus size={16} />}
                           </div>
                           <div>
                             <p className={`text-[14px] font-bold ${isSelected ? 'text-cream-50' : 'text-stone-900'}`}>{r.user?.name}</p>
                             <p className={`text-[11px] font-medium ${isSelected ? 'text-cream-200/60' : 'text-stone-400'}`}>{getRoleLabel(r.role)} • {formatCurrency(getPayForRole(r.role, r.days[0]))}</p>
                           </div>
                         </div>
                         {isSelected && <CheckCircle2 size={20} className="text-cream-50" />}
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="p-6 bg-white border-t border-cream-100">
               <div className="flex items-center justify-between mb-4">
                  <p className="text-[13px] font-bold text-stone-500">Selected Members: <span className="text-stone-900">{selectedMembers.length + 1}</span></p>
                  <p className="text-lg font-black text-stone-900">
                    {formatCurrency(
                      (selectedMembers.reduce((sum, rid) => sum + getPayForRole(registrations.find(r => r._id === rid).role, registrations.find(r => r._id === rid).days[0]), 0)) + 
                      getPayForRole(groupHead.role, groupHead.days[0])
                    )}
                  </p>
               </div>
               <button 
                onClick={handleCreateGroup}
                disabled={saving["group"]}
                className="btn-primary w-full py-4 text-[15px] rounded-2xl shadow-xl shadow-stone-200"
               >
                 {saving["group"] ? "Creating Team..." : "Confirm & Create Team"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
