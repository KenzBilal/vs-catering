import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  CreditCard,
  Users,
  Settings,
  LogOut,
  UtensilsCrossed,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/events", label: "Events", icon: CalendarDays, permission: "manage_caterings" },
  { to: "/admin/users", label: "Users", icon: Users, permission: "manage_users" },
  { to: "/admin/settings", label: "Settings", icon: Settings, superAdminOnly: true },
];

export default function AdminShell({ children }) {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();
  const settingsRaw = useQuery(api.adminSettings.getSettings, { token: user?.token || "" });
  const initializeSettings = useMutation(api.adminSettings.initializeSettings);

  useEffect(() => {
    if (user?.role === "admin" && settingsRaw === null) {
      initializeSettings({ token: user.token });
    }
  }, [user, settingsRaw, initializeSettings]);

  const filteredNav = NAV_ITEMS.filter(item => {
    if (item.superAdminOnly) return user?.role === "admin";
    if (item.permission) {
      if (user?.role === "admin") return true;
      return permissions.some(p => p.permission === item.permission && p.enabled);
    }
    return true;
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-cream-100">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 hidden md:flex flex-col fixed top-0 left-0 h-screen bg-white border-r border-cream-200 z-40">
        {/* Logo */}
        <div className="h-14 flex items-center gap-2.5 px-5 border-b border-cream-200">
          <div className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center shrink-0">
            <UtensilsCrossed size={14} className="text-cream-50" />
          </div>
          <span className="font-bold text-[15px] text-stone-900 tracking-tight">Catering</span>
        </div>

        {/* Role badge */}
        <div className="px-4 pt-4 pb-2">
          <div className="bg-cream-50 border border-cream-200 rounded-xl px-3 py-2.5">
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-0.5">Signed in as</p>
            <p className="text-[13px] font-semibold text-stone-800 truncate">{user?.name}</p>
            <p className="text-[11px] font-medium text-stone-400 capitalize mt-0.5">
              {user?.role === "sub_admin" ? "Sub-Admin" : "Admin"}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          {filteredNav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-[13.5px] font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-stone-900 text-cream-50 shadow-sm"
                    : "text-stone-500 hover:bg-cream-100 hover:text-stone-800"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} className={isActive ? "text-cream-200" : "text-stone-400"} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-cream-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-semibold text-stone-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-cream-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-stone-900 rounded-lg flex items-center justify-center">
            <UtensilsCrossed size={14} className="text-cream-50" />
          </div>
          <span className="font-bold text-[15px] text-stone-900">Catering</span>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-cream-200 z-40 flex">
        {filteredNav.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-bold transition-colors ${
                isActive ? "text-stone-900" : "text-stone-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} className={isActive ? "text-stone-900" : "text-stone-400"} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-56 pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
