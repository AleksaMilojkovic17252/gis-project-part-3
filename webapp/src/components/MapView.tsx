import { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ImageOverlay,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { createRoot } from "react-dom/client";
import L from "leaflet";
import { useMapStore } from "../store/useMapStore";
import { useAllLayers } from "../hooks/useAllLayers";
import { FeaturePopup } from "./FeaturePopup";
import { layerStyles } from "../config/styles";
import { toFeatureCollection } from "../utils/geojson";
import { fetchRasterImage, fetchRasterValue } from "../lib/api";
import { DEFAULT_CENTER, DEFAULT_ZOOM } from "../config/constants";
import type { LayerName } from "../types/contracts";
import type { Feature } from "geojson";
import { useQuery } from "@tanstack/react-query";

export const MapView: React.FC = () => {
  const allLayers = useAllLayers();

  return (
    <MapContainer
      center={DEFAULT_CENTER as L.LatLngExpression}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      <MapEventHandler />

      <RasterLayer />

      <FeatureLayer
        data={allLayers.buildings.data?.features}
        table="buildings"
      />
      <FeatureLayer
        data={allLayers.substations.data?.features}
        table="substations"
      />

      <FeatureLayer data={allLayers.roads.data?.features} table="roads" />
      <FeatureLayer
        data={allLayers.transitRoutes.data?.features}
        table="transit_routes"
      />
      <FeatureLayer
        data={allLayers.powerLines.data?.features}
        table="power_lines"
      />

      <FeatureLayer
        data={allLayers.transitStops.data?.features}
        table="transit_stops"
      />
      <FeatureLayer
        data={allLayers.powerTowers.data?.features}
        table="power_towers"
      />
      <FeatureLayer
        data={allLayers.landmarks.data?.features}
        table="landmarks_points"
      />
      <FeatureLayer
        data={allLayers.vehicles.data?.features}
        table="vehicle_positions"
      />

      <QueryResultLayer />

      <TrajectoryLayer />
    </MapContainer>
  );
};


const MapEventHandler = () => {
  const setBbox = useMapStore((s) => s.setBbox);
  const setZoom = useMapStore((s) => s.setZoom);
  const map = useMap();

  useMapEvents({
    moveend: () => {
      const b = map.getBounds();
      setBbox(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`);
      setZoom(map.getZoom());
    },
  });

  useEffect(() => {
    const b = map.getBounds();
    setBbox(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`);
    setZoom(map.getZoom());
  }, [map, setBbox, setZoom]);

  return null;
};

const FeatureLayer: React.FC<{
  data: Feature[] | undefined;
  table: LayerName;
}> = ({ data, table }) => {
  const isActive = useMapStore((s) => s.activeLayers[table]);

  if (!isActive || !data || data.length == 0) return null;

  const style = layerStyles[table];

  return (
    <GeoJSON
      key={`${table}-${data.length}-${data[0]?.id}`}
      data={toFeatureCollection(data)}
      pointToLayer={(_f, latlng) =>
        style?.point ? L.circleMarker(latlng, style.point) : L.marker(latlng)
      }
      style={() => style?.path ?? {}}
      onEachFeature={(feature, layer) => {
        const container = document.createElement("div");
        layer.bindPopup(container, { maxWidth: 300, minWidth: 200 });
        layer.on("popupopen", () => {
          createRoot(container).render(
            <FeaturePopup properties={feature.properties} layerName={table} />,
          );
        });
      }}
    />
  );
};

const QueryResultLayer = () => {
  const queryResult = useMapStore((s) => s.queryResult);

  if (!queryResult || queryResult.features.length === 0) return null;

  const style = layerStyles.queryResult;

  return (
    <GeoJSON
      key={`query-${queryResult.total}-${Date.now()}`}
      data={toFeatureCollection(queryResult.features)}
      pointToLayer={(_f, latlng) =>
        L.circleMarker(latlng, style?.point ?? { radius: 7 })
      }
      style={() => style?.path ?? {}}
      onEachFeature={(feature, layer) => {
        const container = document.createElement("div");
        layer.bindPopup(container, { maxWidth: 300 });
        layer.on("popupopen", () => {
          createRoot(container).render(
            <FeaturePopup
              properties={feature.properties}
              layerName="Query Result"
            />,
          );
        });
      }}
    />
  );
};

const TrajectoryLayer: React.FC = () => {
  const trajectoryData = useMapStore((s) => s.trajectoryData);
  const map = useMap();

  useEffect(() => {
    if (!trajectoryData) return;
    try {
      const geoJson = L.geoJSON(toFeatureCollection([trajectoryData]));
      const bounds = geoJson.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50] });
    } catch {}
  }, [trajectoryData, map]);

  if (!trajectoryData) return null;

  const style = layerStyles.trajectory;

  return (
    <GeoJSON
      key={`traj-${Date.now()}`}
      data={toFeatureCollection([trajectoryData])}
      style={() => style?.path ?? { color: "#ec4899", weight: 4 }}
      onEachFeature={(feature, layer) => {
        const container = document.createElement("div");
        layer.bindPopup(container);
        layer.on("popupopen", () => {
          createRoot(container).render(
            <FeaturePopup
              properties={feature.properties}
              layerName="Trajectory"
            />,
          );
        });
      }}
    />
  );
};

const RasterLayer: React.FC = () => {
  const rasterLayer = useMapStore((s) => s.rasterLayer);
  const setElevation = useMapStore((s) => s.setElevation);
  const lastRequestRef = useRef(0);

  const { data: rasterData } = useQuery({
    queryKey: ["raster-image", rasterLayer],
    queryFn: () => fetchRasterImage(rasterLayer),
    enabled: rasterLayer !== "none",
    staleTime: Infinity,
  });

  useMapEvents({
    mousemove: async (e) => {
      if (rasterLayer === "none") return;
      if (Date.now() - lastRequestRef.current < 300) return;
      lastRequestRef.current = Date.now();

      try {
        const data = await fetchRasterValue(e.latlng.lat, e.latlng.lng);
        setElevation(data.value);
      } catch {
        setElevation(null);
      }
    },
  });

  useEffect(() => {
    if (rasterLayer == "none") setElevation(null);
  }, [rasterLayer, setElevation]);

  if (rasterLayer == "none" || !rasterData) return null;

  return (
    <ImageOverlay
      url={rasterData.image}
      bounds={rasterData.bounds}
      opacity={0.6}
    />
  );
};

