import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { ArrowLeft, Save, Loader2, MapPin, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SegmentedControl from "../../components/ui/SegmentedControl";
import CustomSelect from "../../components/ui/CustomSelect";
import toast from "react-hot-toast";

export default function PreferenceSettings() {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  const dropPointsRaw = useQuery(api.dropPoints.getDropPoints, { token });
  const updatePrefs = useMutation(api.users.updatePreferences);

  const [dropPoint, setDropPoint] = useState(user?.defaultDropPoint || "Main Gate");
  const [stayType, setStayType]   = useState(user?.stayType || "hostel");
  const [loading, setLoading]     = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePrefs({ token, defaultDropPoint: dropPoint, stayType });
      login({ ...user, defaultDropPoint: dropPoint, stayType });
      toast.success("Preferences updated.");
    } catch (e) {
      toast.error("Failed to update preferences.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <button 
        onClick={() => navigate("/settings")} 
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">App Preferences</h2>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Set your default accommodation and pickup location.
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 border border-cream-200 rounded-2xl shadow-sm">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Home size={16} className="text-stone-400" />
                <label className="text-[13px] font-bold text-stone-700 uppercase tracking-wider">Accommodation</label>
              </div>
              <SegmentedControl
                options={[
                  { label: "Hostel",      value: "hostel" },
                  { label: "Day Scholar", value: "day_scholar" },
                ]}
                value={stayType}
                onChange={setStayType}
              />
            </div>

            <div className="pt-6 border-t border-cream-50">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={16} className="text-stone-400" />
                <label className="text-[13px] font-bold text-stone-700 uppercase tracking-wider">Default Drop Point</label>
              </div>
              <CustomSelect
                options={(dropPointsRaw || []).map((dp) => ({ label: dp.name, value: dp.name }))}
                value={dropPoint}
                onChange={setDropPoint}
                placeholder="Select your default drop point..."
              />
            </div>

            <button
              className="btn-primary w-full py-4 text-[14px] mt-4"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
