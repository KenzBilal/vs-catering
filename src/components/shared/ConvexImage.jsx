import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export default function ConvexImage({ storageId, className, alt = "Photo" }) {
  const imageUrl = useQuery(api.files.getImageUrl, { storageId });

  if (!imageUrl) return <div className={`${className} bg-cream-100 animate-pulse`} />;

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      loading="lazy"
    />
  );
}
