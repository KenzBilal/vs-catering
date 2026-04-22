import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Mail, ArrowLeft, RefreshCw, ExternalLink, CheckCircle2 } from "lucide-react";
import { auth } from "../../lib/firebase";
import { sendEmailVerification, reload, applyActionCode } from "firebase/auth";
import toast from "react-hot-toast";
import { useAuth } from "../../lib/AuthContext";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email");
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  const continueUrl = searchParams.get("continueUrl");
  const { login } = useAuth();

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verified, setVerified] = useState(false);
  const [processingCode, setProcessingCode] = useState(false);
  const [linkHandled, setLinkHandled] = useState(false);

  const loginUserMutation = useMutation(api.users.loginUser);

  // Handle verification via link (Option B - direct verification)
  useEffect(() => {
    if (oobCode && mode === "verifyEmail" && !linkHandled) {
      setLinkHandled(true);
      const verifyDirectly = async () => {
        setProcessingCode(true);
        setLoading(true);
        try {
          await applyActionCode(auth, oobCode);
          
          // Reload user to get updated status
          if (auth.currentUser) {
            await reload(auth.currentUser);
          }
          
          const userEmail = auth.currentUser?.email;
          if (userEmail) {
            const result = await loginUserMutation({ 
              email: userEmail, 
              firebaseVerified: true 
            });
            
            if (result && result.token) {
              setVerified(true);
              toast.success("Email verified successfully!");
              login(result, true);
              setTimeout(() => navigate("/"), 2000);
            } else {
              toast.error("Failed to sync verification status.");
            }
          } else {
            toast.success("Email verified successfully! Please sign in.");
            setTimeout(() => navigate("/login"), 1500);
          }
        } catch (err) {
          console.error("Verification Error:", err);
          const errorMessage = err.message || "";
          if (errorMessage.includes("invalid") || errorMessage.includes("expired")) {
            toast.error("Invalid or expired verification link. Please request a new one.");
          } else {
            toast.error("Verification failed. Please try again.");
          }
        } finally {
          setLoading(false);
          setProcessingCode(false);
        }
      };
      
      verifyDirectly();
    }
  }, [oobCode, mode, linkHandled, loginUserMutation, login, navigate]);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("Please sign in again to check status.");
        navigate("/login");
        return;
      }

      // Force reload user to get latest emailVerified status
      await reload(user);
      
      if (user.emailVerified) {
        toast.loading("Email verified! Syncing your account...", { id: "sync" });
        // Sync with Convex
        const result = await loginUserMutation({ 
          email: user.email, 
          firebaseVerified: true 
        });
        
        if (result && result.token) {
          setVerified(true);
          toast.success("Account synced successfully!", { id: "sync" });
          login(result, true);
          setTimeout(() => navigate("/"), 2000);
        } else {
          toast.error("Failed to sync verification status.", { id: "sync" });
        }
      } else {
        toast.error("Verification link not yet clicked. Please check your inbox.", { duration: 4000 });
      }
    } catch (err) {
      console.error("Check Status Error:", err);
      toast.error("Failed to check status.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    
    setResending(true);
    try {
      if (auth.currentUser) {
        const resendEmail = auth.currentUser.email || emailFromUrl;
        const actionCodeSettings = {
          url: `${window.location.origin}/verify-email${resendEmail ? `?email=${encodeURIComponent(resendEmail)}` : ""}`,
          handleCodeInApp: true,
        };
        await sendEmailVerification(auth.currentUser, actionCodeSettings);
        toast.success("Verification link resent!");
        setCooldown(60);
      } else {
        toast.error("Session expired. Please log in again.");
        navigate("/login");
      }
    } catch (err) {
      console.error("Resend Error:", err);
      toast.error("Failed to resend link. Please try again in a few minutes.");
    } finally {
      setResending(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-cream-bg">
        <div className="w-full max-w-md text-center animate-scale-up">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="text-green-600" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Verified!</h1>
          <p className="text-stone-500 font-medium">Your email has been verified. Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  if (processingCode || (loading && oobCode)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-cream-bg">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-12 h-12 border-4 border-stone-200 border-t-stone-900 rounded-full animate-spin mx-auto mb-6" />
          <h1 className="text-xl font-bold text-stone-900 mb-2">Verifying your email...</h1>
          <p className="text-stone-500 font-medium">Please wait while we confirm your email address.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-cream-bg">
      <div className="w-full max-w-md animate-slide-up">
        <Link to="/login" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 font-medium mb-8 transition-colors group">
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Login
        </Link>

        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-stone-900/20">
            <Mail className="text-cream-50" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Verify Your Email</h1>
          <p className="text-[14.5px] text-stone-500 mt-1 font-medium text-center px-4">
            We've sent a verification link to <br />
            <span className="text-stone-900 font-bold">{auth.currentUser?.email || emailFromUrl || "your email"}</span>
          </p>
        </div>

        <div className="card p-6 sm:p-8 flex flex-col gap-6 shadow-xl shadow-stone-200/50">
          <div className="space-y-4">
            <p className="text-[14px] text-stone-600 font-medium text-center leading-relaxed">
              Please click the link in the email to verify your account. If you don't see it, check your spam folder.
            </p>
            
            <button
              onClick={checkStatus}
              className="btn-primary w-full py-4 text-[15px] flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <ExternalLink size={18} />}
              I've Verified My Email
            </button>
          </div>

          <div className="h-px bg-stone-100 w-full" />

          <div className="text-center">
            <p className="text-[13.5px] text-stone-500 font-medium mb-3">Didn't receive the email?</p>
            <button
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className={`inline-flex items-center gap-2 font-bold text-[14px] transition-colors ${
                cooldown > 0 ? "text-stone-400" : "text-stone-900 hover:underline underline-offset-4"
              }`}
            >
              {resending ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : cooldown > 0 ? (
                `Resend link in ${cooldown}s`
              ) : (
                "Resend Verification Link"
              )}
            </button>
          </div>
        </div>

        <p className="text-[13px] text-center mt-8 font-medium text-stone-400 max-w-[280px] mx-auto">
          After verifying, click the button above to continue to your dashboard.
        </p>
      </div>
    </div>
  );
}
