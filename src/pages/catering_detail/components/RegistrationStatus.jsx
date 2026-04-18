import { CheckCircle2 } from "lucide-react";
import { getRoleLabel } from "../../../lib/helpers";

export default function RegistrationStatus({ myReg, catering, isAdmin, navigate, id }) {
  if (isAdmin || catering.status === "ended") return null;

  return (
    <div className="mt-8 mb-4">
      {myReg ? (
        <div className="bg-[#e8f5ee] border border-[#b8dfc8] rounded-xl p-5 text-center shadow-sm">
          <div className="flex justify-center mb-2 text-[#1a5c3a]"><CheckCircle2 size={24} /></div>
          <p className="font-bold text-[16px] text-[#1a5c3a] mb-1">You are registered</p>
          <p className="text-[14px] text-[#2d7a52] font-medium">
            {getRoleLabel(myReg.role)} <span className="mx-1.5">•</span> 
            {myReg.isConfirmed ? "Confirmed" : "Waitlisted"} <span className="mx-1.5">•</span> 
            Drop: {myReg.dropPoint}
          </p>
        </div>
      ) : (
        <button className="btn-primary w-full py-4 text-[16px]" onClick={() => navigate(`/catering/${id}/register`)}>
          Register for Event
        </button>
      )}
    </div>
  );
}
