import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, ChevronRight, IndianRupee, Layout } from "lucide-react";

export default function SettingsMenu() {
  const options = [
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
    <div>
      <div className="mb-6">
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
    </div>
  );
}
