import type { Feature } from "geojson";
import { create } from "zustand";

import type { LayerName } from "../types/contracts";

export interface QueryResult {
  features: Feature[];
  total: number;
  label?: string;
}

interface MapState {
  bbox: string | null;
  setBbox: (bbox: string) => void;
  zoom: number;
  setZoom: (z: number) => void;

  activeLayers: Record<LayerName, boolean>;
  toggleLayer: (name: LayerName) => void;

  rasterLayer: "none" | "hillshade" | "color-relief" | "dem";
  setRasterLayer: (
    layer: "none" | "hillshade" | "color-relief" | "dem",
  ) => void;
  elevation: number | null;
  setElevation: (v: number | null) => void;

  filterTable: string;
  setFilterTable: (t: string) => void;

  queryResult: QueryResult | null;
  setQueryResult: (r: QueryResult | null) => void;

  trajectoryData: Feature | null;
  setTrajectoryData: (f: Feature | null) => void;

  clearResults: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  bbox: null,
  setBbox: (bbox) => set({ bbox }),
  zoom: 13,
  setZoom: (z) => set({ zoom: z }),

  activeLayers: {
    transit_stops: true,
    transit_routes: true,
    roads: false,
    power_towers: false,
    power_lines: false,
    substations: true,
    landmarks_points: true,
    buildings: true,
    vehicle_positions: true,
  },
  toggleLayer: (name) =>
    set((s) => ({
      activeLayers: { ...s.activeLayers, [name]: !s.activeLayers[name] },
    })),

  rasterLayer: "none",
  setRasterLayer: (layer) => {
    set({ rasterLayer: layer });
  },
  elevation: null,
  setElevation: (v) => set({ elevation: v }),

  filterTable: "transit_stops",
  setFilterTable: (t) => set({ filterTable: t }),

  queryResult: null,
  setQueryResult: (r) => set({ queryResult: r }),

  trajectoryData: null,
  setTrajectoryData: (f) => set({ trajectoryData: f }),

  clearResults: () =>
    set({
      queryResult: null,
      trajectoryData: null,
    }),
}));
