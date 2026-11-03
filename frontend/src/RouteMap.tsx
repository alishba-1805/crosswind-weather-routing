import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { type GeoJSONSource } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
import { colors, type Analysis, type Checkpoint } from "./types";
import s from "./App.module.css";
const routeColors = ["#a4c4a6", "#a2bddd", "#d9a385"];
maplibregl.setWorkerUrl(workerUrl);
export function RouteMap({
  data,
  selected,
  offset,
  onSelect,
  onCheckpoint,
}: {
  data: Analysis | null;
  selected: string;
  offset: number;
  onSelect: (id: string) => void;
  onCheckpoint: (p: Checkpoint) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const current = useRef({ data, onSelect, onCheckpoint });
  current.current = { data, onSelect, onCheckpoint };
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!container.current) return;
    const m = new maplibregl.Map({
      container: container.current,
      style: "https://tiles.openfreemap.org/styles/dark",
      center: [-77.25, 39.1],
      zoom: 7,
      attributionControl: { compact: true },
    });
    map.current = m;
    m.addControl(new maplibregl.NavigationControl(), "top-left");
    m.on("load", () => setReady(true));
    m.on("error", () =>
      setError("Basemap unavailable. Route details remain available."),
    );
    m.on("click", (e) => {
      if (!m.getLayer("checkpoints")) return;
      const hit = m.queryRenderedFeatures(e.point, {
        layers: ["checkpoints", "routes"],
      })[0];
      if (!hit) return;
      if (hit.layer.id === "routes")
        current.current.onSelect(hit.properties.id);
      else {
        const r = current.current.data?.routes.find(
          (r) => r.id === hit.properties.route,
        );
        const p = r?.checkpoints[Number(hit.properties.index)];
        if (p) current.current.onCheckpoint(p);
      }
    });
    const observer = new ResizeObserver(() => m.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const collection = (
      features: GeoJSON.Feature[],
    ): GeoJSON.FeatureCollection => ({ type: "FeatureCollection", features });
    const put = (id: string, geo: GeoJSON.FeatureCollection) => {
      const src = m.getSource(id) as GeoJSONSource | undefined;
      if (src) src.setData(geo);
      else m.addSource(id, { type: "geojson", data: geo });
    };
    put(
      "route-data",
      collection(
        (data?.routes || []).map((r, i) => ({
          type: "Feature",
          properties: {
            id: r.id,
            color: routeColors[i],
            width: r.id === selected ? 6 : 3,
          },
          geometry: { type: "LineString", coordinates: r.geometry },
        })),
      ),
    );
    if (!m.getLayer("routes"))
      m.addLayer({
        id: "routes",
        type: "line",
        source: "route-data",
        paint: {
          "line-color": ["get", "color"],
          "line-width": ["get", "width"],
          "line-opacity": 0.9,
        },
      });
    put(
      "point-data",
      collection(
        (data?.routes.find((r) => r.id === selected)?.checkpoints || []).map(
          (p, i) => ({
            type: "Feature",
            properties: { route: selected, index: i, color: colors[p.risk] },
            geometry: { type: "Point", coordinates: p.position },
          }),
        ),
      ),
    );
    if (!m.getLayer("checkpoints"))
      m.addLayer({
        id: "checkpoints",
        type: "circle",
        source: "point-data",
        paint: {
          "circle-radius": 6,
          "circle-color": ["get", "color"],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#151b1b",
        },
      });
    put(
      "weather-data",
      collection(
        (data?.overlay.samples || []).map((p) => ({
          type: "Feature",
          properties: { color: colors[p.frames[offset].risk] },
          geometry: { type: "Point", coordinates: p.position },
        })),
      ),
    );
    if (!m.getLayer("weather"))
      m.addLayer(
        {
          id: "weather",
          type: "circle",
          source: "weather-data",
          paint: {
            "circle-radius": 19,
            "circle-color": ["get", "color"],
            "circle-opacity": 0.28,
            "circle-stroke-width": 1,
            "circle-stroke-color": ["get", "color"],
          },
        },
        "routes",
      );
  }, [data, selected, offset, ready]);
  function fit() {
    const m = map.current;
    if (!m || !data) return;
    const coords = data.routes.flatMap((r) => r.geometry);
    const bounds = new maplibregl.LngLatBounds();
    coords.forEach((c) => bounds.extend(c));
    m.fitBounds(bounds, { padding: 55, duration: 650 });
  }
  const fitRef = useRef(fit);
  fitRef.current = fit;
  useEffect(() => {
    if (ready && data) fitRef.current();
  }, [data, ready]);
  return (
    <div className={s.mapPanel}>
      <div
        ref={container}
        data-ready={ready}
        className={s.map}
        role="region"
        aria-label="Interactive route and weather map"
      />
      <div className={s.mapCaption}>
        <span>US ROAD NETWORK</span>
        <strong>Corridor weather / truck routing</strong>
      </div>
      {data && (
        <button className={s.fit} onClick={fit}>
          Fit all routes
        </button>
      )}
      {error && (
        <p role="status" className={s.mapError}>
          {error}
        </p>
      )}
      <div className={s.mapKey}>
        ● Checkpoints &nbsp; ◯ Forecast corridor samples
        <br />
        Origin: first checkpoint · Destination: last checkpoint
      </div>
    </div>
  );
}
