import { useQuery } from "@tanstack/react-query";
import { fetchFeatures } from "../lib/api";
import { useMapStore } from "../store/useMapStore";
import type { LayerName } from "../types/contracts";
import { SIMPLIFIABLE_LAYERS } from "../config/constants";

export function useLayerQuery(table: LayerName) {
  const bbox = useMapStore((s) => s.bbox);
  const zoom = useMapStore((s) => s.zoom);
  const isActive = useMapStore((s) => s.activeLayers[table]);

  const limit = getLimit(table, zoom);
  const simplify = SIMPLIFIABLE_LAYERS.has(table) ? simplifyTolerance(zoom) : 0;

  return useQuery({
    queryKey: ["layer", table, bbox, limit, simplify],
    queryFn: () =>
      fetchFeatures(table, {
        bbox: bbox ?? "",
        limit,
        ...(simplify > 0 ? { simplify } : {}),
      }),
    enabled: !!bbox && isActive,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

function getLimit(table: LayerName, zoom: number): number {
  if (table == "vehicle_positions") {
    return zoom >= 14 ? 4000 : zoom >= 12 ? 2000 : zoom >= 10 ? 800 : 300;
  }
  if (SIMPLIFIABLE_LAYERS.has(table)) {
    return zoom >= 14 ? 8000 : zoom >= 12 ? 5000 : zoom >= 10 ? 2500 : 1000;
  }
  return zoom >= 14 ? 3000 : zoom >= 12 ? 2000 : zoom >= 10 ? 1000 : 500;
}

function simplifyTolerance(zoom: number): number {
  if (zoom >= 14) return 0;
  if (zoom >= 12) return 0.0003;
  if (zoom >= 10) return 0.001;
  return 0.004;
}
