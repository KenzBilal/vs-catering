import { ServerCrash, RefreshCw, WifiOff, Clock } from "lucide-react";

const VARIANTS = {
  network: {
    icon: WifiOff,
    color: "text-orange-500",
    bg: "bg-orange-50",
    border: "border-orange-100",
    title: "Connection problem",
    message: "Couldn't reach the server. Check your internet and try again.",
  },
  backend: {
    icon: ServerCrash,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-100",
    title: "Server error",
    message: "Something went wrong on our end. Please try again.",
  },
  timeout: {
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-100",
    title: "Taking too long",
    message: "The server is taking longer than expected. Please try again.",
  },
  notfound: {
    icon: ServerCrash,
    color: "text-stone-400",
    bg: "bg-cream-50",
    border: "border-cream-200",
    title: "Not found",
    message: "This item no longer exists or has been removed.",
  },
};

/**
 * Reusable error state UI for backend/query failures.
 * 
 * Usage:
 *   <ErrorState variant="network" onRetry={() => window.location.reload()} />
 *   <ErrorState variant="backend" message="Custom message" compact />
 */
export default function ErrorState({
  variant = "backend",
  title,
  message,
  onRetry,
  compact = false,
}) {
  const v = VARIANTS[variant] || VARIANTS.backend;
  const Icon = v.icon;
  const displayTitle = title || v.title;
  const displayMessage = message || v.message;

  if (compact) {
    return (
      <div className={`flex items-start gap-3 p-4 rounded-xl border ${v.bg} ${v.border}`}>
        <Icon size={18} className={`${v.color} shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] font-bold ${v.color}`}>{displayTitle}</p>
          <p className="text-[12px] font-medium text-stone-500 mt-0.5">{displayMessage}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 flex items-center gap-1 text-[12px] font-bold text-stone-600 hover:text-stone-900 bg-white border border-cream-200 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className={`w-14 h-14 ${v.bg} border ${v.border} rounded-2xl flex items-center justify-center mb-5`}>
        <Icon size={24} className={v.color} />
      </div>
      <p className="text-[16px] font-bold text-stone-900 mb-1.5">{displayTitle}</p>
      <p className="text-[13.5px] font-medium text-stone-500 max-w-xs leading-relaxed">{displayMessage}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-6 flex items-center gap-2 btn-secondary py-2.5 px-5 text-[13px]"
        >
          <RefreshCw size={15} /> Try Again
        </button>
      )}
    </div>
  );
}
