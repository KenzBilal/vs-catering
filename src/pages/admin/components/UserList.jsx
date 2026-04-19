import { User } from "lucide-react";
import EmptyState from "../../../components/shared/EmptyState";

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

export default function UserList({ filtered, allUsers, search, isAdmin, currentUser, savingRole, handleRoleChange }) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
      {filtered.length === 0 && allUsers !== undefined && (
        <EmptyState 
          icon={User} 
          title="No users found" 
          description={search ? "Try a different search term or role filter." : "There are no users to display."}
        />
      )}

      {filtered.map((u, idx) => (
        <div
          key={u._id}
          className={`flex items-center justify-between px-5 py-3.5 gap-4 ${
            idx !== filtered.length - 1 ? "border-b border-cream-100" : ""
          } hover:bg-cream-50/50 transition-colors`}
        >
          <div className="flex items-center gap-3 min-w-0">
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
              <div className="relative">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u._id, e.target.value)}
                  disabled={savingRole[u._id] || u._id === currentUser._id}
                  className={`bg-cream-50 border border-cream-200 text-stone-700 text-[12px] font-medium rounded-lg px-2 py-1.5 w-auto outline-none transition-all ${
                    savingRole[u._id] ? "opacity-50 cursor-not-allowed pr-8" : "focus:ring-2 focus:ring-stone-800/10 cursor-pointer"
                  }`}
                >
                  <option value="student">Student</option>
                  <option value="sub_admin">Sub-Admin</option>
                  <option value="admin">Admin</option>
                </select>
                {savingRole[u._id] && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <div className="w-3 h-3 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
