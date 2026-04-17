import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { Save, CheckCircle2, User, Phone, MapPin, Camera, XCircle, Trash2, Hash } from "lucide-react";
import SegmentedControl from "../components/ui/SegmentedControl";
import ConvexImage from "../components/shared/ConvexImage";
import { isValidRegNumber } from "../lib/helpers";

const ROLE_LABEL = { student: "Student", sub_admin: "Sub-Admin", admin: "Admin" };
const ROLE_BADGE = {
  admin:     "bg-stone-900 text-cream-50",
  sub_admin: "bg-cream-200 text-stone-800",
  student:   "bg-cream-100 text-stone-600",
};

export default function Settings() {
  const { user, login } = useAuth();
  const dropPoints = useQuery(api.dropPoints.getDropPoints);
  const updatePrefs = useMutation(api.users.updatePreferences);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [dropPoint, setDropPoint] = useState(user?.defaultDropPoint || "Main Gate");
  const [stayType, setStayType]   = useState(user?.stayType || "hostel");
  const [saved, setSaved]         = useState(false);
  const [loading, setLoading]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [regNumber, setRegNumber] = useState(user?.registrationNumber || "");

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updatePrefs({ userId: user._id, defaultDropPoint: dropPoint, stayType, photoStorageId: storageId, registrationNumber: regNumber });
      login({ ...user, photoStorageId: storageId, registrationNumber: regNumber });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (regNumber.trim() && !isValidRegNumber(regNumber.trim())) {
      setError("Enter a valid 8-digit registration number.");
      return;
    }
    setLoading(true);
    try {
      await updatePrefs({ userId: user._id, defaultDropPoint: dropPoint, stayType, registrationNumber: regNumber });
      login({ ...user, defaultDropPoint: dropPoint, stayType, registrationNumber: regNumber });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      const msg = e.message || "";
      if (msg.includes("ConvexError:")) {
        setError(msg.split("ConvexError:")[1].trim());
      } else if (msg.includes("Error:")) {
        setError(msg.split("Error:")[1].trim());
      } else {
        setError(msg || "Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Settings</h1>
          <p className="text-[14px] font-medium text-stone-500 mt-1">Your account and preferences.</p>
        </div>
        
        {/* Profile Photo */}
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0">
            {user?.photoStorageId ? (
              <ConvexImage storageId={user.photoStorageId} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-cream-200 border-2 border-white shadow-sm flex items-center justify-center">
                <User size={28} className="text-stone-400" />
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-stone-900 text-cream-50 rounded-full flex items-center justify-center cursor-pointer hover:bg-stone-800 transition-colors shadow-lg border-2 border-white">
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              <Camera size={14} className={uploading ? "animate-pulse" : ""} />
            </label>
          </div>
          <div>
            <p className="text-[14px] font-bold text-stone-800">Profile Picture</p>
            <p className="text-[12px] text-stone-500 font-medium">Used for event registration</p>
          </div>
        </div>
      </div>

      {/* Account card */}
      <div className="card bg-white p-6 mb-4">
        <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-4">Account</h3>
        <div className="flex flex-col gap-3">
          <Row label="Name"   value={user?.name} />
          <Row label="Phone"  value={user?.phone} />
          <Row label="Gender" value={user?.gender === "male" ? "Male" : "Female"} />
          <div className="flex justify-between items-center text-[14px] pt-2 border-t border-cream-100">
            <span className="font-medium text-stone-500">Role</span>
            <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${ROLE_BADGE[user?.role] || ROLE_BADGE.student}`}>
              {ROLE_LABEL[user?.role] || "Student"}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences card */}
      <div className="card bg-white p-6 mb-6">
        <h3 className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-5">Preferences</h3>
        <div className="flex flex-col gap-5">
          <div>
            <label className="label mb-3">Accommodation</label>
            <SegmentedControl
              options={[
                { label: "Hostel",      value: "hostel" },
                { label: "Day Scholar", value: "day_scholar" },
              ]}
              value={stayType}
              onChange={setStayType}
            />
          </div>

          <div>
            <label className="label">Default Drop Point</label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
              <select
                value={dropPoint}
                onChange={(e) => setDropPoint(e.target.value)}
                className="pl-9"
              >
                {(dropPoints || []).map((dp) => (
                  <option key={dp._id} value={dp.name}>{dp.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">LPU Registration Number <span className="text-stone-400 lowercase">(Optional)</span></label>
            <div className="relative">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
              <input
                type="text"
                placeholder="eg. 12517494"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="pl-9 bg-white"
              />
            </div>
          </div>

          <button
            className="btn-primary w-full py-3 text-[14px]"
            onClick={handleSave}
            disabled={loading}
          >
            {saved ? (
              <><CheckCircle2 size={17} /> Saved</>
            ) : loading ? "Saving..." : (
              <><Save size={17} /> Save Preferences</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center text-[14px]">
      <span className="font-medium text-stone-500">{label}</span>
      <span className="font-semibold text-stone-900">{value}</span>
    </div>
  );
}
