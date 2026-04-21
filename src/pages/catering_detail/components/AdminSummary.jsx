import { Share2 } from "lucide-react";
import { generateWhatsAppMessage } from "../../../lib/helpers";

export default function AdminSummary({ catering, registrations, dropCounts, handleCopyMessage, copied }) {
  const hasRegistrations = registrations && registrations.length > 0;


  return (
    <>
      {hasRegistrations && (
        <div className="card mb-6 p-6">
          <h3 className="section-title">Drop Point Summary</h3>
          <div className="flex flex-col gap-2 mt-4">
            {Object.entries(dropCounts).map(([point, count]) => (
              <div key={point} className="flex justify-between items-center text-[14.5px] py-2 border-b border-cream-100 last:border-0">
                <span className="text-stone-600 font-medium">{point}</span>
                <span className="font-bold text-stone-900 bg-cream-100 px-2 py-0.5 rounded-md">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}


      <div className="card mb-6 p-6 border-stone-300">
        <div className="flex justify-between items-center mb-4">
          <h3 className="section-title !mb-0 flex items-center gap-2">
            <Share2 size={18} className="text-stone-400"/> Share on WhatsApp
          </h3>
          <button className="btn-secondary py-1.5 px-3 text-[12px]" onClick={handleCopyMessage}>
            {copied ? <span className="text-[#1a5c3a] font-bold">Copied!</span> : "Copy"}
          </button>
        </div>
        <div className="bg-cream-50 border border-cream-200 rounded-xl p-4 text-[13px] text-stone-600 whitespace-pre-wrap font-mono leading-relaxed max-h-[200px] overflow-y-auto">
          {generateWhatsAppMessage(catering, `${window.location.origin}/catering/${catering._id}`)}
        </div>
      </div>
    </>
  );
}
