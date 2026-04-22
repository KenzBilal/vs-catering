import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

export default function AuthActionHandler() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const apiKey = searchParams.get("apiKey");

  useEffect(() => {
    if (!mode || !oobCode) {
      navigate("/login");
      return;
    }

    // Traffic Control: Route based on the "mode" parameter from Firebase
    switch (mode) {
      case "verifyEmail":
        navigate(`/verify-email?oobCode=${oobCode}${apiKey ? `&apiKey=${apiKey}` : ""}`);
        break;
      case "resetPassword":
        navigate(`/reset-password?oobCode=${oobCode}${apiKey ? `&apiKey=${apiKey}` : ""}`);
        break;
      case "recoverEmail":
        // Handle email recovery if needed
        navigate("/login");
        break;
      default:
        navigate("/login");
    }
  }, [mode, oobCode, apiKey, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-bg">
      <div className="text-center">
        <Loader2 className="animate-spin text-stone-400 mx-auto mb-4" size={32} />
        <p className="text-stone-500 font-medium">Securing your account...</p>
      </div>
    </div>
  );
}
