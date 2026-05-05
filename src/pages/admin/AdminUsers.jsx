import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
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
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [savingRole, setSavingRole] = useState({});

  const statsRaw = useQuery(api.users.getUserStats, token ? { token } : "skip");
  const { data: counts, timedOut: statsTimeout } = useQueryWithTimeout(statsRaw);

  const { results: filtered, status, loadMore } = usePaginatedQuery(
    api.users.getUsersPaginated,
    token ? { roleFilter, searchQuery: search, token } : "skip",
    { initialNumItems: 50 }
  );

  const setUserRole = useMutation(api.users.setUserRole);

  if (statsTimeout) {
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Users</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          {counts ? counts.total : "..."} registered users
        </p>
      </div>

      <UserStats counts={counts || { total: 0, admin: 0, sub_admin: 0, student: 0 }} />

      <UserSearchFilters 
        search={search} 
        setSearch={setSearch} 
        roleFilter={roleFilter} 
        setRoleFilter={setRoleFilter} 
      />

      {status === "LoadingFirstPage" ? (
        <LoadingState rows={5} />
      ) : (
        <>
          <UserList 
            filtered={filtered} 
            allUsers={filtered} // userlist just renders what we give it
            search={search} 
            isAdmin={isAdmin} 
            currentUser={currentUser} 
            savingRole={savingRole} 
            handleRoleChange={handleRoleChange} 
          />
          {status === "CanLoadMore" && (
            <button 
              onClick={() => loadMore(50)} 
              className="mt-6 w-full py-2 bg-cream-50 hover:bg-cream-100 text-stone-700 text-sm font-bold rounded-xl border border-cream-200 transition-all"
            >
              Load More Users
            </button>
          )}
          {status === "LoadingMore" && (
            <div className="mt-6 flex justify-center">
              <span className="text-sm font-medium text-stone-500">Loading more...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
