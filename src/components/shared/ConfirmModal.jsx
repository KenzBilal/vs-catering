import { AlertCircle, X } from "lucide-react";

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  variant = "danger" // danger, warning, primary
}) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-50 text-red-600',
          btn: 'bg-red-600 hover:bg-red-700 shadow-red-100',
        };
      case 'warning':
        return {
          iconBg: 'bg-orange-50 text-orange-600',
          btn: 'bg-orange-600 hover:bg-orange-700 shadow-orange-100',
        };
      default:
        return {
          iconBg: 'bg-stone-50 text-stone-600',
          btn: 'bg-stone-900 hover:bg-stone-800 shadow-stone-100',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-[28px] shadow-2xl max-w-[360px] w-full overflow-hidden animate-scale-up border border-cream-100" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${styles.iconBg}`}>
              <AlertCircle size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-[19px] font-black text-stone-900 tracking-tight leading-tight mb-2">
              {title}
            </h3>
            <p className="text-[14px] text-stone-500 font-medium leading-relaxed">
              {message}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`w-full py-3.5 text-[14px] font-bold text-white rounded-2xl shadow-lg transition-all active:scale-[0.98] ${styles.btn}`}
            >
              {confirmText}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3.5 text-[14px] font-bold text-stone-400 hover:text-stone-900 transition-colors"
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

