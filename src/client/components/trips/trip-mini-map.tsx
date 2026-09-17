import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup } from "react-leaflet";
import { MapTiles } from "@/components/map/tile-layer";
import { useApp } from "@/context";
import { poiDivIcon } from "@/components/map/marker";
import type { TripDay } from "@/types";

interface Pt {
  id: number;
  lat: number;
  lng: number;
  name: string;
  color: string | null | undefined;
}

/** A mini map of a trip's stops, connected by a polyline in itinerary order. */
export function TripMiniMap({ days }: { days: TripDay[] }) {
  const { mapConfig } = useApp();

  const points = useMemo<Pt[]>(() => {
    const out: Pt[] = [];
    for (const day of days) {
      for (const s of day.stops ?? []) {
        if (s.poi_lat != null && s.poi_lng != null) {
          out.push({ id: s.id, lat: s.poi_lat, lng: s.poi_lng, name: s.poi_name ?? "Stop", color: s.category_color });
        }
      }
    }
    return out;
  }, [days]);

  if (!mapConfig || points.length === 0) return null;

  const center: [number, number] = [
    points.reduce((a, p) => a + p.lat, 0) / points.length,
    points.reduce((a, p) => a + p.lng, 0) / points.length,
  ];
  const line = points.map((p) => [p.lat, p.lng] as [number, number]);

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-md border">
      <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom={false}>
        <MapTiles url={mapConfig.tileUrl} attribution={mapConfig.attribution} />
        {points.length > 1 && (
          <Polyline positions={line} pathOptions={{ color: "#DD5164", weight: 3, opacity: 0.8, dashArray: "6 6" }} />
        )}
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={poiDivIcon({ color: p.color, name: p.name, size: 30 })}>
            <Popup>
              <div className="p-2 text-sm font-medium font-sans">{p.name}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
