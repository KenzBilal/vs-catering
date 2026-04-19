import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useState } from "react";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import toast from "react-hot-toast";

// Sub-components
import UserStats from "./components/UserStats";
import UserSearchFilters from "./components/UserSearchFilters";
import UserList from "./components/UserList";

export default function AdminUsers() {
  const { user: currentUser, token } = useAuth();
  const allUsersRaw = useQuery(api.users.getAllStudents, token ? { token } : "skip");
  const { data: allUsers, timedOut } = useQueryWithTimeout(allUsersRaw);
  const setUserRole = useMutation(api.users.setUserRole);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [savingRole, setSavingRole] = useState({});

  if (timedOut) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  const isAdmin = currentUser?.role === "admin";

  const handleRoleChange = async (userId, role) => {
    setSavingRole((s) => ({ ...s, [userId]: true }));
    try {
      await setUserRole({ userId, role, token });
      toast.success("Role updated successfully");
    } catch (e) {
      toast.error(e.message || "Failed to update role");
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

      <UserStats counts={counts} />

      <UserSearchFilters 
        search={search} 
        setSearch={setSearch} 
        roleFilter={roleFilter} 
        setRoleFilter={setRoleFilter} 
      />

      {allUsers === undefined ? (
        <LoadingState rows={5} />
      ) : (
        <UserList 
          filtered={filtered} 
          allUsers={allUsers} 
          search={search} 
          isAdmin={isAdmin} 
          currentUser={currentUser} 
          savingRole={savingRole} 
          handleRoleChange={handleRoleChange} 
        />
      )}
    </div>
  );
}
