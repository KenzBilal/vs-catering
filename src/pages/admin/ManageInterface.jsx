import { useAuth } from "../../lib/AuthContext";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { ArrowLeft, Layout, Check, ToggleLeft as Toggle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ManageInterface() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const updatePrefs = useMutation(api.users.updateAdminPreferences);

  const [prefs, setPrefs] = useState({
    showAnalytics: true,
    showPendingPayments: true,
    showActiveEvents: true,
  });

  useEffect(() => {
    if (user?.adminPreferences) {
      setPrefs(user.adminPreferences);
    }
  }, [user]);

  const handleToggle = async (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    try {
      await updatePrefs({ token, preferences: newPrefs });
      toast.success("Preference updated");
    } catch (e) {
      toast.error("Failed to update preference");
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <button 
        onClick={() => navigate("/admin/settings")} 
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Dashboard Settings</h2>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Personalize your dashboard by toggling sections for better readability.
        </p>
      </div>

      <div className="space-y-4">
        <ToggleItem 
          title="Data Charts" 
          description="Show the visual performance analysis and trends graph."
          active={prefs.showAnalytics}
          onToggle={() => handleToggle("showAnalytics")}
        />
        <ToggleItem 
          title="Active Events" 
          description="Show the list of ongoing and upcoming events on the main page."
          active={prefs.showActiveEvents}
          onToggle={() => handleToggle("showActiveEvents")}
        />
        <ToggleItem 
          title="Pending Payments" 
          description="Show the list of students with outstanding payments."
          active={prefs.showPendingPayments}
          onToggle={() => handleToggle("showPendingPayments")}
        />
      </div>

      <p className="mt-8 text-[12px] text-stone-400 font-medium text-center">
        Changes are saved automatically to your profile.
      </p>

    </div>
  );
}

function ToggleItem({ title, description, active, onToggle }) {
  return (
    <div 
      onClick={onToggle}
      className="flex items-center justify-between p-5 bg-white border border-cream-200 rounded-2xl hover:border-stone-300 transition-all cursor-pointer group shadow-sm active:scale-[0.99]"
    >
      <div className="flex-1 min-w-0 pr-4">
        <h3 className="font-bold text-[16px] text-stone-900">{title}</h3>
        <p className="text-[13px] font-medium text-stone-500 mt-0.5 leading-snug">{description}</p>
      </div>
      <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${active ? "bg-[#1a5c3a]" : "bg-stone-200"}`}>
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${active ? "translate-x-7" : "translate-x-1"}`} />
      </div>
    </div>
  );
}
