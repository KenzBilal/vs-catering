import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { getRoleLabel, formatDate, formatCurrency, DRESS_CODE_DEFAULTS, formatTime12h } from "../lib/helpers";
import CustomSelect from "../components/ui/CustomSelect";
import ConvexImage from "../components/shared/ConvexImage"; // #10: was missing
import { ArrowLeft, CheckCircle2, UserCheck, MapPin, AlertCircle, Shirt, Camera, XCircle } from "lucide-react";
import { useQueryWithTimeout } from "../hooks/useQueryWithTimeout";
import ErrorState from "../components/shared/ErrorState";
import toast from "react-hot-toast";

const MAX_PHOTO_SIZE_MB = 5;

export default function Register() {
  const { id } = useParams();
  const { user, token, login } = useAuth();
  const navigate = useNavigate();

  // #9: ALL hooks must be declared before any conditional returns
  const cateringRaw = useQuery(api.caterings.getCatering, { cateringId: id, token });
  const dropPointsRaw = useQuery(api.dropPoints.getDropPoints, { token });
  const { data: catering, timedOut: catTimeout } = useQueryWithTimeout(cateringRaw);
  const { data: dropPoints, timedOut: dpTimeout } = useQueryWithTimeout(dropPointsRaw);
  const registerMutation = useMutation(api.registrations.register);
  const updatePrefs = useMutation(api.users.updatePreferences);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  if (catTimeout || dpTimeout) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const [role, setRole] = useState("");
  const [dropPoint, setDropPoint] = useState(user?.defaultDropPoint || "Main Gate");
  const [selectedDays, setSelectedDays] = useState([0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  // Early returns after all hooks
  if (catering === undefined) {
    return <div className="page-container"><p className="text-stone-500 animate-pulse">Loading...</p></div>;
  }
  if (!catering) {
    return <div className="page-container"><p className="text-stone-500">Catering not found.</p></div>;
  }

  const availableRoles = [...new Set(catering.slots.filter((s) => s.day === 0 && s.limit > 0).map((s) => s.role))];

  const filteredRoles = availableRoles.filter((r) => {
    if (user?.gender === "male") return r === "service_boy" || r === "captain_male";
    if (user?.gender === "female") return r === "service_girl" || r === "captain_female";
    return false;
  });

  const daysToRegister = catering.isTwoDay && catering.joinRule === "both_days" ? [0, 1] : selectedDays;

  const handleDayToggle = (day) => {
    if (catering.joinRule === "both_days") return;
    setSelectedDays((prev) => prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]);
  };

  // #27: Validate file size before upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photo: `Photo must be under ${MAX_PHOTO_SIZE_MB}MB.` }));
      return;
    }
    if (errors.photo) setErrors((prev) => ({ ...prev, photo: "" }));
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    setErrors({});
    let hasError = false;
    const newErrors = {};

    if (!role) { newErrors.role = "Please select a role."; hasError = true; }
    if (daysToRegister.length === 0) { newErrors.days = "Please select at least one day."; hasError = true; }
    if (catering.photoRequired && !selectedFile && !user?.photoStorageId) {
      newErrors.photo = "Please upload a photo to register."; hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      let photoStorageId = undefined;
      if (selectedFile) {
        setUploading(true);
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });
        const { storageId } = await result.json();
        photoStorageId = storageId;
        setUploading(false);
      }

      // #4: Pass token, not userId (userId derived server-side)
      await registerMutation({
        token,
        cateringId: id,
        days: daysToRegister,
        role,
        dropPoint,
        ...(photoStorageId ? { photoStorageId } : {}),
      });

      // Smart update: save chosen drop point as new default
      try {
        // #2: Pass token, not raw userId
        await updatePrefs({
          token,
          defaultDropPoint: dropPoint,
          stayType: user.stayType,
          registrationNumber: user.registrationNumber,
        });
        login({ ...user, defaultDropPoint: dropPoint, photoStorageId: photoStorageId || user.photoStorageId });
      } catch (prefErr) {
        console.warn("Failed to update default drop point", prefErr);
        if (photoStorageId) login({ ...user, photoStorageId });
      }

      setDone(true);
      toast.success("Successfully registered!");
    } catch (e) {
      const rawMsg = e.data || e.message || "";
      const msg = typeof rawMsg === "string" ? rawMsg : "Something went wrong.";
      const cleanMsg = msg.replace(/^\[CONVEX [A-Z]\([^)]+\)\]\s*/, "");
      toast.error(cleanMsg.includes("ConvexError:") ? cleanMsg.split("ConvexError:")[1].trim() : cleanMsg);
    } finally {
      setLoading(false);
      setUploading(false);
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
          <div className="flex flex-col gap-3 w-full">
            <button className="btn-primary w-full py-3.5" onClick={() => navigate("/")}>Back to Dashboard</button>
            <button className="btn-secondary w-full py-3.5" onClick={() => navigate(`/catering/${id}`)}>View Event Details</button>
          </div>
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
            {filteredRoles.map((r) => {
              const slot = catering.slots.find((s) => s.role === r && s.day === 0);
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  onClick={() => { setRole(r); if(errors.role) setErrors(e=>({...e, role:""})); }}
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
            {filteredRoles.length === 0 && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
                <p className="text-[14px] font-medium text-red-600">
                  Sorry, there are no roles available for {user.gender === "male" ? "males" : "females"} for this event.
                </p>
              </div>
            )}
            {errors.role && <p className="text-[12.5px] text-red-600 font-medium mt-1 ml-1">{errors.role}</p>}
          </div>
        </div>

        <DressCodeWheel catering={catering} selectedRole={role} />

        {catering.isTwoDay && catering.joinRule === "any_day" && (
          <div>
            <label className="label">Select Day(s)</label>
            <div className="flex gap-2">
              {catering.dates.map((date, i) => {
                const isSelected = selectedDays.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => { handleDayToggle(i); if(errors.days) setErrors(e=>({...e, days:""})); }}
                    className={`flex-1 py-3 rounded-xl border text-[14px] font-semibold transition-all duration-200 active:scale-[0.98] ${
                      isSelected
                        ? "bg-stone-800 border-stone-800 text-cream-50"
                        : "bg-white border-cream-200 hover:bg-cream-50 text-stone-700"
                    }`}
                  >
                    Day {i + 1}
                  </button>
                );
              })}
            </div>
            {errors.days && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.days}</p>}
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
          <CustomSelect
            options={(dropPoints || []).map((dp) => ({ label: dp.name, value: dp.name }))}
            value={dropPoint}
            onChange={setDropPoint}
            placeholder="Select your drop point..."
          />
          <p className="text-[12px] font-medium text-stone-400 mt-1.5 ml-1">
            Pickup is from Main Gate for everyone.
          </p>
        </div>

        {catering.photoRequired && (
          <div>
            <label className="label">Photo Verification <span className="text-stone-400 lowercase">(Required)</span></label>
            <div className="mt-2">
              {user?.photoStorageId && !selectedFile ? (
                <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden p-3 flex items-center gap-4">
                  <ConvexImage storageId={user.photoStorageId} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1">
                    <p className="text-[14px] font-bold text-stone-800">Using saved photo</p>
                    <p className="text-[12.5px] text-stone-500 font-medium">From your account profile</p>
                  </div>
                  <label className="p-2.5 bg-cream-50 hover:bg-cream-100 text-stone-600 rounded-xl cursor-pointer transition-colors border border-cream-200">
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    <Camera size={18} />
                  </label>
                </div>
              ) : !selectedFile ? (
                <div className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center hover:border-stone-300 transition-colors cursor-pointer group ${errors.photo ? 'border-red-300 bg-red-50/30' : 'border-cream-200'}`}>
                  <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
                  <div className="w-12 h-12 bg-cream-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-cream-100 transition-colors">
                    <Camera size={24} className={errors.photo ? 'text-red-400' : 'text-stone-400'} />
                  </div>
                  <p className={`text-[13.5px] font-semibold ${errors.photo ? 'text-red-600' : 'text-stone-600'}`}>Click to upload photo</p>
                  <p className="text-[11px] text-stone-400 mt-1 font-medium">PNG, JPG up to {MAX_PHOTO_SIZE_MB}MB</p>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-cream-200 bg-white p-2">
                  <img src={preview} className="w-full h-48 object-cover rounded-xl" alt="Preview" />
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm p-2 rounded-full text-red-600 hover:bg-white transition-colors"
                  >
                    <XCircle size={18} />
                  </button>
                  <div className="p-2 flex justify-between items-center">
                    <div>
                      <p className="text-[12px] font-semibold text-stone-500 truncate max-w-[200px]">{selectedFile.name}</p>
                      <p className="text-[11px] text-stone-400 font-medium">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                    {user?.photoStorageId && (
                      <button onClick={() => setSelectedFile(null)} className="text-[11px] font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider">
                        Use Saved
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.photo && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.photo}</p>}
            {selectedFile && (
              <p className="text-[11px] text-[#8b3a00] font-bold mt-2 px-1 flex items-center gap-1.5">
                <AlertCircle size={12} /> This will also update your account profile photo.
              </p>
            )}
          </div>
        )}


        <button
          className="btn-primary w-full py-4 mt-2"
          onClick={handleSubmit}
          disabled={loading || uploading}
        >
          {uploading ? "Uploading photo..." : loading ? "Registering..." : (
            <><UserCheck size={18} /> Confirm Registration</>
          )}
        </button>
      </div>
    </div>
  );
}

function DressCodeWheel({ catering, selectedRole }) {
  const roles = Array.from(new Set(catering.slots.map((s) => s.role)));
  const activeIndex = roles.indexOf(selectedRole);

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="relative h-[140px] perspective-[1000px] overflow-hidden rounded-2xl border border-cream-200 bg-[#fdfaf5] shadow-inner shadow-stone-900/5">
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-[#fdfaf5] via-[#fdfaf5]/0 10% via-[#fdfaf5]/0 90% to-[#fdfaf5]" />
        <div className="absolute left-4 top-4 flex items-center gap-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-widest z-20 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-cream-100">
          <Shirt size={12} /> Dress Requirements
        </div>
        <div
          className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ transform: `translateY(${activeIndex === -1 ? 0 : -activeIndex * 100 + 35}px)` }}
        >
          {roles.map((r, i) => {
            const isSelected = r === selectedRole;
            const offset = i - activeIndex;
            const rotation = offset * 25;
            const opacity = isSelected ? 1 : 0.15;
            const blur = isSelected ? 0 : 3;
            const scale = isSelected ? 1 : 0.8;
            return (
              <div
                key={r}
                className="h-[100px] flex flex-col justify-center px-6 transition-all duration-700"
                style={{ transform: `rotateX(${rotation}deg) scale(${scale})`, opacity, filter: `blur(${blur}px)`, transformOrigin: "center center" }}
              >
                <p className={`text-[11px] font-black uppercase tracking-tighter mb-1.5 ${isSelected ? "text-stone-900" : "text-stone-400"}`}>
                  {getRoleLabel(r)}
                </p>
                <p className={`text-[13.5px] leading-[1.6] font-medium ${isSelected ? "text-stone-700 font-bold" : "text-stone-300"}`}>
                  {DRESS_CODE_DEFAULTS[r] || "Standard formal dress code applies."}
                </p>
              </div>
            );
          })}
          {activeIndex === -1 && (
            <div className="h-full flex items-center justify-center px-10 text-center">
              <p className="text-[13px] font-medium text-stone-400 italic">Select a role above to see requirements</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
