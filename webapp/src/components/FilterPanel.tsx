import { useEffect, useState } from "react";

import { Search, Trash2 } from "lucide-react";

import { useMutation } from "@tanstack/react-query";
import { fetchColumns, fetchFeatures } from "../lib/api";
import { useMapStore } from "../store/useMapStore";
import type { ColumnInfo } from "../types/contracts";
import toast from "react-hot-toast";

export const FilterPanel: React.FC = () => {
  const [table, setTable] = useState("transit_stops");
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [column, setColumn] = useState("");
  const [op, setOp] = useState<"eq" | "gt" | "lt">("eq");
  const [value, setValue] = useState("");

  const setQueryResult = useMapStore((s) => s.setQueryResult);
  const clearResults = useMapStore((s) => s.clearResults);

  useEffect(() => {
    fetchColumns(table).then((cols) => {
      setColumns(cols);
      if (cols.length > 0) setColumn(cols[0].name);
    });
  }, [table]);

  const runFilterMutation = useMutation({
    mutationFn: () => {
      const bbox = useMapStore.getState().bbox;
      if (!bbox || !column || !value) throw new Error("Missing values");
      const params: Record<string, string | number> = { bbox, limit: 2000 };

      if (op == "eq") params[column] = value;
      else if (op == "gt") params[`gt_${column}`] = value;
      else if (op == "lt") params[`lt_${column}`] = value;
      return fetchFeatures(table, params);
    },
    onSuccess: (data) => {
      setQueryResult({
        features: data.features,
        total: data.numberMatched ?? data.features.length,
        label: `${table}: ${column} ${op == "eq" ? "=" : op == "gt" ? ">" : "<"} ${value}`,
      });
      toast.success("Retrieved data");
    },
    onError: (err) =>
      toast.error(`Error while retrieving data: ${err.message}`),
  });

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-800">Filter & Search</h3>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Layer
        </label>
        <select
          value={table}
          onChange={(e) => setTable(e.target.value)}
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
        >
          {tables.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Attribute
        </label>
        <select
          value={column}
          onChange={(e) => setColumn(e.target.value)}
          className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
        >
          {columns.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name} ({c.type})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Condition
        </label>
        <div className="flex gap-1">
          <select
            value={op}
            onChange={(e) => setOp(e.target.value as "eq" | "gt" | "lt")}
            className="w-20 px-2 py-1.5 border border-slate-300 rounded text-sm bg-white"
          >
            <option value="eq">=</option>
            <option value="gt">&gt;</option>
            <option value="lt">&lt;</option>
          </select>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="value..."
            className="flex-1 px-2 py-1.5 border border-slate-300 rounded text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => runFilterMutation.mutate()}
          disabled={runFilterMutation.isPending}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          {runFilterMutation.isPending ? "Loading..." : "Apply Filter"}
        </button>
        <button
          onClick={clearResults}
          className="px-3 py-2 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const tables = [
  { value: "transit_stops", label: "Transit Stops" },
  { value: "transit_routes", label: "Transit Routes" },
  { value: "roads", label: "Roads" },
  { value: "power_towers", label: "Power Towers" },
  { value: "power_lines", label: "Power Lines" },
  { value: "substations", label: "Substations" },
  { value: "landmarks_points", label: "Landmarks" },
  { value: "buildings", label: "Buildings" },
  { value: "vehicle_positions", label: "Vehicle Positions" },
];
