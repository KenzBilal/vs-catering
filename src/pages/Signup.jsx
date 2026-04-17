import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const createUser = useMutation(api.users.createUser);
  const dropPoints = useQuery(api.dropPoints.getDropPoints);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    stayType: "hostel",
    gender: "male",
    defaultDropPoint: "Main Gate",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.phone.trim() || form.phone.length < 10) return setError("Enter a valid phone number.");
    setLoading(true);
    try {
      const id = await createUser(form);
      login({ _id: id, ...form, role: "student" });
      navigate("/");
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>
            VS-Catering
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Create your account to register for caterings.
          </p>
        </div>

        <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label className="label">Full Name</label>
            <input
              type="text"
              placeholder="Your name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          <div>
            <label className="label">Phone Number</label>
            <input
              type="tel"
              placeholder="10-digit number"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
          </div>

          <div>
            <label className="label">Gender</label>
            <div style={{ display: "flex", gap: 10 }}>
              {["male", "female"].map((g) => (
                <button
                  key={g}
                  onClick={() => set("gender", g)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 6,
                    border: `1px solid ${form.gender === g ? "var(--accent)" : "var(--cream-border)"}`,
                    background: form.gender === g ? "var(--accent)" : "var(--cream-card)",
                    color: form.gender === g ? "var(--cream-50)" : "var(--text-primary)",
                    fontSize: 14,
                    fontWeight: 500,
                    textTransform: "capitalize",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Where do you stay?</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[["hostel", "Hostel"], ["day_scholar", "Day Scholar"]].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => set("stayType", val)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: 6,
                    border: `1px solid ${form.stayType === val ? "var(--accent)" : "var(--cream-border)"}`,
                    background: form.stayType === val ? "var(--accent)" : "var(--cream-card)",
                    color: form.stayType === val ? "var(--cream-50)" : "var(--text-primary)",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Default Drop Point</label>
            <select
              value={form.defaultDropPoint}
              onChange={(e) => set("defaultDropPoint", e.target.value)}
            >
              {(dropPoints || ["Main Gate", "Dakoha", "Law Gate"]).map((dp) => (
                <option key={dp.name || dp} value={dp.name || dp}>
                  {dp.name || dp}
                </option>
              ))}
            </select>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Pickup is always from Main Gate. This is your preferred drop point.
            </p>
          </div>

          {error && (
            <p className="text-sm" style={{ color: "#b91c1c" }}>
              {error}
            </p>
          )}

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </div>

        <p className="text-sm text-center mt-4" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
