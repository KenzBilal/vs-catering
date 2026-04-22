import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { ArrowLeft, Camera, User, KeyRound, Loader2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConvexImage from "../../components/shared/ConvexImage";
import toast from "react-hot-toast";

export default function PersonalSettings() {
  const { user, token, login, resetPassword, isGoogleUser } = useAuth();
  const navigate = useNavigate();
  const updatePrefs = useMutation(api.users.updatePreferences);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [uploading, setUploading] = useState(false);
  const [resettingPwd, setResettingPwd] = useState(false);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const postUrl = await generateUploadUrl({ token });
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updatePrefs({ token, defaultDropPoint: user.defaultDropPoint, stayType: user.stayType, photoStorageId: storageId });
      login({ ...user, photoStorageId: storageId });
      toast.success("Profile photo updated");
    } catch (e) {
      toast.error("Photo upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
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
        onClick={() => navigate("/settings")} 
        className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-6"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Personal Settings</h2>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Update your profile picture and security.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Picture */}
        <div className="bg-white p-6 border border-cream-200 rounded-2xl shadow-sm">
          <h3 className="text-[12px] font-bold text-stone-400 uppercase tracking-widest mb-6">Profile Picture</h3>
          
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 shrink-0">
              <div className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-stone-100 shadow-md transition-all ${uploading ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                {user?.photoStorageId ? (
                  <ConvexImage storageId={user.photoStorageId} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-cream-200 flex items-center justify-center">
                    <User size={40} className="text-stone-400" />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center backdrop-blur-[1px]">
                    <Loader2 size={24} className="text-cream-50 animate-spin" />
                  </div>
                )}
              </div>
              <label className={`absolute -bottom-2 -right-2 w-8 h-8 bg-stone-900 text-cream-50 rounded-xl flex items-center justify-center cursor-pointer hover:bg-stone-800 transition-colors shadow-lg border-2 border-white ${uploading ? 'pointer-events-none opacity-50' : ''}`}>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
                <Camera size={16} />
              </label>
            </div>
            
            <div className="flex-1">
              <p className="text-[14px] font-bold text-stone-900">Your Photo</p>
              <p className="text-[12.5px] font-medium text-stone-500 mt-0.5 leading-relaxed">
                This photo is required for event registration and ID verification.
              </p>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white p-6 border border-cream-200 rounded-2xl shadow-sm">
          <h3 className="text-[12px] font-bold text-stone-400 uppercase tracking-widest mb-4">Account Information</h3>
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
              <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">Phone Number</label>
              <p className="text-[15px] font-semibold text-stone-900">{user?.phone}</p>
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
                  <p>Signed in via Google. Manage security in your Google settings.</p>
                </div>
              ) : (
                <p className="text-[12.5px] font-medium text-stone-500 mt-0.5">Receive a link to reset your password.</p>
              )}
            </div>
            {!isGoogleUser && (
              <button 
                onClick={handleResetPassword}
                disabled={resettingPwd}
                className="flex items-center gap-2 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-[13px] font-bold rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {resettingPwd ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                Reset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
