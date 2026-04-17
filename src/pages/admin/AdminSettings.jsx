import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function AdminSettings() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const dropPoints = useQuery(api.dropPoints.getDropPoints);
  const allUsers = useQuery(api.users.getAllStudents);
  const addDropPoint = useMutation(api.dropPoints.addDropPoint);
  const deactivateDropPoint = useMutation(api.dropPoints.deactivateDropPoint);
  const setUserRole = useMutation(api.users.setUserRole);

  const [newDrop, setNewDrop] = useState("");
  const [addingDrop, setAddingDrop] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [savingRole, setSavingRole] = useState({});

  if (user?.role !== "admin") {
    return (
      <div className="page-container">
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleAddDrop = async () => {
    if (!newDrop.trim()) return;
    setAddingDrop(true);
    await addDropPoint({ name: newDrop.trim() });
    setNewDrop("");
    setAddingDrop(false);
  };

  const handleRoleChange = async (userId, role) => {
    setSavingRole((s) => ({ ...s, [userId]: true }));
    await setUserRole({ userId, role, token });
    setSavingRole((s) => ({ ...s, [userId]: false }));
  };

  const filteredUsers = (allUsers || []).filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.phone.includes(userSearch)
  );

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <button onClick={() => navigate("/admin")} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 16 }}>
        ← Back to Dashboard
      </button>

      <h2 className="text-xl font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Settings</h2>

      {/* Drop points */}
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="section-title">Drop Points</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          Pickup is always Main Gate. These are the available drop points for students.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {(dropPoints || []).map((dp) => (
            <div
              key={dp._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "var(--cream-bg)",
                border: "1px solid var(--cream-border)",
                borderRadius: 6,
              }}
            >
              <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{dp.name}</span>
              {dp.name !== "Main Gate" && (
                <button
                  onClick={() => deactivateDropPoint({ dropPointId: dp._id })}
                  style={{ fontSize: 12, color: "#b91c1c", background: "none", border: "none", cursor: "pointer" }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            placeholder="New drop point name"
            value={newDrop}
            onChange={(e) => setNewDrop(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddDrop()}
          />
          <button className="btn-primary" onClick={handleAddDrop} disabled={addingDrop} style={{ whiteSpace: "nowrap" }}>
            Add
          </button>
        </div>
      </div>

      {/* User roles */}
      <div className="card">
        <p className="section-title">User Roles</p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
          Assign admin or sub-admin roles to students.
        </p>
        <input
          type="text"
          placeholder="Search by name or phone"
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
          {filteredUsers.map((u) => (
            <div
              key={u._id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                background: "var(--cream-bg)",
                border: "1px solid var(--cream-border)",
                borderRadius: 6,
              }}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>{u.name}</p>
                <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{u.phone}</p>
              </div>
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u._id, e.target.value)}
                disabled={savingRole[u._id]}
                style={{ width: "auto", padding: "5px 8px", fontSize: 12 }}
              >
                <option value="student">Student</option>
                <option value="sub_admin">Sub-Admin</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
