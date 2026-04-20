import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ConvexImage({ storageId, className, alt = "Photo" }) {
  const imageUrl = useQuery(api.files.getImageUrl, { storageId });

  if (!imageUrl) return (
    <div className={`${className} bg-stone-100 flex items-center justify-center relative overflow-hidden`}>
       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
    </div>
  );

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}

