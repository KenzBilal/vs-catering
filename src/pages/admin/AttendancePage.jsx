import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { getRoleLabel, formatDate } from "../../lib/helpers";
import { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Users, MapPin, CalendarDays, Filter } from "lucide-react";

export default function AttendancePage() {
  const { user, token } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const catering = useQuery(api.caterings.getCatering, { cateringId: id });
  const registrations = useQuery(api.registrations.getRegistrationsByCatering, { cateringId: id });
  const markAttendance = useMutation(api.registrations.markAttendance);
  const changeRole = useMutation(api.registrations.changeRole);

  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rejectionInput, setRejectionInput] = useState({});
  const [saving, setSaving] = useState({});

  const handleMark = async (regId, status, reason) => {
    setSaving((s) => ({ ...s, [regId]: true }));
    try {
      await markAttendance({ registrationId: regId, status, token, ...(reason ? { rejectionReason: reason } : {}) });
    } finally {
      setSaving((s) => ({ ...s, [regId]: false }));
    }
  };

  const handleRoleChange = async (regId, role) => {
    await changeRole({ registrationId: regId, role, token });
  };

  const filtered = (registrations || []).filter((r) => {
    if (roleFilter !== "all" && r.role !== roleFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
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
        <div className="flex flex-wrap items-center gap-4 mt-2 text-[14px] text-stone-500 font-medium">
          <span className="flex items-center gap-1.5"><MapPin size={16} /> {catering?.place}</span>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={16} /> 
            {catering ? (catering.isTwoDay ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}` : formatDate(catering.dates[0])) : ""}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-cream-50 p-3 rounded-xl border border-cream-200 shadow-sm">
        <Filter size={16} className="text-stone-400 ml-1" />
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)} 
          className="bg-white border border-cream-200 text-stone-700 text-[13px] font-medium rounded-lg px-3 py-2 w-auto outline-none focus:ring-2 focus:ring-stone-800/10 cursor-pointer"
        >
          <option value="all">All Roles</option>
          {roles.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
        </select>
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)} 
          className="bg-white border border-cream-200 text-stone-700 text-[13px] font-medium rounded-lg px-3 py-2 w-auto outline-none focus:ring-2 focus:ring-stone-800/10 cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="registered">Not Marked</option>
          <option value="attended">Attended</option>
          <option value="absent">Absent</option>
          <option value="rejected">Rejected</option>
        </select>
        <div className="ml-auto text-[13px] font-semibold text-stone-500 bg-cream-200/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
          <Users size={14} />
          {filtered.length} student{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {registrations === undefined && <p className="text-stone-500 text-[14px] animate-pulse">Loading students...</p>}
      {registrations?.length === 0 && <p className="text-stone-500 text-[14px]">No registrations yet.</p>}

      <div className="flex flex-col gap-4">
        {filtered.map((reg) => (
          <div key={reg._id} className="card bg-white hover:border-cream-300 transition-colors animate-fade-in p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <div>
                <p className="font-semibold text-[15px] text-stone-900 flex items-center gap-2">
                  {reg.user?.name}
                  {!reg.isConfirmed && (
                    <span className="bg-orange-100 text-orange-800 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider">
                      Waitlist #{reg.queuePosition}
                    </span>
                  )}
                </p>
                <p className="text-[13px] text-stone-500 mt-0.5">{reg.user?.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={reg.role}
                  onChange={(e) => handleRoleChange(reg._id, e.target.value)}
                  className="bg-cream-50 border border-cream-200 text-stone-700 text-[12px] font-medium rounded-md px-2 py-1.5 w-auto outline-none focus:ring-2 focus:ring-stone-800/10 cursor-pointer"
                >
                  {["service_boy", "service_girl", "captain_male"].map((r) => (
                    <option key={r} value={r}>{getRoleLabel(r)}</option>
                  ))}
                </select>
                <span className="text-[12px] font-medium text-stone-400">→</span>
                <span className="text-[12px] font-medium text-stone-600 bg-cream-100 px-2 py-1.5 rounded-md border border-cream-200">
                  {reg.dropPoint}
                </span>
              </div>
            </div>

            {/* Status buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                disabled={saving[reg._id]}
                onClick={() => handleMark(reg._id, "attended")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] ${
                  reg.status === "attended" 
                    ? "bg-[#e8f5ee] text-[#1a5c3a] border border-[#b8dfc8] shadow-sm" 
                    : "bg-white text-stone-500 border border-cream-200 hover:bg-cream-50"
                }`}
              >
                <CheckCircle2 size={16} /> Attended
              </button>
              <button
                disabled={saving[reg._id]}
                onClick={() => handleMark(reg._id, "absent")}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] ${
                  reg.status === "absent" 
                    ? "bg-[#f0ece8] text-[#5c524a] border border-[#d8cfc8] shadow-sm" 
                    : "bg-white text-stone-500 border border-cream-200 hover:bg-cream-50"
                }`}
              >
                <XCircle size={16} /> Absent
              </button>
            </div>

            {/* Rejection */}
            <div className="mt-4 pt-4 border-t border-cream-100">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Rejection reason (e.g., incomplete uniform)"
                  value={rejectionInput[reg._id] || ""}
                  onChange={(e) => setRejectionInput((prev) => ({ ...prev, [reg._id]: e.target.value }))}
                  className="flex-1 bg-white border border-cream-200 text-stone-800 rounded-lg px-3 py-2 text-[13px] outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 transition-all"
                />
                <button
                  disabled={saving[reg._id]}
                  onClick={() => handleMark(reg._id, "rejected", rejectionInput[reg._id])}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 active:scale-[0.98] whitespace-nowrap ${
                    reg.status === "rejected" 
                      ? "bg-red-50 text-red-700 border border-red-200 shadow-sm" 
                      : "bg-white text-red-600 border border-red-100 hover:bg-red-50"
                  }`}
                >
                  <AlertCircle size={16} /> Mark Rejected
                </button>
              </div>

              {reg.status === "rejected" && reg.rejectionReason && (
                <p className="flex items-center gap-1.5 text-[12px] font-medium text-red-600 mt-2 bg-red-50/50 p-2 rounded-md">
                  <AlertCircle size={14} /> Reason: {reg.rejectionReason}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
