import type { LayerName } from "../types/contracts";

export const API_URL = "/api";

export const DEFAULT_CENTER = [48.208, 16.373];
export const DEFAULT_ZOOM = 13;

export const SIMPLIFIABLE_LAYERS: ReadonlySet<LayerName> = new Set([
  "roads",
  "transit_routes",
  "power_lines",
  "buildings",
  "substations",
]);
