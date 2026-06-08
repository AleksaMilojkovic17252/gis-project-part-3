import { API_URL } from "../config/constants";
import type {
    ApiFeatureCollection,
    CollectionInfo,
    ColumnInfo,
    RasterImageResponse,
    RasterValueResponse,
    VehicleInfo,
} from "../types/contracts";

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchCollections(): Promise<CollectionInfo[]> {
  return fetchJSON(`${API_URL}/collections`);
}

export async function fetchFeatures(
  table: string,
  params: Record<string, string | number> = {},
): Promise<ApiFeatureCollection> {
  const searchParams = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val != undefined && val != "") searchParams.set(key, String(val));
  }
  return fetchJSON(
    `${API_URL}/collections/${table}/items?${searchParams.toString()}`,
  );
}

export async function fetchColumns(table: string): Promise<ColumnInfo[]> {
  return fetchJSON(`${API_URL}/collections/${table}/columns`);
}

export async function fetchDistinctValues(
  table: string,
  column: string,
): Promise<string[]> {
  return fetchJSON(`${API_URL}/collections/${table}/distinct/${column}`);
}

export async function fetchWithinDistance(
  tableA: string,
  tableB: string,
  distance: number,
  bFilter?: string,
  limit = 500,
  bbox?: string
): Promise<ApiFeatureCollection> {
  const params = new URLSearchParams({
    table_a: tableA,
    table_b: tableB,
    distance: String(distance),
    limit: String(limit),
  });
  if (bFilter) params.set("b_filter", bFilter);
  if (bbox) params.set("bbox", bbox);
  return fetchJSON(`${API_URL}/spatial/within-distance?${params.toString()}`);
}

export async function fetchVehiclesNearObject(
  table: string,
  objectName: string,
  distance: number,
  limit = 1000,
): Promise<ApiFeatureCollection> {
  const params = new URLSearchParams({
    table,
    object_name: objectName,
    distance: String(distance),
    limit: String(limit),
  });
  return fetchJSON(
    `${API_URL}/spatial/vehicles-near-object?${params.toString()}`,
  );
}

export async function fetchVehicleList(): Promise<VehicleInfo[]> {
  return fetchJSON(`${API_URL}/vehicles/list`);
}

export async function fetchTrajectory(
  vehicleId: string,
  timeStart = 0,
  timeEnd = 7200,
): Promise<ApiFeatureCollection> {
  const params = new URLSearchParams({
    time_start: String(timeStart),
    time_end: String(timeEnd),
  });
  return fetchJSON(
    `${API_URL}/vehicles/trajectory/${encodeURIComponent(vehicleId)}?${params.toString()}`,
  );
}

export async function fetchRasterImage(layer: string = 'hillshade'): Promise<RasterImageResponse> {
  return fetchJSON(`${API_URL}/raster/bounds-image?layer=${layer}`);
}

export async function fetchRasterValue(
  lat: number,
  lon: number,
): Promise<RasterValueResponse> {
  return fetchJSON(`${API_URL}/raster/value?lat=${lat}&lon=${lon}`);
}
