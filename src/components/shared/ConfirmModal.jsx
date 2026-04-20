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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-up" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              variant === 'danger' ? 'bg-red-50 text-red-600' : 
              variant === 'warning' ? 'bg-orange-50 text-orange-600' : 
              'bg-stone-50 text-stone-600'
            }`}>
              <AlertCircle size={20} />
            </div>
            <h3 className="text-[17px] font-bold text-stone-900">{title}</h3>
          </div>
          
          <p className="text-[14px] text-stone-500 font-medium leading-relaxed mb-6">
            {message}
          </p>

          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="flex-1 py-2.5 text-[14px] font-bold text-stone-500 bg-white border border-cream-200 rounded-xl hover:bg-cream-50 transition-colors"
            >
              {cancelText}
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-2.5 text-[14px] font-bold text-white rounded-xl shadow-lg transition-all active:scale-95 ${
                variant === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-100' : 
                variant === 'warning' ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-100' : 
                'bg-stone-900 hover:bg-stone-800 shadow-stone-100'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
