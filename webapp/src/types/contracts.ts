import type { FeatureCollection } from "geojson";

export interface CollectionInfo {
  name: string;
  title: string;
  geometry: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
}

export interface VehicleInfo {
  vehicle_id: string;
  points: number;
  avg_speed: number;
}

export interface RasterImageResponse {
  image: string;
  bounds: [[number, number], [number, number]];
}

export interface RasterValueResponse {
  lat: number;
  lon: number;
  value: number;
  unit: string;
}

export interface ApiFeatureCollection extends FeatureCollection {
  numberMatched?: number;
  numberReturned?: number;
}

export type LayerName =
  | "transit_stops"
  | "transit_routes"
  | "roads"
  | "power_towers"
  | "power_lines"
  | "substations"
  | "landmarks_points"
  | "buildings"
  | "vehicle_positions";
