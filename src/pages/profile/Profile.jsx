import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, CheckCircle2 } from "lucide-react";
import SegmentedControl from "../components/ui/SegmentedControl";

const ROLE_LABEL = {
  student: "Student",
  sub_admin: "Sub-Admin",
  admin: "Admin",
};

export default function Profile() {
  const { user, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const dropPoints = useQuery(api.dropPoints.getDropPoints, token ? { token } : "skip");
  const updatePrefs = useMutation(api.users.updatePreferences);

  const [dropPoint, setDropPoint] = useState(user?.defaultDropPoint || "Main Gate");
  const [stayType, setStayType] = useState(user?.stayType || "hostel");
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updatePrefs({ token, defaultDropPoint: dropPoint, stayType });
      login({ ...user, defaultDropPoint: dropPoint, stayType });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="page-container" style={{ maxWidth: 520 }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Profile</h2>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Your account details and preferences.
        </p>
      </div>

      {/* Account card */}
      <div className="card bg-white p-6 mb-4">
        <h3 className="section-title">Account</h3>
        <div className="flex flex-col gap-3 mt-4">
          <Row label="Name" value={user?.name} />
          <Row label="Phone" value={user?.phone} />
          <Row label="Gender" value={user?.gender === "male" ? "Male" : "Female"} />
          <div className="flex justify-between items-center text-[14px] pt-2 border-t border-cream-100">
            <span className="font-medium text-stone-500">Role</span>
            <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${
              user?.role === "admin" ? "bg-stone-900 text-cream-50"
              : user?.role === "sub_admin" ? "bg-cream-200 text-stone-800"
              : "bg-cream-100 text-stone-600"
            }`}>
              {ROLE_LABEL[user?.role] || "Student"}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences card */}
      <div className="card bg-white p-6 mb-6">
        <h3 className="section-title">Preferences</h3>
        <div className="flex flex-col gap-5 mt-4">
          <div>
            <label className="label mb-3">Accommodation</label>
            <SegmentedControl
              options={[
                { label: "Hostel", value: "hostel" },
                { label: "Day Scholar", value: "day_scholar" },
              ]}
              value={stayType}
              onChange={setStayType}
            />
          </div>

          <div>
            <label className="label">Default Drop Point</label>
            <select
              value={dropPoint}
              onChange={(e) => setDropPoint(e.target.value)}
              className="bg-white"
            >
              {(dropPoints || []).map((dp) => (
                <option key={dp._id} value={dp.name}>{dp.name}</option>
              ))}
            </select>
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

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-cream-200 bg-white text-[14px] font-semibold text-stone-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all active:scale-[0.98]"
      >
        <LogOut size={16} /> Sign Out
      </button>
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
