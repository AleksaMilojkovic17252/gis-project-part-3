import { Car, MapPin, Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { useMutation } from "@tanstack/react-query";

import { fetchVehiclesNearObject, fetchWithinDistance } from "../lib/api";
import { useMapStore } from "../store/useMapStore";

export const SpatialPanel: React.FC = () => {
  const [tableA, setTableA] = useState("transit_stops");
  const [tableB, setTableB] = useState("buildings");
  const [distance, setDistance] = useState(100);
  const [bFilter, setBFilter] = useState("");

  const [objectTable, setObjectTable] = useState("landmarks_points");
  const [objectName, setObjectName] = useState("");
  const [objectDistance, setObjectDistance] = useState(200);

  const setQueryResult = useMapStore((s) => s.setQueryResult);
  const clearResults = useMapStore((s) => s.clearResults);
  const bbox = useMapStore(s=>s.bbox)

  const withinDistanceMutation = useMutation({
    mutationFn: () =>
      fetchWithinDistance(tableA, tableB, distance, bFilter || undefined, 500, bbox ?? undefined),
    onSuccess: (data) => {
      setQueryResult({
        features: data.features,
        total: data.numberReturned ?? data.features.length,
        label: `${tableA} within ${distance}m of ${tableB}`,
      });
      toast.success(`Found ${data.features.length} features`);
    },
    onError: (err) => {
      toast.error(`Spatial query failed: ${err.message}`);
    },
  });

  const vehiclesNearMutation = useMutation({
    mutationFn: () =>
      fetchVehiclesNearObject(objectTable, objectName, objectDistance),
    onSuccess: (data) => {
      setQueryResult({
        features: data.features,
        total: data.numberReturned ?? data.features.length,
        label: `Vehicles near "${objectName}"`,
      });
      toast.success(`Found ${data.features.length} vehicle positions`);
    },
    onError: (err) => {
      toast.error(`Query failed: ${err.message}`);
    },
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">Spatial Query</h3>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Find features from
        </label>
        <select
          value={tableA}
          onChange={(e) => setTableA(e.target.value)}
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
        >
          {sourceTables.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          within distance (m) of
        </label>
        <input
          type="number"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          min={10}
          max={5000}
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
        />
      </div>

      <div>
        <select
          value={tableB}
          onChange={(e) => setTableB(e.target.value)}
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
        >
          {targetTables.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Optional filter on target
        </label>
        <input
          value={bFilter}
          onChange={(e) => setBFilter(e.target.value)}
          placeholder="e.g. building_type:museum"
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
        />
      </div>

      <button
        onClick={() => withinDistanceMutation.mutate()}
        disabled={withinDistanceMutation.isPending}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
      >
        <MapPin className="w-4 h-4" />
        {withinDistanceMutation.isPending ? "Loading..." : "Run Spatial Query"}
      </button>

      <div className="border-t border-slate-200 pt-3 mt-3">
        <h3 className="text-sm font-semibold text-slate-800 mb-2">
          Vehicles Near Object
        </h3>

        <div className="space-y-2">
          <select
            value={objectTable}
            onChange={(e) => setObjectTable(e.target.value)}
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
          >
            {objectTables.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <input
            value={objectName}
            onChange={(e) => setObjectName(e.target.value)}
            placeholder="Object name (e.g. Stephansdom)"
            className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
          />

          <div className="flex gap-1">
            <input
              type="number"
              value={objectDistance}
              onChange={(e) => setObjectDistance(Number(e.target.value))}
              min={10}
              max={5000}
              className="w-24 px-2 py-1.5 border border-slate-300 rounded text-sm"
            />
            <span className="self-center text-xs text-slate-500">meters</span>
          </div>

          <button
            onClick={() => vehiclesNearMutation.mutate()}
            disabled={vehiclesNearMutation.isPending || !objectName}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-md text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            <Car className="w-4 h-4" />
            {vehiclesNearMutation.isPending ? "Loading..." : "Find Vehicles"}
          </button>
        </div>
      </div>

      <button
        onClick={clearResults}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
      >
        <Trash2 className="w-4 h-4" /> Clear Results
      </button>
    </div>
  );
};

const sourceTables = [
  { value: "transit_stops", label: "Transit Stops" },
  { value: "landmarks_points", label: "Landmarks" },
  { value: "vehicle_positions", label: "Vehicles" },
  { value: "power_towers", label: "Power Towers" },
];

const targetTables = [
  { value: "buildings", label: "Buildings" },
  { value: "roads", label: "Roads" },
  { value: "substations", label: "Substations" },
  { value: "landmarks_points", label: "Landmarks" },
  { value: "transit_stops", label: "Transit Stops" },
];

const objectTables = [
  { value: "landmarks_points", label: "Landmarks" },
  { value: "transit_stops", label: "Transit Stops" },
  { value: "buildings", label: "Buildings" },
  { value: "substations", label: "Substations" },
];
