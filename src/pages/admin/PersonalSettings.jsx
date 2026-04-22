import { useAuth } from "../../lib/AuthContext";
import { useState } from "react";
import { ArrowLeft, KeyRound, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function PersonalSettings() {
  const { user, resetPassword, isGoogleUser } = useAuth();
  const navigate = useNavigate();
  const [resettingPwd, setResettingPwd] = useState(false);

  const handleResetPassword = async () => {
    if (!user?.email) return;
    if (isGoogleUser) {
      toast.error("Accounts managed by Google do not have a separate password. Please manage security in your Google Account settings.");
      return;
    }
    setResettingPwd(true);
    try {
      await resetPassword(user.email);
      toast.success("Password reset email sent.");
    } catch (e) {
      toast.error(e.message || "Failed to send reset email.");
    } finally {
      setResettingPwd(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <button 
        onClick={() => navigate("/admin/settings")} 
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Personal Settings</h2>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Manage your account profile and security preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Info */}
        <div className="bg-white p-6 border border-cream-200 rounded-2xl shadow-sm">
          <h3 className="text-[12px] font-bold text-stone-400 uppercase tracking-widest mb-4">Account Profile</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Full Name</label>
              <p className="text-[15px] font-semibold text-stone-900">{user?.name}</p>
            </div>
            
            <div className="pt-4 border-t border-cream-50">
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Email Address</label>
              <p className="text-[15px] font-semibold text-stone-900">{user?.email}</p>
            </div>

            <div className="pt-4 border-t border-cream-50">
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Role</label>
              <div className="flex items-center gap-1.5 text-[13px] font-bold text-stone-700 capitalize">
                <ShieldCheck size={14} className="text-stone-400" />
                {user?.role?.replace("_", " ")}
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white p-6 border border-cream-200 rounded-2xl shadow-sm">
          <h3 className="text-[12px] font-bold text-stone-400 uppercase tracking-widest mb-4">Security</h3>
          
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-[70%]">
              <p className="text-[14px] font-bold text-stone-900">Account Password</p>
              {isGoogleUser ? (
                <div className="mt-1 flex items-start gap-2 text-[12.5px] text-stone-500 font-medium leading-relaxed">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-stone-400" />
                  <p>You are signed in with Google. Passwords for Google accounts are managed directly by Google. Visit your Google Account security settings to update it.</p>
                </div>
              ) : (
                <p className="text-[12.5px] font-medium text-stone-500 mt-0.5">Receive a secure link to update your password.</p>
              )}
            </div>
            
            {!isGoogleUser && (
              <button 
                onClick={handleResetPassword}
                disabled={resettingPwd}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-stone-100 transition-all active:scale-95 disabled:opacity-50"
              >
                {resettingPwd ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <KeyRound size={16} />
                )}
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
