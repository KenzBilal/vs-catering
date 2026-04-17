import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useState } from "react";
import { Search, Shield, User, UserCog } from "lucide-react";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";

const ROLE_FILTERS = ["All", "Admin", "Sub-Admin", "Student"];

const ROLE_LABELS = {
  admin: "Admin",
  sub_admin: "Sub-Admin",
  student: "Student",
};

const ROLE_BADGE = {
  admin: "bg-stone-900 text-cream-50",
  sub_admin: "bg-cream-200 text-stone-800",
  student: "bg-cream-100 text-stone-500",
};

export default function AdminUsers() {
  const { user: currentUser, token } = useAuth();
  const allUsersRaw = useQuery(api.users.getAllStudents, token ? { token } : "skip");
  const { data: allUsers, timedOut } = useQueryWithTimeout(allUsersRaw);
  const setUserRole = useMutation(api.users.setUserRole);

  if (timedOut) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [savingRole, setSavingRole] = useState({});

  const isAdmin = currentUser?.role === "admin";

  const handleRoleChange = async (userId, role) => {
    setSavingRole((s) => ({ ...s, [userId]: true }));
    try {
      await setUserRole({ userId, role, token });
    } finally {
      setSavingRole((s) => ({ ...s, [userId]: false }));
    }
  };

  const filtered = (allUsers || []).filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search);
    const matchRole =
      roleFilter === "All" ||
      (roleFilter === "Admin" && u.role === "admin") ||
      (roleFilter === "Sub-Admin" && u.role === "sub_admin") ||
      (roleFilter === "Student" && u.role === "student");
    return matchSearch && matchRole;
  });

  const counts = {
    total: (allUsers || []).length,
    admin: (allUsers || []).filter((u) => u.role === "admin").length,
    sub_admin: (allUsers || []).filter((u) => u.role === "sub_admin").length,
    student: (allUsers || []).filter((u) => u.role === "student").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Users</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          {counts.total} registered users
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white border border-cream-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Admins</p>
          <p className="text-2xl font-black text-stone-800">{counts.admin + counts.sub_admin}</p>
        </div>
        <div className="bg-white border border-cream-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Students</p>
          <p className="text-2xl font-black text-stone-800">{counts.student}</p>
        </div>
        <div className="bg-white border border-cream-200 rounded-xl p-4 text-center shadow-sm">
          <p className="text-[10.5px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total</p>
          <p className="text-2xl font-black text-stone-800">{counts.total}</p>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`px-3 py-2 rounded-lg text-[12.5px] font-semibold transition-all duration-150 active:scale-95 ${
                roleFilter === f
                  ? "bg-stone-900 text-cream-50 shadow-sm"
                  : "bg-white text-stone-500 border border-cream-200 hover:bg-cream-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {allUsers === undefined && (
        <div className="animate-pulse flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-14 bg-cream-100 rounded-xl w-full" />
          ))}
        </div>
      )}

      {/* User list */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 && allUsers !== undefined && (
          <div className="text-center py-12">
            <User size={36} className="mx-auto text-cream-300 mb-3" />
            <p className="font-semibold text-stone-500 text-[14px]">No users found.</p>
          </div>
        )}

        {filtered.map((u, idx) => (
          <div
            key={u._id}
            className={`flex items-center justify-between px-5 py-3.5 gap-4 ${
              idx !== filtered.length - 1 ? "border-b border-cream-100" : ""
            } hover:bg-cream-50/50 transition-colors`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar placeholder */}
              <div className="w-8 h-8 rounded-full bg-cream-200 flex items-center justify-center shrink-0">
                <span className="text-[12px] font-bold text-stone-600">
                  {u.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[14px] text-stone-900 truncate">{u.name}</p>
                <p className="text-[12px] font-medium text-stone-400">{u.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${ROLE_BADGE[u.role]}`}>
                {ROLE_LABELS[u.role]}
              </span>

              {isAdmin && (
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  disabled={savingRole[u._id] || u._id === currentUser._id}
                  className="bg-cream-50 border border-cream-200 text-stone-700 text-[12px] font-medium rounded-lg px-2 py-1.5 w-auto outline-none focus:ring-2 focus:ring-stone-800/10 cursor-pointer disabled:opacity-40"
                >
                  <option value="student">Student</option>
                  <option value="sub_admin">Sub-Admin</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
