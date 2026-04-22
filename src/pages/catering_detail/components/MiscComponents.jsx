import { UserCheck, CreditCard, Edit, IndianRupee } from "lucide-react";
import toast from "react-hot-toast";

export function AdminActionButtons({ id, navigate, isAdmin, role, catering }) {
  if (!isAdmin) return null;

  return (
    <div className="flex flex-col gap-3 mb-6">
      <div className="flex flex-wrap gap-3">
        <button className="btn-secondary flex-1" onClick={() => navigate(`/admin/catering/${id}/attendance`)}>
          <UserCheck size={16} /> Manage Attendance
        </button>
        <button className="btn-secondary flex-1" onClick={() => navigate(`/admin/catering/${id}/payments`)}>
          <CreditCard size={16} /> Manage Payments
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <button 
          className="btn-secondary flex-1 border-orange-100 text-orange-700 hover:bg-orange-50" 
          onClick={() => {
            if (catering?.status !== "ended") {
              toast.error("You can only schedule payouts for events that have ended.");
              return;
            }
            navigate(`/admin/settings/payouts?eventId=${id}`);
          }}
        >
          <IndianRupee size={16} /> Schedule Payout
        </button>
        {role === "admin" && (
          <button className="btn-secondary" onClick={() => navigate(`/admin/catering/${id}/edit`)}>
            <Edit size={16} /> Edit
          </button>
        )}
      </div>
    </div>
  );
}

export function CateringDressCode({ notes }) {
  return (
    <div className="card mb-6 p-6">
      <h3 className="section-title">Dress Code</h3>
      <p className="text-[14.5px] text-stone-600 whitespace-pre-wrap leading-relaxed">
        {notes}
      </p>
    </div>
  );
}
