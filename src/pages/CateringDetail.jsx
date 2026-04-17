import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import {
  formatDate,
  formatCurrency,
  getRoleLabel,
  getStatusBadgeClass,
  getStatusLabel,
  generateWhatsAppMessage,
  getTimeOfDayLabel,
  formatTime12h,
} from "../lib/helpers";
import { useState } from "react";
import { ArrowLeft, MapPin, CalendarDays, Clock, Camera, AlertCircle, Link as LinkIcon, Edit, UserCheck, CreditCard, Share2, Users, CheckCircle2, User, Phone, Hash, Home, XCircle } from "lucide-react";
import ConvexImage from "../components/shared/ConvexImage";
import { useQueryWithTimeout } from "../hooks/useQueryWithTimeout";
import ErrorState from "../components/shared/ErrorState";

export default function CateringDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const cateringRaw = useQuery(api.caterings.getCatering, { cateringId: id });
  const registrationsRaw = useQuery(api.registrations.getRegistrationsByCatering, { cateringId: id });
  const { data: catering, timedOut: catTimeout } = useQueryWithTimeout(cateringRaw);
  const { data: registrations, timedOut: regTimeout } = useQueryWithTimeout(registrationsRaw);
  const [copied, setCopied] = useState(false);
  const [viewUser, setViewUser] = useState(null); // { name, photo, phone, stayType, registrationNumber }

  if (catTimeout || regTimeout) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const isAdmin = user?.role === "admin" || user?.role === "sub_admin";

  if (catering === undefined) {
    return <div className="page-container"><p className="text-stone-500 animate-pulse">Loading event details...</p></div>;
  }

  if (!catering) {
    return <div className="page-container"><p className="text-stone-500">Event not found.</p></div>;
  }

  const myReg = registrations?.find((r) => r.userId === user?._id);

  const dropCounts = {};
  (registrations || []).forEach((r) => {
    dropCounts[r.dropPoint] = (dropCounts[r.dropPoint] || 0) + 1;
  });

  const roleCounts = {};
  (registrations || []).forEach((r) => {
    const key = `${r.role}-${r.days[0]}`;
    roleCounts[key] = (roleCounts[key] || 0) + 1;
  });

  const handleCopyMessage = () => {
    const url = `${window.location.origin}/catering/${catering._id}`;
    const msg = generateWhatsAppMessage(catering, url);
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-2">
          <h2 className="text-2xl font-bold text-stone-900 tracking-tight leading-tight">
            {catering.place}
          </h2>
          <span className={`${getStatusBadgeClass(catering.status)} self-start`}>
            {getStatusLabel(catering.status)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-2 text-[14px] text-stone-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={16} />
            {catering.isTwoDay
              ? `${formatDate(catering.dates[0])} and ${formatDate(catering.dates[1])}`
              : formatDate(catering.dates[0])}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={16} />
            {formatTime12h(catering.specificTime)} ({getTimeOfDayLabel(catering.timeOfDay)})
          </span>
        </div>
      </div>

      {/* Info grids */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <InfoItem icon={<MapPin size={16}/>} label="Pickup" value="Main Gate" />
        <InfoItem icon={<Camera size={16}/>} label="Photo Required" value={catering.photoRequired ? "Yes" : "No"} />
        {catering.isTwoDay && (
          <InfoItem
            icon={<AlertCircle size={16}/>}
            label="Joining Rule"
            value={catering.joinRule === "both_days" ? "Both Days" : "Either Day"}
          />
        )}
      </div>

      {/* Slots */}
      <div className="card mb-6 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-stone-400" size={18} />
          <h3 className="section-title !mb-0">Roles and Pay</h3>
        </div>
        <div className="flex flex-col gap-3">
          {catering.slots.filter(s => s.limit > 0).map((s, i) => {
            const key = `${s.role}-${s.day}`;
            const filled = roleCounts[key] || 0;
            const confirmed = Math.min(filled, s.limit);
            const waiting = Math.max(0, filled - s.limit);

            return (
              <div key={i} className="flex justify-between items-center px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl">
                <div>
                  <p className="font-semibold text-[15px] text-stone-900 flex items-center gap-2">
                    {getRoleLabel(s.role)}
                    {catering.isTwoDay && (
                      <span className="text-[11px] bg-cream-200 text-stone-600 px-2 py-0.5 rounded-full font-bold">
                        Day {s.day + 1}
                      </span>
                    )}
                  </p>
                  <p className="text-[13px] text-stone-500 font-medium mt-1">
                    <span className={confirmed >= s.limit ? "text-[#1a5c3a]" : ""}>{confirmed}/{s.limit} confirmed</span>
                    {waiting > 0 && <span className="text-orange-600"> · {waiting} waitlist</span>}
                  </p>
                </div>
                <p className="font-bold text-[16px] text-stone-900 bg-white px-3 py-1 rounded-lg border border-cream-200 shadow-sm">
                  {formatCurrency(s.pay)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dress Code */}
      <div className="card mb-6 p-6">
        <h3 className="section-title">Dress Code</h3>
        <p className="text-[14.5px] text-stone-600 whitespace-pre-wrap leading-relaxed">
          {catering.dressCodeNotes}
        </p>
      </div>

      {/* Admin sections */}
      {isAdmin && registrations && registrations.length > 0 && (
        <div className="card mb-6 p-6">
          <h3 className="section-title">Drop Point Summary</h3>
          <div className="flex flex-col gap-2 mt-4">
            {Object.entries(dropCounts).map(([point, count]) => (
              <div key={point} className="flex justify-between items-center text-[14.5px] py-2 border-b border-cream-100 last:border-0">
                <span className="text-stone-600 font-medium">{point}</span>
                <span className="font-bold text-stone-900 bg-cream-100 px-2 py-0.5 rounded-md">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="card mb-6 p-6 border-stone-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="section-title !mb-0 flex items-center gap-2"><Share2 size={18} className="text-stone-400"/> Share on WhatsApp</h3>
            <button className="btn-secondary py-1.5 px-3 text-[12px]" onClick={handleCopyMessage}>
              {copied ? <span className="text-[#1a5c3a] font-bold">Copied!</span> : "Copy"}
            </button>
          </div>
          <div className="bg-cream-50 border border-cream-200 rounded-xl p-4 text-[13px] text-stone-600 whitespace-pre-wrap font-mono leading-relaxed max-h-[200px] overflow-y-auto">
            {generateWhatsAppMessage(catering, `${window.location.origin}/catering/${catering._id}`)}
          </div>
        </div>
      )}

      {/* Actions */}
      {isAdmin && (
        <div className="flex flex-wrap gap-3 mb-6">
          <button className="btn-secondary flex-1" onClick={() => navigate(`/admin/catering/${id}/attendance`)}>
            <UserCheck size={16} /> Manage Attendance
          </button>
          <button className="btn-secondary flex-1" onClick={() => navigate(`/admin/catering/${id}/payments`)}>
            <CreditCard size={16} /> Manage Payments
          </button>
          {user?.role === "admin" && (
            <button className="btn-secondary" onClick={() => navigate(`/admin/catering/${id}/edit`)}>
              <Edit size={16} /> Edit
            </button>
          )}
        </div>
      )}

      {/* Registered Students Section */}
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

      {/* User Info Modal */}
      {viewUser && (
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
      )}

      {/* Register button for students */}
      {!isAdmin && catering.status !== "ended" && (
        <div className="mt-8 mb-4">
          {myReg ? (
            <div className="bg-[#e8f5ee] border border-[#b8dfc8] rounded-xl p-5 text-center shadow-sm">
              <div className="flex justify-center mb-2 text-[#1a5c3a]"><CheckCircle2 size={24} /></div>
              <p className="font-bold text-[16px] text-[#1a5c3a] mb-1">You are registered</p>
              <p className="text-[14px] text-[#2d7a52] font-medium">
                {getRoleLabel(myReg.role)} <span className="mx-1.5">•</span> 
                {myReg.isConfirmed ? "Confirmed" : "Waitlisted"} <span className="mx-1.5">•</span> 
                Drop: {myReg.dropPoint}
              </p>
            </div>
          ) : (
            <button className="btn-primary w-full py-4 text-[16px]" onClick={() => navigate(`/catering/${id}/register`)}>
              Register for Event
            </button>
          )}
        </div>
      )}
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
