import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, ChevronRight, IndianRupee, Layout, Trash2, User } from "lucide-react";

import { useAuth } from "../../lib/AuthContext";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import ConfirmModal from "../../components/shared/ConfirmModal";
import toast from "react-hot-toast";

export default function SettingsMenu() {
  const { user, token } = useAuth();
  const resetDb = useMutation(api.maintenance.nuclearReset);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetDb({ token });
      toast.success("Database Reset Complete");
      window.location.reload();
    } catch (e) {
      toast.error(e.message || "Reset failed");
    } finally {
      setIsResetting(false);
      setShowResetConfirm(false);
    }
  };

  const options = [
    {
      id: "personal",
      title: "Personal",
      description: "Manage your profile and security.",
      icon: <User size={20} className="text-stone-400" />,
      href: "/admin/settings/personal",
      color: "bg-emerald-50",
    },
    {
      id: "branding",
      title: "Branding",
      description: "Customize site name and logo.",
      icon: <Layout size={20} className="text-stone-400" />,
      href: "/admin/settings/branding",
      color: "bg-purple-50",
    },
    {
      id: "drop-points",
      title: "Drop Points",
      description: "Manage student pickup locations.",
      icon: <MapPin size={20} className="text-stone-400" />,
      href: "/admin/settings/drop-points",
      color: "bg-orange-50",
    },

    {
      id: "sub-admins",
      title: "Sub-Admins",
      description: "Manage access and permissions.",
      icon: <ShieldCheck size={20} className="text-stone-400" />,
      href: "/admin/settings/sub-admins",
      color: "bg-blue-50",
    },
    {
      id: "payouts",
      title: "Payouts",
      description: "Schedule expected payment dates.",
      icon: <IndianRupee size={20} className="text-stone-400" />,
      href: "/admin/settings/payouts",
      color: "bg-stone-50",
    },
    {
      id: "interface",
      title: "Interface",
      description: "Customize your dashboard layout.",
      icon: <Layout size={20} className="text-stone-400" />,
      href: "/admin/settings/interface",
      color: "bg-green-50",
    },
  ];

  return (
    <div className="pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Settings</h2>
      </div>

      <div className="grid gap-3 max-w-2xl">
        {options.map((opt) => (
          <Link
            key={opt.id}
            to={opt.href}
            className="group flex items-center gap-4 p-4 bg-white border border-cream-200 rounded-2xl hover:border-stone-300 transition-all duration-200 shadow-sm active:scale-[0.99]"
          >
            <div className={`w-11 h-11 rounded-xl ${opt.color} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}>
              {opt.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[15.5px] text-stone-900 leading-none">{opt.title}</h3>
              <p className="text-[12.5px] font-medium text-stone-400 mt-1">{opt.description}</p>
            </div>

            <ChevronRight size={18} className="text-stone-300 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      {user?.role === "admin" && (
        <div className="mt-12 pt-8 border-t border-stone-100 max-w-2xl">
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6">
            <h4 className="text-[14px] font-bold text-red-900 mb-1">Danger Zone</h4>
            <p className="text-[12.5px] font-medium text-red-600/70 mb-4 leading-relaxed">
              For testing purposes only. This will permanently delete all events, users, and registrations. Your account will be preserved.
            </p>
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-red-100 transition-all active:scale-95 disabled:opacity-50"
              disabled={isResetting}
            >
              <Trash2 size={16} /> {isResetting ? "Resetting..." : "Nuclear Reset"}
            </button>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(null)}
        onConfirm={handleReset}
        title="Absolute Final Warning"
        message="This is a nuclear reset. EVERY catering event, EVERY student, and EVERY payment will be deleted from the database. Only your admin profile stays. Proceed?"
        variant="danger"
        confirmText="Yes, RESET EVERYTHING"
      />
    </div>
  );
}
