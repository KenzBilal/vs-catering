import { Link } from "react-router-dom";
import { User, Settings as SettingsIcon, ChevronRight, MapPin, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "../../lib/AuthContext";

export default function SettingsMenu() {
  const { user } = useAuth();

  const options = [
    {
      id: "personal",
      title: "Personal Settings",
      description: "Manage your profile photo and security.",
      icon: <User size={20} className="text-stone-400" />,
      href: "/settings/personal",
      color: "bg-emerald-50",
    },
    {
      id: "preferences",
      title: "App Preferences",
      description: "Accommodation and pickup locations.",
      icon: <SettingsIcon size={20} className="text-stone-400" />,
      href: "/settings/preferences",
      color: "bg-blue-50",
    },
  ];

  return (
    <div className="pb-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Settings</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">Manage your account and preferences.</p>
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

      <div className="mt-8 pt-8 border-t border-stone-100 max-w-2xl">
        <div className="flex items-center gap-4 p-5 bg-stone-50 border border-stone-100 rounded-2xl">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-stone-400 shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-stone-900">Signed in as {user?.name}</p>
            <p className="text-[12px] font-medium text-stone-500 capitalize">{user?.role?.replace("_", " ")} Account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
