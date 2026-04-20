import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, ChevronRight, IndianRupee, Layout } from "lucide-react";

export default function SettingsMenu() {
  const options = [
    {
      id: "drop-points",
      title: "Drop Points",
      icon: <MapPin size={22} className="text-stone-400" />,
      href: "/admin/settings/drop-points",
      color: "bg-orange-50",
    },
    {
      id: "sub-admins",
      title: "Manage Sub-Admins",
      icon: <ShieldCheck size={22} className="text-stone-400" />,
      href: "/admin/settings/sub-admins",
      color: "bg-blue-50",
    },
    {
      id: "payouts",
      title: "Payout Schedule",
      icon: <IndianRupee size={22} className="text-stone-400" />,
      href: "/admin/settings/payouts",
      color: "bg-stone-100",
    },
    {
      id: "interface",
      title: "Dashboard Settings",
      icon: <Layout size={22} className="text-stone-400" />,
      href: "/admin/settings/interface",
      color: "bg-green-50",
    },
  ];

  return (
    <div className="pt-4">
      <div className="grid gap-3 max-w-2xl">
        {options.map((opt) => (
          <Link
            key={opt.id}
            to={opt.href}
            className="group flex items-center gap-5 p-4 bg-white border border-cream-200 rounded-2xl hover:border-stone-300 transition-all duration-200 shadow-sm active:scale-[0.99]"
          >
            <div className={`w-12 h-12 rounded-xl ${opt.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
              {opt.icon}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[16px] text-stone-900">{opt.title}</h3>
            </div>

            <ChevronRight size={18} className="text-stone-300 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        ))}
      </div>
    </div>
  );
}
