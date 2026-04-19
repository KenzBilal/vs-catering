import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { formatDate } from "../../lib/helpers";
import CustomSelect from "../../components/ui/CustomSelect";
import { ArrowLeft, MapPin, UserCheck } from "lucide-react";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import NotificationBell from "../../components/shared/NotificationBell";
import toast from "react-hot-toast";

// Sub-components
import RegisterSuccess from "./components/RegisterSuccess";
import RoleSelector from "./components/RoleSelector";
import DressCodeWheel from "./components/DressCodeWheel";
import DaySelector from "./components/DaySelector";
import PhotoUpload from "./components/PhotoUpload";

const MAX_PHOTO_SIZE_MB = 5;

export default function Register() {
  const { id } = useParams();
  const { user, token, login } = useAuth();
  const navigate = useNavigate();

  const cateringRaw = useQuery(api.caterings.getCatering, { cateringId: id, token });
  const dropPointsRaw = useQuery(api.dropPoints.getDropPoints, { token });
  const { data: catering, timedOut: catTimeout } = useQueryWithTimeout(cateringRaw);
  const { data: dropPoints, timedOut: dpTimeout } = useQueryWithTimeout(dropPointsRaw);
  const registerMutation = useMutation(api.registrations.register);
  const updatePrefs = useMutation(api.users.updatePreferences);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [role, setRole] = useState("");
  const [dropPoint, setDropPoint] = useState(user?.defaultDropPoint || "Main Gate");
  const [selectedDays, setSelectedDays] = useState([0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!selectedFile) {
      setPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  if (catTimeout || dpTimeout) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

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
    if(errors.days) setErrors(e=>({...e, days:""}));
  };

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

      await registerMutation({
        token,
        cateringId: id,
        days: daysToRegister,
        role,
        dropPoint,
        ...(photoStorageId ? { photoStorageId } : {}),
      });

      try {
        await updatePrefs({
          token,
          defaultDropPoint: dropPoint,
          stayType: user.stayType,
          registrationNumber: user.registrationNumber,
        });
        login({ ...user, defaultDropPoint: dropPoint, photoStorageId: photoStorageId || user.photoStorageId });
      } catch (prefErr) {
        if (photoStorageId) login({ ...user, photoStorageId });
      }

      setDone(true);
      toast.success("Successfully registered!");
    } catch (e) {
      const rawMsg = e.data || e.message || "Something went wrong.";
      toast.error(rawMsg.replace(/^\[CONVEX [A-Z]\([^)]+\)\]\s*/, ""));
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  if (done) {
    return <RegisterSuccess catering={catering} id={id} navigate={navigate} />;
  }

  return (
    <div className="page-container" style={{ maxWidth: 500 }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <NotificationBell />
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight mb-2">Register</h2>
        <p className="text-[14.5px] font-medium text-stone-500 flex items-center gap-1.5">
          <MapPin size={16} className="text-stone-400" />
          {catering.place} <span className="mx-1">•</span>
          {catering.isTwoDay ? `${formatDate(catering.dates[0])} – ${formatDate(catering.dates[1])}` : formatDate(catering.dates[0])}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <RoleSelector 
          filteredRoles={filteredRoles} 
          role={role} 
          setRole={setRole} 
          errors={errors} 
          setErrors={setErrors} 
          catering={catering} 
        />

        <DressCodeWheel catering={catering} selectedRole={role} />

        <DaySelector 
          catering={catering} 
          selectedDays={selectedDays} 
          handleDayToggle={handleDayToggle} 
          errors={errors} 
        />

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

        <PhotoUpload 
          catering={catering} 
          user={user} 
          selectedFile={selectedFile} 
          setSelectedFile={setSelectedFile} 
          preview={preview} 
          errors={errors} 
          handleFileChange={handleFileChange} 
          MAX_PHOTO_SIZE_MB={MAX_PHOTO_SIZE_MB} 
        />

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
