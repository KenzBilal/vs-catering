import { UserCheck, CreditCard, Edit } from "lucide-react";

export function AdminActionButtons({ id, navigate, isAdmin, role }) {
  if (!isAdmin) return null;

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <button className="btn-secondary flex-1" onClick={() => navigate(`/admin/catering/${id}/attendance`)}>
        <UserCheck size={16} /> Manage Attendance
      </button>
      <button className="btn-secondary flex-1" onClick={() => navigate(`/admin/catering/${id}/payments`)}>
        <CreditCard size={16} /> Manage Payments
      </button>
      {role === "admin" && (
        <button className="btn-secondary" onClick={() => navigate(`/admin/catering/${id}/edit`)}>
          <Edit size={16} /> Edit
        </button>
      )}
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
