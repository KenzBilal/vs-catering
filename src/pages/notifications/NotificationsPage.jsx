import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarDays, IndianRupee, UserCheck, Shield, CheckCircle2, ArrowLeft, Clock } from "lucide-react";
import { formatDate, formatCurrency } from "../../lib/helpers";
import LoadingState from "../../components/shared/LoadingState";
import EmptyState from "../../components/shared/EmptyState";
import toast from "react-hot-toast";

const ICON_MAP = {
  catering: CalendarDays,
  payment: IndianRupee,
  role: Shield,
  system: Bell,
};

const COLOR_MAP = {
  catering: "bg-blue-50 text-blue-600 border-blue-100",
  payment: "bg-orange-50 text-orange-600 border-orange-100",
  role: "bg-purple-50 text-purple-600 border-purple-100",
  system: "bg-stone-50 text-stone-600 border-stone-100",
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const notifications = useQuery(api.notifications.getMyNotifications, { token });
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleMarkAll = async () => {
    try {
      await markAllAsRead({ token });
      toast.success("All caught up!");
    } catch (e) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleItemClick = async (n) => {
    if (!n.isRead) {
      await markAsRead({ token, notificationId: n._id });
    }
    
    // Navigation based on type
    if (n.cateringId) {
      navigate(`/catering/${n.cateringId}`);
    } else if (n.type === "payment") {
      navigate("/profile"); // Assuming payments are in profile
    }
  };

  if (notifications === undefined) return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <LoadingState rows={5} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Notifications</h1>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAll}
            className="text-[13px] font-bold text-stone-600 hover:text-stone-900 bg-white border border-cream-200 px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState 
          icon={Bell} 
          title="No notifications yet" 
          description="We'll notify you when there's an update about your events or payments."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = ICON_MAP[n.type] || Bell;
            return (
              <div
                key={n._id}
                onClick={() => handleItemClick(n)}
                className={`group relative bg-white border rounded-2xl p-4 transition-all duration-200 cursor-pointer hover:border-stone-300 hover:shadow-sm ${
                  !n.isRead ? "border-stone-400 bg-stone-50/30" : "border-cream-200"
                }`}
              >
                {!n.isRead && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-stone-900 rounded-full" />
                )}
                
                <div className="flex gap-4">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${COLOR_MAP[n.type]}`}>
                    <Icon size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className={`text-[14.5px] font-bold truncate ${!n.isRead ? "text-stone-900" : "text-stone-700"}`}>
                        {n.title}
                      </p>
                      <span className="text-[11px] font-medium text-stone-400 whitespace-nowrap pt-0.5">
                        {formatDate(n.createdAt)}
                      </span>
                    </div>
                    <p className={`text-[13px] leading-relaxed ${!n.isRead ? "text-stone-600 font-medium" : "text-stone-500"}`}>
                      {n.message}
                    </p>

                    {n.type === "payment" && n.payoutDate && (
                      <div className="mt-3 flex items-center gap-1.5 bg-orange-50/50 border border-orange-100 rounded-lg px-2.5 py-1.5 w-fit">
                        <Clock size={12} className="text-orange-600" />
                        <span className="text-[11px] font-bold text-orange-700">Payout: {n.payoutDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
