import { useQuery } from "@tanstack/react-query";
import { fetchFeatures } from "../lib/api";
import { useMapStore } from "../store/useMapStore";
import type { LayerName } from "../types/contracts";

export function useLayerQuery(table: LayerName) {
  const bbox = useMapStore((s) => s.bbox);
  const zoom = useMapStore((s) => s.zoom);
  const isActive = useMapStore((s) => s.activeLayers[table]);

  const limit = zoom >= 14 ? 3000 : zoom >= 12 ? 1500 : zoom >= 10 ? 800 : 300;

  return useQuery({
    queryKey: ["layer", table, bbox, limit],
    queryFn: () => fetchFeatures(table, { bbox: bbox ?? "", limit }),
    enabled: !!bbox && isActive,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
