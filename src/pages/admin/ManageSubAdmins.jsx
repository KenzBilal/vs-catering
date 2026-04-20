import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useState, useEffect } from "react";
import { ShieldCheck, ArrowLeft, Loader2, Search, UserPlus, X, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import ConfirmModal from "../../components/shared/ConfirmModal";
import toast from "react-hot-toast";


export default function ManageSubAdmins() {
  const { token } = useAuth();
  const navigate = useNavigate();
  
  // Settings & Permissions
  const settingsRaw = useQuery(api.adminSettings.getSettings, { token });
  const { data: settings, timedOut: settingsTimeout } = useQueryWithTimeout(settingsRaw);
  const togglePermission = useMutation(api.adminSettings.togglePermission);
  const initializeSettings = useMutation(api.adminSettings.initializeSettings);

  // Users
  const allUsersRaw = useQuery(api.users.getAllStudents, { token });
  const { data: allUsers, timedOut: usersTimeout } = useQueryWithTimeout(allUsersRaw);
  const setUserRole = useMutation(api.users.setUserRole);

  const [search, setSearch] = useState("");
  const [promoting, setPromoting] = useState({});
  const [confirmRevoke, setConfirmRevoke] = useState(null); // userId to revoke


  useEffect(() => {
    if (settings === null) {
      initializeSettings({ token });
    }
  }, [settings, initializeSettings, token]);

  if (settingsTimeout || usersTimeout) return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  if (settings === undefined || allUsers === undefined) return <LoadingState rows={10} />;

  const subAdmins = allUsers.filter(u => u.role === "sub_admin");
  const filteredUsers = allUsers.filter(u => 
    u.role === "student" && 
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search))
  ).slice(0, 5);

  const handleToggle = async (permission, current) => {
    try {
      await togglePermission({ token, permission, enabled: !current });
      toast.success("Permission updated");
    } catch (e) {
      toast.error("Failed to update permission");
    }
  };

  const handleSetRole = async (userId, role) => {
    setPromoting(prev => ({ ...prev, [userId]: true }));
    try {
      await setUserRole({ token, userId, role });
      toast.success(role === "sub_admin" ? "Promoted to Sub-Admin" : "Role revoked");
      setSearch("");
    } catch (e) {
      toast.error(e.message || "Failed to update role");
    } finally {
      setPromoting(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/settings")}
          className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Settings
        </button>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Sub-Admins</h1>
        <p className="text-[14.5px] font-medium text-stone-500 mt-1">
          Manage sub-admin access and permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Col: Permissions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-white p-6">
            <h2 className="font-bold text-[16px] text-stone-900 mb-2 flex items-center gap-2">
              <ShieldCheck size={18} className="text-stone-400" />
              Permissions
            </h2>
            <p className="text-[12.5px] font-medium text-stone-400 mb-6">
              Set what sub-admins can do across the platform.
            </p>

            <div className="space-y-3">
              {(settings?.subAdminPermissions || []).map((p) => (
                <div key={p.permission} className="flex flex-col gap-1">
                  <button
                    onClick={() => handleToggle(p.permission, p.enabled)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all active:scale-[0.98] ${
                      p.enabled 
                        ? "bg-stone-900 border-stone-900 text-cream-50 shadow-md" 
                        : "bg-white border-cream-200 text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    <div className="text-left">
                      <span className="text-[14px] font-bold block">{p.label || p.permission}</span>
                      {p.description && (
                        <span className={`text-[11px] font-medium block mt-0.5 ${p.enabled ? "text-cream-200" : "text-stone-400"}`}>
                          {p.description}
                        </span>
                      )}
                    </div>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${p.enabled ? "bg-white text-stone-900" : "bg-cream-100 text-stone-300"}`}>
                      {p.enabled ? <Check size={14} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: User Management */}
        <div className="lg:col-span-3 space-y-6">
          {/* Add New Sub-Admin */}
          <div className="card bg-white p-6">
            <h2 className="font-bold text-[16px] text-stone-900 mb-5">Add Sub-Admin</h2>
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search students by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 bg-cream-50/50"
              />
            </div>

            {search && (
              <div className="space-y-2 mb-4 animate-fade-in">
                {filteredUsers.length === 0 ? (
                  <p className="text-[13px] text-stone-400 text-center py-2">No students found matching "{search}"</p>
                ) : (
                  filteredUsers.map(u => (
                    <div key={u._id} className="flex items-center justify-between p-3 bg-cream-50 border border-cream-100 rounded-xl">
                      <div>
                        <p className="text-[13.5px] font-bold text-stone-800">{u.name}</p>
                        <p className="text-[12px] font-medium text-stone-400">{u.phone}</p>
                      </div>
                      <button
                        onClick={() => handleSetRole(u._id, "sub_admin")}
                        disabled={promoting[u._id]}
                        className="btn-primary py-1.5 px-3 text-[12px] h-auto"
                      >
                        {promoting[u._id] ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                        Promote
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Current Sub-Admins */}
          <div className="card bg-white p-6">
            <h2 className="font-bold text-[16px] text-stone-900 mb-5">Current Sub-Admins</h2>
            <div className="space-y-3">
              {subAdmins.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-stone-400 text-[14px]">No sub-admins assigned yet.</p>
                </div>
              ) : (
                subAdmins.map(u => (
                  <div key={u._id} className="flex items-center justify-between p-4 border border-cream-200 rounded-2xl group hover:border-stone-300 transition-colors">
                    <div>
                      <p className="text-[14.5px] font-bold text-stone-800">{u.name}</p>
                      <p className="text-[12.5px] font-medium text-stone-400">{u.phone}</p>
                    </div>
                    <button
                      onClick={() => setConfirmRevoke(u._id)}
                      disabled={promoting[u._id]}
                      className="p-2.5 rounded-xl text-stone-300 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                      title="Revoke access"
                    >
                      {promoting[u._id] ? <Loader2 size={16} className="animate-spin" /> : <X size={18} />}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
       <ConfirmModal 
        isOpen={!!confirmRevoke}
        onClose={() => setConfirmRevoke(null)}
        onConfirm={() => handleSetRole(confirmRevoke, "student")}
        title="Revoke Access"
        message="Are you sure you want to revoke this user's sub-admin permissions? They will be demoted to student role."
        variant="danger"
      />
    </div>
  );
}

