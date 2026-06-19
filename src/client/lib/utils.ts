import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Map a color token (e.g. "sky") to a set of Tailwind classes for a trip card / dot. */
export const colorPalette = {
  sky:     { bg: "bg-sky-100",     border: "border-sky-300",     text: "text-sky-900",     ring: "ring-sky-400",     dot: "bg-sky-500" },
  emerald: { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-900", ring: "ring-emerald-400", dot: "bg-emerald-500" },
  amber:   { bg: "bg-amber-100",   border: "border-amber-300",   text: "text-amber-900",   ring: "ring-amber-400",   dot: "bg-amber-500" },
  rose:    { bg: "bg-rose-100",    border: "border-rose-300",    text: "text-rose-900",    ring: "ring-rose-400",    dot: "bg-rose-500" },
  violet:  { bg: "bg-violet-100",  border: "border-violet-300",  text: "text-violet-900",  ring: "ring-violet-400",  dot: "bg-violet-500" },
  fuchsia: { bg: "bg-fuchsia-100", border: "border-fuchsia-300", text: "text-fuchsia-900", ring: "ring-fuchsia-400", dot: "bg-fuchsia-500" },
  teal:    { bg: "bg-teal-100",    border: "border-teal-300",    text: "text-teal-900",    ring: "ring-teal-400",    dot: "bg-teal-500" },
  orange:  { bg: "bg-orange-100",  border: "border-orange-300",  text: "text-orange-900",  ring: "ring-orange-400",  dot: "bg-orange-500" },
  slate:   { bg: "bg-slate-100",   border: "border-slate-300",   text: "text-slate-900",   ring: "ring-slate-400",   dot: "bg-slate-500" },
} as const;

export type ColorToken = keyof typeof colorPalette;

export const TRIP_COLORS: ColorToken[] = ["sky", "emerald", "amber", "rose", "violet", "fuchsia", "teal", "orange", "slate"];

export function colorClasses(token: string | null | undefined): typeof colorPalette[ColorToken] {
  return colorPalette[(token as ColorToken)] ?? colorPalette.sky;
}

/** The ten muted category-color pairs from the Clawnify Apps design system.
 *  Color belongs to data — category pills and map markers hash to a stable pair. */
export const PILL_COLORS: { bg: string; text: string }[] = [
  { bg: "#FEF2F2", text: "#DC2626" },
  { bg: "#ECFDF5", text: "#059669" },
  { bg: "#EFF6FF", text: "#2563EB" },
  { bg: "#FFFBEB", text: "#D97706" },
  { bg: "#F5F3FF", text: "#7C3AED" },
  { bg: "#F0FDFA", text: "#0D9488" },
  { bg: "#FDF2F8", text: "#DB2777" },
  { bg: "#FFF7ED", text: "#EA580C" },
  { bg: "#FAF5FF", text: "#9333EA" },
  { bg: "#F0FDF4", text: "#16A34A" },
];

/** Stable color for a category by hashing its name — same value, same color, app-wide. */
export function pillColor(value: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  return PILL_COLORS[Math.abs(hash) % PILL_COLORS.length];
}

/** The category palette swatches offered in the category editor. */
export const CATEGORY_SWATCHES = PILL_COLORS.map((p) => p.text);

/** Build the inline style for a category chip from a stored hex color. */
export function categoryChipStyle(color: string | null | undefined): { backgroundColor: string; color: string } {
  const text = color || "#475569";
  return { backgroundColor: `color-mix(in srgb, ${text} 12%, transparent)`, color: text };
}

/** Format an ISO date 'YYYY-MM-DD' (or datetime) to a short label. */
export function formatDate(iso: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string {
  if (!iso) return "";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, opts ?? { year: "numeric", month: "short", day: "numeric" });
}

/** "Sep 12 – 14, 2026" style range for a trip. */
export function formatDateRange(start: string | null | undefined, end: string | null | undefined): string {
  if (!start && !end) return "";
  if (start && !end) return formatDate(start);
  if (!start && end) return formatDate(end);
  return `${formatDate(start, { month: "short", day: "numeric" })} – ${formatDate(end)}`;
}

/** Format a number as currency. Uses USD by default. */
export function formatMoney(n: number | null | undefined, currency = "USD"): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
}

/** "1h 30m" from a minute count. */
export function formatDuration(min: number | null | undefined): string {
  if (!min || min <= 0) return "";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ");
}
