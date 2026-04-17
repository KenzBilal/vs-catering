import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "../../lib/AuthContext";
import { useState } from "react";
import { MapPin, Plus, Trash2 } from "lucide-react";
import { useQueryWithTimeout } from "../../hooks/useQueryWithTimeout";
import ErrorState from "../../components/shared/ErrorState";

export default function AdminSettings() {
  const { user } = useAuth();
  const dropPointsRaw = useQuery(api.dropPoints.getDropPoints);
  const { data: dropPoints, timedOut } = useQueryWithTimeout(dropPointsRaw);
  const addDropPoint = useMutation(api.dropPoints.addDropPoint);
  const deactivateDropPoint = useMutation(api.dropPoints.deactivateDropPoint);

  const [newDrop, setNewDrop] = useState("");
  const [addingDrop, setAddingDrop] = useState(false);

  if (timedOut) {
    return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
  }

  if (user?.role !== "admin") {
    return (
      <div>
        <p className="text-stone-500 text-[14px]">You do not have permission to view this page.</p>
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">Settings</h1>
        <p className="text-[14px] font-medium text-stone-500 mt-1">
          Manage drop points for student registrations.
        </p>
      </div>

      <div className="max-w-xl">
        <div className="card bg-white p-6">
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={18} className="text-stone-400" />
            <h2 className="font-bold text-[16px] text-stone-900">Drop Points</h2>
          </div>
          <p className="text-[13px] font-medium text-stone-400 mb-6">
            Pickup is always Main Gate. These are the available drop-off locations.
          </p>

          <div className="flex flex-col gap-2 mb-6">
            {(dropPoints || []).map((dp) => (
              <div
                key={dp._id}
                className="flex justify-between items-center px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl"
              >
                <span className="text-[14.5px] font-semibold text-stone-800">{dp.name}</span>
                {dp.name !== "Main Gate" && (
                  <button
                    onClick={() => deactivateDropPoint({ dropPointId: dp._id })}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
            {dropPoints?.length === 0 && (
              <p className="text-[13px] text-stone-400 text-center py-4">No drop points added yet.</p>
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New drop point name"
              value={newDrop}
              onChange={(e) => setNewDrop(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddDrop()}
              className="flex-1 bg-white"
            />
            <button
              className="btn-primary px-4 py-2.5 text-[13px] whitespace-nowrap"
              onClick={handleAddDrop}
              disabled={addingDrop || !newDrop.trim()}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
