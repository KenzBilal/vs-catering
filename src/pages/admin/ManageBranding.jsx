import { useAuth } from "../../lib/AuthContext";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Globe, Check, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import ConvexImage from "../../components/shared/ConvexImage";

export default function ManageBranding() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const siteSettings = useQuery(api.adminSettings.getSiteSettings);
  const updateSiteSettings = useMutation(api.adminSettings.updateSiteSettings);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);

  const [siteName, setSiteName] = useState("");
  const [logoStorageId, setLogoStorageId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (siteSettings) {
      setSiteName(siteSettings.siteName || "Catering");
      setLogoStorageId(siteSettings.siteLogo || null);
    }
  }, [siteSettings]);

  const handleImageUpload = async (e) => {
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
      setLogoStorageId(storageId);
      toast.success("Logo uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!siteName.trim()) {
      toast.error("Site name is required");
      return;
    }

    setIsSaving(true);
    try {
      await updateSiteSettings({ 
        token, 
        siteName, 
        siteLogo: logoStorageId 
      });
      toast.success("Site branding updated!");
    } catch (e) {
      toast.error(e.message || "Failed to update branding");
    } finally {
      setIsSaving(false);
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
        <h2 className="text-2xl font-bold text-stone-900 tracking-tight">Site Branding</h2>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Customize how your website appears to all students and admins.
        </p>
      </div>

      <div className="space-y-6">
        {/* Site Name */}
        <div className="bg-white p-6 border border-cream-200 rounded-2xl shadow-sm">
          <label className="block text-[14px] font-bold text-stone-900 mb-2">Website Name</label>
          <div className="relative">
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Enter website name (e.g., VS Catering)"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-[15px] font-medium focus:ring-2 focus:ring-[#1a5c3a]/10 focus:border-[#1a5c3a] outline-none transition-all"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-300">
              <Globe size={18} />
            </div>
          </div>
          <p className="text-[12px] text-stone-400 mt-3 font-medium">
            This name will appear in the browser tab, navbar, and notifications.
          </p>
        </div>

        {/* Site Logo */}
        <div className="bg-white p-6 border border-cream-200 rounded-2xl shadow-sm">
          <label className="block text-[14px] font-bold text-stone-900 mb-4">Website Logo</label>
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-stone-50 border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden relative group">
              {logoStorageId ? (
                <ConvexImage storageId={logoStorageId} className="w-full h-full object-cover" />
              ) : (
                <div className="text-stone-300">
                  <Camera size={32} />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 size={24} className="text-[#1a5c3a] animate-spin" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <label className="bg-cream-100 hover:bg-cream-200 text-stone-700 px-4 py-2 rounded-xl text-[13px] font-bold inline-flex cursor-pointer mb-2 transition-colors">
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                {uploading ? "Uploading..." : "Change Logo"}
              </label>
              <p className="text-[12px] text-stone-400 font-medium">
                Upload a square logo for best results. Supports PNG, JPG.
              </p>
              {logoStorageId && (
                <button 
                  onClick={() => setLogoStorageId(null)}
                  className="text-[12px] font-bold text-red-600 hover:text-red-700 mt-2 block"
                >
                  Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving || uploading}
          className="w-full btn-primary py-4 text-[15px] shadow-xl shadow-[#1a5c3a]/20"
        >
          {isSaving ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Saving Changes...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Check size={18} />
              Save Global Branding
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
