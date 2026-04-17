import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");

  const result = useQuery(
    api.users.loginUser,
    tried ? { phone, name } : "skip"
  );

  const handleSubmit = () => {
    setError("");
    if (!phone.trim() || phone.length < 10) return setError("Enter a valid phone number.");
    if (!name.trim()) return setError("Enter your name.");
    setTried(true);
  };

  // When query resolves after trying
  if (tried && result !== undefined) {
    if (result === null) {
      setTried(false);
      setError("No account found with this name and phone number.");
    } else {
      login(result);
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            VS-Catering
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Log in to your account.
          </p>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              placeholder="10-digit number"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>

          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              placeholder="Your name as registered"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={tried}
            style={{ marginTop: 4 }}
          >
            {tried ? "Checking..." : "Log In"}
          </button>
        </div>

        <p className="text-sm text-center mt-4" style={{ color: "var(--text-muted)" }}>
          Don't have an account?{" "}
          <Link to="/signup" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
