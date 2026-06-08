import { useLayerQuery } from "./useLayerQuery";

export function useAllLayers() {
  return {
    transitStops: useLayerQuery("transit_stops"),
    transitRoutes: useLayerQuery("transit_routes"),
    roads: useLayerQuery("roads"),
    powerTowers: useLayerQuery("power_towers"),
    powerLines: useLayerQuery("power_lines"),
    substations: useLayerQuery("substations"),
    landmarks: useLayerQuery("landmarks_points"),
    buildings: useLayerQuery("buildings"),
    vehicles: useLayerQuery("vehicle_positions"),
  };
}
