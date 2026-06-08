import React, { useEffect, useState } from "react";

import { useMutation } from "@tanstack/react-query";
import { Route, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { fetchTrajectory, fetchVehicleList } from "../lib/api";
import { useMapStore } from "../store/useMapStore";
import type { VehicleInfo } from "../types/contracts";

export const VehiclePanel: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleInfo[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [timeStart, setTimeStart] = useState(0);
  const [timeEnd, setTimeEnd] = useState(7200);

  const setTrajectoryData = useMapStore((s) => s.setTrajectoryData);
  const clearResults = useMapStore((s) => s.clearResults);

  useEffect(() => {
    fetchVehicleList().then(setVehicles).catch(console.error);
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: () => fetchTrajectory(vehicleId, timeStart, timeEnd),
    onSuccess: (data) => {
      if (data.features.length > 0) {
        setTrajectoryData(data.features[0]);
        toast.success("Trajectory loaded");
      } else toast.error("No trajectory found");
    },
    onError: (err) => toast.error(`Failed to load trajectory: ${err.message}`),
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">
        Vehicle Trajectory
      </h3>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Vehicle ID
        </label>
        <div className="flex gap-1">
          <input
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            placeholder="e.g. 0"
            className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm"
          />
          {vehicles.length > 0 && (
            <select
              onChange={(e) => setVehicleId(e.target.value)}
              value={vehicleId}
              className="w-24 px-1 py-1.5 border border-slate-300 rounded text-xs bg-white"
            >
              <option value="">Pick...</option>
              {vehicles.slice(0, 50).map((v) => (
                <option key={v.vehicle_id} value={v.vehicle_id}>
                  {v.vehicle_id}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            From (s)
          </label>
          <input
            type="number"
            value={timeStart}
            onChange={(e) => setTimeStart(Number(e.target.value))}
            min={0}
            step={60}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            To (s)
          </label>
          <input
            type="number"
            value={timeEnd}
            onChange={(e) => setTimeEnd(Number(e.target.value))}
            min={0}
            step={60}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => mutate()}
          disabled={isPending || !vehicleId}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-pink-500 text-white rounded-md text-sm font-medium hover:bg-pink-600 disabled:opacity-50"
        >
          <Route className="w-4 h-4" />
          {isPending ? "Loading..." : "Show Trajectory"}
        </button>
        <button
          onClick={clearResults}
          className="px-3 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {vehicles.length > 0 && (
        <p className="text-xs text-slate-500">
          {vehicles.length} vehicles available
        </p>
      )}
    </div>
  );
};
