import type { CircleMarkerOptions, PathOptions } from "leaflet";

export interface LayerStyle {
  point?: CircleMarkerOptions;
  path?: PathOptions;
}

export const layerStyles: Record<string, LayerStyle> = {
  transit_stops: {
    point: {
      radius: 5,
      fillColor: "#2563eb",
      color: "#1e40af",
      weight: 1,
      fillOpacity: 0.8,
    },
  },
  transit_routes: { path: { color: "#dc2626", weight: 3, opacity: 0.8 } },
  roads: { path: { color: "#94a3b8", weight: 2, opacity: 0.5 } },
  power_towers: {
    point: {
      radius: 4,
      fillColor: "#6b7280",
      color: "#374151",
      weight: 1,
      fillOpacity: 0.7,
    },
  },
  power_lines: { path: { color: "#f59e0b", weight: 2, opacity: 0.7 } },
  substations: {
    path: {
      fillColor: "#8b5cf6",
      color: "#7c3aed",
      weight: 2,
      fillOpacity: 0.3,
      dashArray: "5,5",
    },
  },
  landmarks_points: {
    point: {
      radius: 6,
      fillColor: "#eab308",
      color: "#a16207",
      weight: 1,
      fillOpacity: 0.9,
    },
  },
  buildings: {
    path: {
      fillColor: "#6b7280",
      color: "#6b7280",
      weight: 1,
      fillOpacity: 0.3,
    },
  },
  vehicle_positions: {
    point: {
      radius: 3,
      fillColor: "#f97316",
      color: "#c2410c",
      weight: 1,
      fillOpacity: 0.9,
    },
  },
  queryResult: {
    point: {
      radius: 7,
      fillColor: "#10b981",
      color: "#047857",
      weight: 2,
      fillOpacity: 0.9,
    },
    path: {
      color: "#10b981",
      weight: 3,
      fillColor: "#10b981",
      fillOpacity: 0.3,
    },
  },
  trajectory: { path: { color: "#ec4899", weight: 4, opacity: 0.8 } },
};

export const layerMeta: Record<
  string,
  { label: string; color: string; type: "point" | "line" | "polygon" }
> = {
  transit_stops: { label: "Transit Stops", color: "#2563eb", type: "point" },
  transit_routes: { label: "Transit Routes", color: "#dc2626", type: "line" },
  roads: { label: "Roads", color: "#94a3b8", type: "line" },
  power_towers: { label: "Power Towers", color: "#6b7280", type: "point" },
  power_lines: { label: "Power Lines", color: "#f59e0b", type: "line" },
  substations: { label: "Substations", color: "#8b5cf6", type: "polygon" },
  landmarks_points: { label: "Landmarks", color: "#eab308", type: "point" },
  buildings: { label: "Buildings", color: "#6b7280", type: "polygon" },
  vehicle_positions: { label: "Vehicles", color: "#f97316", type: "point" },
};
