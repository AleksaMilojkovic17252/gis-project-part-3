import { Eye, EyeOff, Mountain } from "lucide-react";
import { useMapStore } from "../store/useMapStore";
import { layerMeta } from "../config/styles";
import type { LayerName } from "../types/contracts";

const layerOrder: LayerName[] = [
  "transit_stops",
  "transit_routes",
  "roads",
  "power_towers",
  "power_lines",
  "substations",
  "landmarks_points",
  "buildings",
  "vehicle_positions",
];

function LayerSymbol({
  color,
  type,
}: {
  color: string;
  type: "point" | "line" | "polygon";
}) {
  if (type === "point")
    return (
      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
    );
  if (type === "line")
    return (
      <div
        className="w-4 h-1 rounded flex-shrink-0"
        style={{ backgroundColor: color }}
      />
    );
  return (
    <div
      className="w-4 h-4 rounded-sm flex-shrink-0 border"
      style={{ backgroundColor: `${color}33`, borderColor: color }}
    />
  );
}

export const Legend: React.FC = () => {
  const { activeLayers, toggleLayer, elevation, setRasterLayer, rasterLayer } =
    useMapStore();

  return (
    <div className="absolute bottom-8 right-3 z-[1000] bg-white rounded-lg shadow-lg p-3 max-h-[60vh] overflow-y-auto w-52">
      <h4 className="text-sm font-semibold text-slate-700 mb-2 pb-1 border-b border-slate-200">
        Layers
      </h4>

      {layerOrder.map((name) => {
        const meta = layerMeta[name];
        if (!meta) return null;
        const active = activeLayers[name];
        return (
          <button
            key={name}
            onClick={() => toggleLayer(name)}
            className={`flex items-center gap-2 w-full py-1.5 px-1 rounded text-left text-xs hover:bg-slate-50 transition-opacity ${active ? "opacity-100" : "opacity-40"}`}
          >
            <LayerSymbol color={meta.color} type={meta.type} />
            <span className="flex-1 text-slate-700">{meta.label}</span>
            {active ? (
              <Eye className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-slate-300" />
            )}
          </button>
        );
      })}

      <div className="border-t border-slate-200 mt-1 pt-1">
        <p className="text-xs font-medium text-slate-600 mb-1">Raster Layer</p>
        {(["none", "hillshade", "color-relief", "dem"] as const).map(
          (layer) => (
            <button
              key={layer}
              onClick={() => setRasterLayer(layer)}
              className={`flex items-center gap-2 w-full py-1.5 px-1 rounded text-left text-xs hover:bg-slate-50
        ${rasterLayer === layer ? "bg-slate-100 font-medium" : "opacity-60"}`}
            >
              <Mountain
                className={`w-4 h-4 flex-shrink-0 ${
                  layer == "hillshade"
                    ? "text-slate-600"
                    : layer == "color-relief"
                      ? "text-emerald-600"
                      : "text-slate-300"
                }`}
              />
              <span className="text-slate-700">{layer}</span>
            </button>
          ),
        )}

        {rasterLayer != "none" && elevation != null && (
          <p className="text-xs text-slate-500 pl-6">
            Elevation: {elevation.toFixed(1)}m
          </p>
        )}
      </div>
    </div>
  );
};
