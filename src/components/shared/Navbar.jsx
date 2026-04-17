import { useAuth } from "../../lib/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, CalendarDays, User, UtensilsCrossed } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-cream-200">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-[16px] tracking-tight text-stone-900 hover:opacity-80 transition-opacity">
          <div className="w-6 h-6 bg-stone-900 rounded-md flex items-center justify-center">
            <UtensilsCrossed size={13} className="text-cream-50" />
          </div>
          VS-Catering
        </Link>

        {user && (
          <div className="flex items-center gap-1">
            <NavLink to="/" label="Events" isActive={isActive("/")} />
            <NavLink to="/my-caterings" label="My Events" isActive={isActive("/my-caterings")} />
            <NavLink to="/profile" label={user.name.split(" ")[0]} isActive={isActive("/profile")} icon={<User size={14} />} />
            <button
              onClick={handleLogout}
              className="ml-1 p-2 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all"
              aria-label="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ to, label, isActive, icon }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13.5px] font-semibold transition-all duration-150 ${
        isActive
          ? "bg-stone-900 text-cream-50"
          : "text-stone-500 hover:text-stone-900 hover:bg-cream-100"
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
