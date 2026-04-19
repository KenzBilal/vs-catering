import { Bell } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";

export default function NotificationBell({ className }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useQuery(api.notifications.getUnreadCount, token ? { token } : "skip");

  return (
    <button
      onClick={() => navigate("/notifications")}
      className={`relative p-2 rounded-xl hover:bg-cream-100 transition-colors group ${className}`}
    >
      <Bell 
        size={20} 
        className="text-stone-500 group-hover:text-stone-900 transition-colors" 
      />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white animate-fade-in">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
