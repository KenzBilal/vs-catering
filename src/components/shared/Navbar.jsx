import { useAuth } from "../../lib/AuthContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, User, UtensilsCrossed, CalendarDays } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isAdmin = user?.role === "admin" || user?.role === "sub_admin";

  return (
    <nav className="sticky top-0 z-50 bg-cream-card/90 backdrop-blur-md border-b border-cream-border transition-all duration-300">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-[17px] tracking-tight text-stone-900 hover:opacity-80 transition-opacity">
          <UtensilsCrossed size={18} className="text-stone-700" />
          VS-Catering
        </Link>

        {user && (
          <div className="flex items-center gap-5 sm:gap-6">
            {isAdmin && (
              <Link
                to="/admin"
                className={`text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                  location.pathname.startsWith("/admin") ? "text-stone-900" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                <LayoutDashboard size={15} className="hidden sm:block" />
                Admin
              </Link>
            )}
            <Link
              to="/my-caterings"
              className={`text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname === "/my-caterings" ? "text-stone-900" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <CalendarDays size={15} className="hidden sm:block" />
              <span className="hidden sm:inline">My Caterings</span>
              <span className="sm:hidden">Events</span>
            </Link>
            
            <div className="h-4 w-px bg-cream-300 mx-0.5 hidden sm:block"></div>
            
            <Link
              to="/profile"
              className={`text-[13px] font-medium transition-colors flex items-center gap-1.5 ${
                location.pathname === "/profile" ? "text-stone-900" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              <User size={15} className="hidden sm:block" />
              {user.name.split(" ")[0]}
            </Link>
            
            <button
              onClick={handleLogout}
              className="text-[13px] font-medium text-stone-500 hover:text-red-600 transition-colors flex items-center gap-1.5 p-1 rounded-md hover:bg-red-50"
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
