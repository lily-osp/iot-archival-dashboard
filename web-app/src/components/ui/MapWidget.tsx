"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Coords {
  lat: number;
  lng: number;
}

function parseCoords(raw: any): Coords | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // Try JSON first (e.g. {"lat":-6.2,"lng":106.8} or [-6.2,106.8])
  try {
    const j = JSON.parse(s);
    if (j && typeof j === "object") {
      if (typeof j.lat === "number" && typeof j.lng === "number") {
        return { lat: j.lat, lng: j.lng };
      }
      if (typeof j.latitude === "number" && typeof j.longitude === "number") {
        return { lat: j.latitude, lng: j.longitude };
      }
      if (Array.isArray(j) && j.length >= 2) {
        const a = Number(j[0]);
        const b = Number(j[1]);
        if (!isNaN(a) && !isNaN(b)) return { lat: a, lng: b };
      }
    }
  } catch {
    // fall through to plain parsing
  }

  const nums = s
    .split(/[,\s;]+/)
    .map((p) => parseFloat(p))
    .filter((n) => !isNaN(n));
  if (nums.length >= 2) return { lat: nums[0], lng: nums[1] };
  return null;
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom() ?? 13, { animate: true });
  }, [center, map]);
  return null;
}

const primaryIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#8B1A1A;border:2px solid #E8E0D0;box-shadow:0 0 0 2px #8B1A1A;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const trailIcon = L.divIcon({
  className: "",
  html: '<div style="width:8px;height:8px;border-radius:50%;background:#7A7068;border:1px solid #E8E0D0;"></div>',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

export default function MapWidget({ value, history = [] }: { value?: string | number; history?: any[] }) {
  const center = useMemo(() => {
    const c = parseCoords(value);
    return c ? ([c.lat, c.lng] as [number, number]) : null;
  }, [value]);

  const points = useMemo(() => {
    return (history || [])
      .map((d) => parseCoords(d?.value))
      .filter((c): c is Coords => !!c)
      .slice(0, 10);
  }, [history]);

  const chronological = useMemo(() => [...points].reverse(), [points]);

  if (!center) {
    return (
      <div className="flex h-full w-full min-h-[220px] items-center justify-center border border-dashed border-archival-muted/50 bg-archival-bg/50 font-mono text-[0.75rem] uppercase tracking-[0.1em] text-archival-muted-fg">
        INVALID_COORDINATES: {String(value ?? "NULL")}
      </div>
    );
  }

  return (
    <div className="h-full w-full min-h-[260px] overflow-hidden rounded-[6px] border border-archival-muted">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", minHeight: "260px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Recenter center={center} />
        {chronological.length > 1 && (
          <Polyline
            positions={chronological.map((c) => [c.lat, c.lng])}
            pathOptions={{ color: "#7A7068", weight: 2, opacity: 0.6, dashArray: "4 4" }}
          />
        )}
        {points.map((c, i) => (
          <Marker
            key={i}
            position={[c.lat, c.lng]}
            icon={i === 0 ? primaryIcon : trailIcon}
          >
            {i === 0 && <Popup>{String(value)}</Popup>}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
