import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, ChevronRight, IndianRupee } from "lucide-react";

export default function SettingsMenu() {
  const options = [
    {
      id: "drop-points",
      title: "Drop Points",
      description: "Manage pickup locations for student registrations.",
      icon: <MapPin size={22} className="text-stone-400" />,
      href: "/admin/settings/drop-points",
      color: "bg-orange-50",
    },
    {
      id: "sub-admins",
      title: "Manage Sub-Admins",
      description: "Promote users and configure their access permissions.",
      icon: <ShieldCheck size={22} className="text-stone-400" />,
      href: "/admin/settings/sub-admins",
      color: "bg-blue-50",
    },
    {
      id: "payouts",
      title: "Payout Schedule",
      description: "Set the next expected payout date for students.",
      icon: <IndianRupee size={22} className="text-stone-400" />,
      href: "/admin/settings/payouts",
      color: "bg-stone-100",
    },
    {
      id: "interface",
      title: "Dashboard Settings",
      description: "Personalize your layout by toggling graphs and data sections.",
      icon: <Layout size={22} className="text-stone-400" />,
      href: "/admin/settings/interface",
      color: "bg-green-50",
    },
  ];


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Admin Settings</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Configure global system settings and sub-admin access levels.
        </p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {options.map((opt) => (
          <Link
            key={opt.id}
            to={opt.href}
            className="group flex items-center gap-5 p-5 bg-white border border-cream-200 rounded-2xl hover:border-stone-300 transition-all duration-200 shadow-sm active:scale-[0.99]"
          >
            <div className={`w-14 h-14 rounded-2xl ${opt.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
              {opt.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[17px] text-stone-900 mb-0.5">{opt.title}</h3>
              <p className="text-[13.5px] font-medium text-stone-500 leading-relaxed">
                {opt.description}
              </p>
            </div>

            <ChevronRight size={18} className="text-stone-300 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
