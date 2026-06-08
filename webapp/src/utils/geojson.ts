import type { Feature, FeatureCollection } from "geojson";

export function toFeatureCollection(features: Feature[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features,
  };
}
