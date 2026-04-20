import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useState } from "react";
import { MapPin, Plus, Trash2, ArrowLeft, Loader2, Power } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";
import LoadingState from "../../components/shared/LoadingState";
import toast from "react-hot-toast";

export default function ManageDropPoints() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const dropPointsRaw = useQuery(api.adminSettings.getDropPoints);
  const { data: dropPoints, timedOut } = useQueryWithTimeout(dropPointsRaw);
  
  const addDropPoint = useMutation(api.adminSettings.addDropPoint);
  const removeDropPoint = useMutation(api.adminSettings.removeDropPoint);
  const toggleStatus = useMutation(api.adminSettings.toggleDropPointStatus);

  const [newDrop, setNewDrop] = useState("");
  const [adding, setAdding] = useState(false);

  if (timedOut) return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  if (dropPoints === undefined) return <LoadingState rows={5} />;

  const handleAdd = async () => {
    if (!newDrop.trim()) return;
    setAdding(true);
    try {
      await addDropPoint({ name: newDrop.trim(), token });
      toast.success("Drop point added");
      setNewDrop("");
    } catch (e) {
      toast.error(e.message || "Failed to add drop point");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id) => {
    if (!confirm("Are you sure you want to delete this drop point?")) return;
    try {
      await removeDropPoint({ dropPointId: id, token });
      toast.success("Deleted successfully");
    } catch (e) {
      toast.error("Failed to delete");
    }
  };

  const handleToggle = async (id, current) => {
    try {
      await toggleStatus({ dropPointId: id, isActive: !current, token });
      toast.success(current ? "Deactivated" : "Activated");
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <button
          onClick={() => navigate("/admin/settings")}
          className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 hover:text-stone-900 transition-colors mb-4"
        >
          <ArrowLeft size={16} /> Back to Settings
        </button>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Drop Points</h1>
        <p className="text-[14.5px] font-medium text-stone-500 mt-1">
          Add or remove available drop-off locations for student registrations.
        </p>
      </div>

      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="p-5 border-b border-cream-100 flex gap-3">
          <div className="relative flex-1">
            <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="e.g. Main Entrance"

              value={newDrop}
              onChange={(e) => setNewDrop(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="pl-11 bg-cream-50/50"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={adding || !newDrop.trim()}
            className="btn-primary px-6"
          >
            {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            <span>Add Point</span>
          </button>
        </div>

        <div className="divide-y divide-cream-100">
          {dropPoints.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-stone-400 font-medium">No drop points added yet.</p>
            </div>
          ) : (
            dropPoints.map((dp) => (
              <div key={dp._id} className="flex items-center justify-between p-4 px-6 hover:bg-cream-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${dp.isActive ? "bg-green-500" : "bg-stone-300"}`} />
                  <span className={`font-bold text-[15px] ${dp.isActive ? "text-stone-800" : "text-stone-400 line-through"}`}>
                    {dp.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(dp._id, dp.isActive)}
                    title={dp.isActive ? "Deactivate" : "Activate"}
                    className={`p-2 rounded-xl transition-all active:scale-90 ${
                      dp.isActive ? "text-stone-400 hover:text-stone-900 hover:bg-stone-100" : "text-green-600 hover:bg-green-50"
                    }`}
                  >
                    <Power size={17} />
                  </button>
                  <button
                    onClick={() => handleRemove(dp._id)}
                    className="p-2 rounded-xl text-stone-300 hover:text-red-600 hover:bg-red-50 transition-all active:scale-90"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
