import { Camera, XCircle, AlertCircle } from "lucide-react";
import ConvexImage from "../../../components/shared/ConvexImage";

export default function PhotoUpload({ 
  catering, user, selectedFile, setSelectedFile, preview, errors, handleFileChange, MAX_PHOTO_SIZE_MB 
}) {
  if (!catering.photoRequired) return null;

  return (
    <div>
      <label className="label">Photo Verification <span className="text-stone-400 lowercase">(Required)</span></label>
      <div className="mt-2">
        {user?.photoStorageId && !selectedFile ? (
          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden p-3 flex items-center gap-4">
            <ConvexImage storageId={user.photoStorageId} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="text-[14px] font-bold text-stone-800">Using saved photo</p>
              <p className="text-[12.5px] text-stone-500 font-medium">From your account profile</p>
            </div>
            <label className="p-2.5 bg-cream-50 hover:bg-cream-100 text-stone-600 rounded-xl cursor-pointer transition-colors border border-cream-200">
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <Camera size={18} />
            </label>
          </div>
        ) : !selectedFile ? (
          <div className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center hover:border-stone-300 transition-colors cursor-pointer group ${errors.photo ? 'border-red-300 bg-red-50/30' : 'border-cream-200'}`}>
            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} />
            <div className="w-12 h-12 bg-cream-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-cream-100 transition-colors">
              <Camera size={24} className={errors.photo ? 'text-red-400' : 'text-stone-400'} />
            </div>
            <p className={`text-[13.5px] font-semibold ${errors.photo ? 'text-red-600' : 'text-stone-600'}`}>Click to upload photo</p>
            <p className="text-[11px] text-stone-400 mt-1 font-medium">PNG, JPG up to {MAX_PHOTO_SIZE_MB}MB</p>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden border border-cream-200 bg-white p-2">
            <img src={preview} className="w-full h-48 object-cover rounded-xl" alt="Preview" />
            <button
              onClick={() => setSelectedFile(null)}
              className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow-sm p-2 rounded-full text-red-600 hover:bg-white transition-colors"
            >
              <XCircle size={18} />
            </button>
            <div className="p-2 flex justify-between items-center">
              <div>
                <p className="text-[12px] font-semibold text-stone-500 truncate max-w-[200px]">{selectedFile.name}</p>
                <p className="text-[11px] text-stone-400 font-medium">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              {user?.photoStorageId && (
                <button onClick={() => setSelectedFile(null)} className="text-[11px] font-bold text-stone-400 hover:text-stone-600 uppercase tracking-wider">
                  Use Saved
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      {errors.photo && <p className="text-[12.5px] text-red-600 font-medium mt-1.5 ml-1">{errors.photo}</p>}
      {selectedFile && (
        <p className="text-[11px] text-[#8b3a00] font-bold mt-2 px-1 flex items-center gap-1.5">
          <AlertCircle size={12} /> This will also update your account profile photo.
        </p>
      )}
    </div>
  );
}
