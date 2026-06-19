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

/** True for pale rings (e.g. a white "Activities" category) so the initial can
 *  flip to dark ink and stay legible on a light/photo-less pin. */
function isLightColor(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 186;
}

/** A circular photo-preview pin as a Leaflet divIcon — the place's image inside a
 *  category-coloured ring. Just a circle, centred on its coordinate (no pointer
 *  tip). No marker image assets, so it's bundler-safe. */
export function poiDivIcon(opts: PoiPinOptions): L.DivIcon {
  const ring = opts.color || "#475569";
  const size = opts.size ?? 42;
  const initial = (opts.name?.trim()?.[0] ?? "").toUpperCase();

  const ink = isLightColor(ring) ? "#1A202C" : "#fff";
  const inner = opts.imageUrl
    ? `<span class="poi-pin-img" style="background-image:url('${escapeAttr(opts.imageUrl)}')"></span>`
    : `<span class="poi-pin-letter" style="color:${ink}">${initial}</span>`;

  const check = opts.visited ? `<span class="poi-pin-check">✓</span>` : "";

  return L.divIcon({
    className: "",
    html:
      `<div class="poi-pin-wrap${opts.visited ? " is-visited" : ""}" style="--pin:${ring};--pin-size:${size}px">` +
      `<span class="poi-pin-circle">${inner}</span>${check}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}
