import { useState, useEffect } from "react";
import { Wifi, WifiOff, X } from "lucide-react";

/**
 * Detects browser online/offline events and shows a sticky banner.
 * Also shows a "Back online" confirmation briefly when connection restores.
 */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3500);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setDismissed(false);
      setShowRestored(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Offline banner
  if (!isOnline && !dismissed) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-between gap-3 bg-stone-900 text-cream-50 px-4 py-2.5 shadow-xl animate-slide-down">
        <div className="flex items-center gap-2.5">
          <WifiOff size={16} className="shrink-0 text-red-400" />
          <div>
            <p className="text-[13px] font-bold leading-tight">You're offline</p>
            <p className="text-[11.5px] font-medium text-stone-400">Check your connection. Changes won't be saved.</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    );
  }

  // "Back online" success flash
  if (showRestored) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[9999] flex items-center gap-2.5 bg-[#1a5c3a] text-white px-4 py-2.5 shadow-xl animate-slide-down">
        <Wifi size={16} className="shrink-0 text-green-300" />
        <p className="text-[13px] font-bold">Back online — you're all set.</p>
      </div>
    );
  }

  return null;
}
