import L from "leaflet";

export interface PoiPinOptions {
  color?: string | null;
  /** Photo preview shown inside the circle; falls back to a colored disc + initial. */
  imageUrl?: string | null;
  name?: string | null;
  visited?: boolean;
  /** Circle diameter in px (default 42; the trip mini-map uses a smaller dot). */
  size?: number;
}

const escapeAttr = (s: string) => s.replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** A circular photo-preview pin as a Leaflet divIcon — shows the place's image
 *  inside a category-coloured ring, with a small pointer tip so it still reads as
 *  a map pin. No marker image assets, so it's bundler-safe. */
export function poiDivIcon(opts: PoiPinOptions): L.DivIcon {
  const ring = opts.color || "#475569";
  const size = opts.size ?? 42;
  const initial = (opts.name?.trim()?.[0] ?? "").toUpperCase();

  const inner = opts.imageUrl
    ? `<span class="poi-pin-img" style="background-image:url('${escapeAttr(opts.imageUrl)}')"></span>`
    : `<span class="poi-pin-letter">${initial}</span>`;

  const check = opts.visited ? `<span class="poi-pin-check">✓</span>` : "";

  return L.divIcon({
    className: "",
    html:
      `<div class="poi-pin-wrap${opts.visited ? " is-visited" : ""}" style="--pin:${ring};--pin-size:${size}px">` +
      `<span class="poi-pin-circle">${inner}</span>${check}</div>`,
    iconSize: [size, size + 6],
    iconAnchor: [size / 2, size + 4],
    popupAnchor: [0, -(size + 2)],
  });
}
