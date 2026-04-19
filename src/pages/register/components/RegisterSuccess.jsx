import { CheckCircle2 } from "lucide-react";

export default function RegisterSuccess({ catering, id, navigate }) {
  return (
    <div className="page-container" style={{ maxWidth: 500 }}>
      <div className="card text-center p-10 flex flex-col items-center">
        <div className="w-16 h-16 bg-[#e8f5ee] rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 size={32} className="text-[#1a5c3a]" />
        </div>
        <p className="text-2xl font-bold text-stone-900 mb-2 tracking-tight">Registered</p>
        <p className="text-[14.5px] text-stone-500 mb-8 font-medium">
          You are registered for {catering.place}. Your spot will be confirmed by admins soon.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button className="btn-primary w-full py-3.5" onClick={() => navigate("/")}>Back to Dashboard</button>
          <button className="btn-secondary w-full py-3.5" onClick={() => navigate(`/catering/${id}`)}>View Event Details</button>
        </div>
      </div>
    </div>
  );
}
