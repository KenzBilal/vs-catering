import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { getRoleLabel, formatDate } from "../../lib/helpers";
import { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Users, MapPin, CalendarDays, Filter, Clock, Camera, ExternalLink, Search, IndianRupee } from "lucide-react";

import ConvexImage from "../../components/shared/ConvexImage";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import EmptyState from "../../components/shared/EmptyState";
import toast from "react-hot-toast";

export default function AttendancePage() {
  const { user, token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const cateringRaw = useQuery(api.caterings.getCatering, { cateringId: id, token });
  const registrationsRaw = useQuery(api.registrations.getRegistrationsByCatering, { cateringId: id, token });
  const { data: catering, timedOut: catTimeout } = useQueryWithTimeout(cateringRaw);
  const { data: registrations, timedOut: regTimeout } = useQueryWithTimeout(registrationsRaw);
  const markAttendance = useMutation(api.registrations.markAttendance);
  const changeRole = useMutation(api.registrations.changeRole);

  if (catTimeout || regTimeout) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectionInput, setRejectionInput] = useState({});
  const [saving, setSaving] = useState({});
  const [viewPhoto, setViewPhoto] = useState(null); // { storageId, photoUrl }
  const [searchQuery, setSearchQuery] = useState("");
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const handleMark = async (regId, status, reason) => {
    setSaving((s) => ({ ...s, [regId]: true }));
    try {
      await markAttendance({ registrationId: regId, status, token, ...(reason ? { rejectionReason: reason } : {}) });
      toast.success(`Marked as ${status}`);
    } catch (e) {
      toast.error(e.message || `Failed to mark ${status}`);
    } finally {
      setSaving((s) => ({ ...s, [regId]: false }));
    }
  };

  const handleRoleChange = async (regId, role) => {
    try {
      await changeRole({ registrationId: regId, role, token });
      toast.success("Role updated");
    } catch (e) {
      toast.error(e.message || "Failed to update role");
    }
  };

  const filtered = (registrations || []).filter((r) => {
    if (roleFilter !== "all" && r.role !== roleFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (r.user?.name?.toLowerCase() || "").includes(q);
      const phoneMatch = (r.user?.phone || "").includes(q);
      if (!nameMatch && !phoneMatch) return false;
    }
    return true;
  });

  const roles = [...new Set((registrations || []).map((r) => r.role))];

  return (
    <div className="page-container" style={{ maxWidth: 760 }}>
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Attendance</h2>
        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
          <div className="flex flex-wrap items-center gap-4 text-[14px] text-stone-500 font-medium">
            <span className="flex items-center gap-1.5"><MapPin size={16} /> {catering?.place}</span>
            <span className="flex items-center gap-1.5">
              <CalendarDays size={16} /> 
              {catering ? (catering.isTwoDay ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}` : formatDate(catering.dates[0])) : ""}
            </span>
          </div>
          <button
            onClick={() => {
              if (catering?.status !== "ended") {
                toast.error("You can only schedule payouts for events that have ended.");
                return;
              }
              navigate(`/admin/settings/payouts?eventId=${id}`);
            }}
            className="flex items-center gap-1.5 text-[12px] font-bold text-[#8b3a00] bg-[#fdf0e6] px-3 py-1.5 rounded-xl border border-[#f5d0aa] hover:bg-white transition-all active:scale-95"
          >
            <IndianRupee size={14} /> Schedule Payout
          </button>
        </div>
      </div>


      {/* Search & Filters */}
      <div className="flex flex-col gap-3 mb-6 bg-cream-50 p-4 rounded-2xl border border-cream-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 bg-white border-cream-200 focus:border-stone-400 transition-all"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-stone-400" />
            <select 
              value={roleFilter} 
              onChange={(e) => setRoleFilter(e.target.value)} 
              className="w-auto pl-3 pr-10 py-2 text-[13px] font-bold"
            >
              <option value="all">All Roles</option>
              {roles.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
            </select>
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="w-auto pl-3 pr-10 py-2 text-[13px] font-bold"
          >
            <option value="all">All Status</option>
            <option value="registered">Not Marked</option>
            <option value="attended">Attended</option>
            <option value="absent">Absent</option>
            <option value="rejected">Rejected</option>
          </select>
          <button 
            onClick={() => setShowSummaryModal(true)}
            className="ml-auto text-[13px] font-semibold text-stone-500 bg-cream-200/50 hover:bg-cream-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors active:scale-95 border border-cream-300/30"
          >
            <Users size={14} />
            {filtered.length} student{filtered.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>

      {catering?.status === "upcoming" && (
        <div className="card text-center py-16 bg-white border-dashed">
          <Clock size={48} className="mx-auto text-cream-300 mb-4" />
          <p className="text-stone-500 font-bold text-[17px]">Attendance has not opened yet</p>
          <p className="text-stone-400 text-[14px] mt-2 max-w-sm mx-auto font-medium">
            You can mark attendance once the event status changes to Today or Tomorrow.
          </p>
        </div>
      )}

      {catering?.status !== "upcoming" && (
        <>
          {registrations === undefined && <LoadingState rows={3} />}
          {registrations !== undefined && filtered.length === 0 && (
            <EmptyState 
              icon={Users} 
              title="No registrations found" 
              description={searchQuery || roleFilter !== 'all' || statusFilter !== 'all' ? "Try adjusting your filters or search term." : "No students have registered for this event yet."}
            />
          )}          
          <div className="flex flex-col gap-4">
          {filtered.map((reg) => {
          const anyPaymentCleared = (registrations || []).some(r => r.paymentStatus === "cleared");
          const isEventLocked = !!catering?.payoutDate || anyPaymentCleared;
          
          const isPaid = reg.paymentStatus === "cleared";
          const isAttended = reg.status !== "registered";
          const isLocked = isPaid || isEventLocked;
          
          return (
            <div 
              key={reg._id} 
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
                    <p className={`font-bold text-[15.5px] truncate ${isPaid ? "text-stone-700" : "text-stone-900"}`}>
                      {reg.user?.name}
                    </p>
                    {isPaid && (
                      <span className="text-[9.5px] font-black text-[#1a5c3a] bg-[#e8f5ee] px-2 py-0.5 rounded-md uppercase tracking-tighter flex items-center gap-1">
                        <CheckCircle2 size={10} strokeWidth={3} /> Paid
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[12.5px] font-medium text-stone-500 mb-2">{reg.user?.phone}</p>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                      isPaid 
                        ? "bg-stone-100 border-stone-200 text-stone-600" 
                        : "bg-cream-50 border-cream-100 text-stone-700"
                    }`}>
                      {getRoleLabel(reg.role)}
                    </span>
                    
                    {isAttended && (
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wide ${
                        reg.status === "attended" 
                          ? "bg-[#e8f5ee] border-[#b8dfc8] text-[#1a5c3a]" 
                          : reg.status === "absent"
                            ? "bg-stone-100 border-stone-200 text-stone-500"
                            : "bg-red-50 border-red-100 text-red-600"
                      }`}>
                        {reg.status}
                      </span>
                    )}
                  </div>

                  {(reg.photoStorageId || reg.photoUrl) && (
                    <button 
                      onClick={() => setViewPhoto({ storageId: reg.photoStorageId, url: reg.photoUrl })}
                      className="flex items-center gap-1.5 mt-3 text-[11.5px] font-bold text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      <Camera size={14} /> View Student Photo
                    </button>
                  )}
                </div>

                {!isPaid && (
                  <div className="flex flex-col gap-3 w-full sm:w-auto sm:items-end">
                    {/* Role selector - only if not paid */}
                    <div className="relative">
                      <select
                        value={reg.role}
                        disabled={isLocked}
                        onChange={(e) => handleRoleChange(reg._id, e.target.value)}
                        className={`w-full sm:w-auto pl-3 pr-10 py-1.5 text-[12px] font-bold appearance-none bg-white border rounded-xl ${
                          isLocked ? "opacity-50 cursor-not-allowed border-stone-100" : "border-cream-200"
                        }`}
                      >
                        {["service_boy", "service_girl", "captain_male", "captain_female"].filter(r => {
                          if (reg.user?.gender === "male") return r === "service_boy" || r === "captain_male";
                          return r === "service_girl" || r === "captain_female";
                        }).map((r) => (
                          <option key={r} value={r}>{getRoleLabel(r)}</option>
                        ))}
                      </select>
                      {!isLocked && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                          <Filter size={12} />
                        </div>
                      )}
                    </div>

                    {/* Status buttons - only if not paid */}
                    <div className="flex gap-2">
                      <button
                        disabled={saving[reg._id] || isLocked}
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
                        disabled={saving[reg._id] || isLocked}
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
                      value={rejectionInput[reg._id] || ""}
                      disabled={isLocked}
                      onChange={(e) => setRejectionInput((prev) => ({ ...prev, [reg._id]: e.target.value }))}
                      className="flex-1 bg-white border border-cream-200 text-stone-800 rounded-xl px-3 py-2 text-[12.5px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all disabled:opacity-50"
                    />
                    <button
                      disabled={saving[reg._id] || isLocked}
                      onClick={() => handleMark(reg._id, "rejected", rejectionInput[reg._id])}
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
        })}
          </div>
        </>
      )}


      {/* Photo View Modal */}
      {viewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setViewPhoto(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-cream-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-stone-900">Student Photo</h3>
              <button onClick={() => setViewPhoto(null)} className="p-2 hover:bg-cream-100 rounded-full transition-colors">
                <XCircle size={20} className="text-stone-400" />
              </button>
            </div>
            <div className="bg-cream-50 p-4 flex items-center justify-center min-h-[300px]">
              {viewPhoto.storageId ? (
                <ConvexImage storageId={viewPhoto.storageId} className="max-w-full max-h-[70vh] rounded-xl shadow-lg" />
              ) : (
                <img src={viewPhoto.url} className="max-w-full max-h-[70vh] rounded-xl shadow-lg" alt="Legacy Photo" />
              )}
            </div>
            {viewPhoto.url && !viewPhoto.storageId && (
              <div className="p-4 bg-white text-center">
                <a 
                  href={viewPhoto.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[13px] font-bold text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <ExternalLink size={14} /> Open original link
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Registration Summary Modal */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowSummaryModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-cream-100 flex justify-between items-center bg-white">
              <h3 className="font-bold text-stone-900">Registration Summary</h3>
              <button onClick={() => setShowSummaryModal(false)} className="p-2 hover:bg-cream-100 rounded-full transition-colors">
                <XCircle size={20} className="text-stone-400" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 flex flex-col gap-2 bg-cream-50/30">
              {filtered.map((r, i) => (
                <div key={r._id} className="flex items-center justify-between p-3 bg-white border border-cream-100 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center bg-stone-100 text-stone-400 text-[10px] font-bold rounded-full">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-[14px] font-bold text-stone-900 leading-tight">{r.user?.name}</p>
                      <p className="text-[12px] text-stone-500 font-medium">{r.user?.phone}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    r.status === 'attended' ? 'bg-green-100 text-green-700' :
                    r.status === 'absent' ? 'bg-stone-100 text-stone-500' :
                    r.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-cream-200 text-stone-600'
                  }`}>
                    {r.status === 'registered' ? 'Wait' : r.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white border-t border-cream-100 text-center">
               <p className="text-[11px] text-stone-400 font-medium tracking-tight">Viewing {filtered.length} students based on your filters.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
