import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { getRoleLabel, formatDate, formatCurrency, DRESS_CODE_DEFAULTS } from "../lib/helpers";
import { ArrowLeft, CheckCircle2, UserCheck, MapPin, Link as LinkIcon, AlertCircle, Shirt } from "lucide-react";

export default function Register() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const catering = useQuery(api.caterings.getCatering, { cateringId: id });
  const dropPoints = useQuery(api.dropPoints.getDropPoints);
  const registerMutation = useMutation(api.registrations.register);

  const [role, setRole] = useState("");
  const [dropPoint, setDropPoint] = useState(user?.defaultDropPoint || "Main Gate");
  const [selectedDays, setSelectedDays] = useState([0]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (catering === undefined) {
    return <div className="page-container"><p className="text-stone-500 animate-pulse">Loading...</p></div>;
  }

  if (!catering) {
    return <div className="page-container"><p className="text-stone-500">Catering not found.</p></div>;
  }

  const availableRoles = [...new Set(catering.slots.filter((s) => s.day === 0).map((s) => s.role))];

  const daysToRegister = catering.isTwoDay && catering.joinRule === "both_days" ? [0, 1] : selectedDays;

  const handleDayToggle = (day) => {
    if (catering.joinRule === "both_days") return;
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  const handleSubmit = async () => {
    setError("");
    if (!role) return setError("Please select a role.");
    if (daysToRegister.length === 0) return setError("Please select at least one day.");
    if (catering.photoRequired && !photoUrl.trim()) return setError("A photo link is required for this catering.");

    setLoading(true);
    try {
      await registerMutation({
        userId: user._id,
        cateringId: id,
        days: daysToRegister,
        role,
        dropPoint,
        ...(catering.photoRequired ? { photoUrl } : {}),
      });
      setDone(true);
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="page-container" style={{ maxWidth: 500 }}>
        <div className="card text-center p-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-[#e8f5ee] rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 size={32} className="text-[#1a5c3a]" />
          </div>
          <p className="text-2xl font-bold text-stone-900 mb-2 tracking-tight">Registered</p>
          <p className="text-[14.5px] text-stone-500 mb-8 font-medium">
            You are registered for {catering.place}. Your spot will be confirmed by admins soon.
          </p>
          <button className="btn-primary w-full py-3.5" onClick={() => navigate(`/catering/${id}`)}>
            View Event Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 500 }}>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">Register</h2>
        <p className="text-[14.5px] font-medium text-stone-500 flex items-center gap-1.5">
          <MapPin size={16} className="text-stone-400" />
          {catering.place} <span className="mx-1">•</span> 
          {catering.isTwoDay ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}` : formatDate(catering.dates[0])}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <label className="label">Select Role</label>
          <div className="flex flex-col gap-2">
            {availableRoles.map((r) => {
              const slot = catering.slots.find((s) => s.role === r && s.day === 0);
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex justify-between items-center px-4 py-3 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
                    isSelected 
                      ? "bg-stone-800 border-stone-800 shadow-md text-cream-50" 
                      : "bg-white border-cream-200 hover:border-stone-300 text-stone-800"
                  }`}
                >
                  <span className="font-semibold text-[15px]">{getRoleLabel(r)}</span>
                  {slot && <span className={`text-[14px] font-bold ${isSelected ? "text-cream-200" : "text-stone-500"}`}>{formatCurrency(slot.pay)}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {role && (
          <div className="bg-cream-50 border border-cream-200 rounded-xl p-4 animate-fade-in">
            <p className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-2">
              <Shirt size={14} /> Dress Code
            </p>
            <p className="text-[13.5px] font-medium text-stone-600 leading-relaxed">
              {catering.dressCodeNotes || DRESS_CODE_DEFAULTS[role]}
            </p>
          </div>
        )}

        {catering.isTwoDay && catering.joinRule === "any_day" && (
          <div>
            <label className="label">Select Day(s)</label>
            <div className="flex gap-2">
              {catering.dates.map((date, i) => {
                const isSelected = selectedDays.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => handleDayToggle(i)}
                    className={`flex-1 py-3 rounded-xl border text-[14px] font-semibold transition-all duration-200 active:scale-[0.98] ${
                      isSelected 
                        ? "bg-stone-800 border-stone-800 text-cream-50" 
                        : "bg-white border-cream-200 hover:bg-cream-50 text-stone-700"
                    }`}
                  >
                    Day {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {catering.isTwoDay && catering.joinRule === "both_days" && (
          <div className="bg-[#fdf0e6] border border-[#f5d0aa] rounded-xl p-4 flex gap-3">
            <AlertCircle className="text-[#a05020] shrink-0" size={20} />
            <p className="text-[13.5px] font-medium text-[#8b3a00] leading-relaxed">
              This event requires attendance on both days. Registering confirms you for both {formatDate(catering.dates[0])} and {formatDate(catering.dates[1])}.
            </p>
          </div>
        )}

        <div>
          <label className="label">Drop Point</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <select
              value={dropPoint}
              className="pl-11"
              onChange={(e) => setDropPoint(e.target.value)}
            >
              {(dropPoints || []).map((dp) => (
                <option key={dp._id} value={dp.name}>{dp.name}</option>
              ))}
            </select>
          </div>
          <p className="text-[12px] font-medium text-stone-400 mt-1.5 ml-1">
            Pickup is from Main Gate for everyone.
          </p>
        </div>

        {catering.photoRequired && (
          <div>
            <label className="label">Photo Link <span className="text-stone-400 lowercase">(Required)</span></label>
            <div className="relative">
              <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
              <input
                type="url"
                placeholder="Google Drive link etc."
                className="pl-11"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-[13px] font-medium animate-fade-in">
            {error}
          </div>
        )}

        <button
          className="btn-primary w-full py-4 mt-2"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Registering..." : (
            <>
              <UserCheck size={18} /> Confirm Registration
            </>
          )}
        </button>
      </div>
    </div>
  );
}
