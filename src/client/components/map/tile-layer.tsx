import { useState } from "react";
import { TileLayer } from "react-leaflet";

// A transparent pixel keeps failed tiles from rendering as broken images.
const BLANK_TILE = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

/**
 * The map's tile layer. When tiles can't be fetched (offline, or a host that
 * blocks third-party images) the places and routes still render, and a short
 * note says why the background is empty.
 */
export function MapTiles({ url, attribution }: { url: string; attribution: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <TileLayer
        url={url}
        attribution={attribution}
        errorTileUrl={BLANK_TILE}
        eventHandlers={{ tileerror: () => setFailed(true) }}
      />
      {failed && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2 rounded-md border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
          Map tiles can't load here. Places and routes still show.
        </div>
      )}
    </>
  );
}
