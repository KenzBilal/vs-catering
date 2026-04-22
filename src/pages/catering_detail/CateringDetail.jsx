import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { generateWhatsAppMessage } from "../../lib/helpers";
import { useState } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import EmptyState from "../../components/shared/EmptyState";
import NotificationBell from "../../components/shared/NotificationBell";

// Sub-components
import CateringHeader from "./components/CateringHeader";
import CateringInfoGrid from "./components/CateringInfoGrid";
import CateringSlots from "./components/CateringSlots";
import RegistrationList from "./components/RegistrationList";
import UserProfileModal from "./components/UserProfileModal";
import AdminSummary from "./components/AdminSummary";
import RegistrationStatus from "./components/RegistrationStatus";
import { AdminActionButtons, CateringDressCode } from "./components/MiscComponents";

export default function CateringDetail() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const cateringRaw = useQuery(api.caterings.getCatering, { cateringId: id, token: token || undefined });
  const registrationsRaw = useQuery(api.registrations.getRegistrationsByCatering, { cateringId: id, token: token || undefined });
  const { data: catering, timedOut: catTimeout } = useQueryWithTimeout(cateringRaw);
  const { data: registrations, timedOut: regTimeout } = useQueryWithTimeout(registrationsRaw);
  const [copied, setCopied] = useState(false);
  const [viewUser, setViewUser] = useState(null);

  if (catTimeout || regTimeout) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const isAdmin = user ? (user.role === "admin" || user.role === "sub_admin") : false;

  if (catering === undefined) {
    return <LoadingState rows={3} />;
  }

  if (!catering) {
    return (
      <EmptyState 
        icon={CalendarDays} 
        title="Event not found" 
        description="The event you are looking for does not exist or has been removed."
        action={{ label: "Go Home", href: "/" }}
      />
    );
  }

  const myReg = registrations?.find((r) => r.userId === user?._id);

  // Aggregations
  const dropCounts = {};
  (registrations || []).forEach((r) => {
    dropCounts[r.dropPoint] = (dropCounts[r.dropPoint] || 0) + 1;
  });

  const roleCounts = {};
  (registrations || []).forEach((r) => {
    const key = `${r.role}-${r.days?.[0]}`;
    roleCounts[key] = (roleCounts[key] || 0) + 1;
  });

  const handleCopyMessage = () => {
    const url = `${window.location.origin}/catering/${catering._id}`;
    const msg = generateWhatsAppMessage(catering, url);
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="page-container" style={{ maxWidth: 720 }}>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <NotificationBell />
      </div>

      <CateringHeader catering={catering} />
      
      <CateringInfoGrid catering={catering} />

      <CateringSlots catering={catering} roleCounts={roleCounts} />

      <CateringDressCode notes={catering.dressCodeNotes} />

      {isAdmin && (
        <AdminSummary 
          catering={catering} 
          registrations={registrations} 
          dropCounts={dropCounts} 
          handleCopyMessage={handleCopyMessage} 
          copied={copied} 
        />
      )}

      <AdminActionButtons 
        id={id} 
        navigate={navigate} 
        isAdmin={isAdmin} 
        role={user?.role} 
        catering={catering} 
        paymentStarted={registrations?.some(r => r.paymentStatus === "cleared")}
      />

      <RegistrationList registrations={registrations} isAdmin={isAdmin} setViewUser={setViewUser} />

      <UserProfileModal viewUser={viewUser} setViewUser={setViewUser} />

      <RegistrationStatus 
        myReg={myReg} 
        catering={catering} 
        isSuperAdmin={user?.role === "admin"} 
        navigate={navigate} 
        id={id} 
        token={token} 
      />
    </div>
  );
}
