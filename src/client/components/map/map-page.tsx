import { useMemo, useState } from "react";
import { MapContainer, Marker, Popup, useMapEvents } from "react-leaflet";
import { MapTiles } from "@/components/map/tile-layer";
import { Plus, Star, Check, ExternalLink, Pencil, MapPinned } from "lucide-react";
import { useApp } from "@/context";
import { api } from "@/api";
import { cn, formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CategoryChip } from "@/components/category-chip";
import { PoiDialog, type PoiDraft } from "@/components/poi-dialog";
import { poiDivIcon } from "./marker";
import type { Poi } from "@/types";

/** Right-click (contextmenu) on the map → opens the add-place dialog pre-filled
 *  with lat/lng and a reverse-geocoded address. Leaflet suppresses the native
 *  browser menu on the map, so the gesture is unambiguous. */
function RightClickToAdd({ onPick }: { onPick: (draft: PoiDraft) => void }) {
  useMapEvents({
    async contextmenu(e) {
      const { lat, lng } = e.latlng;
      let address: string | null = null;
      try {
        const res = await api<{ display_name: string | null }>("GET", `/api/reverse?lat=${lat}&lng=${lng}`);
        address = res.display_name;
      } catch {
        /* reverse geocode is best-effort */
      }
      onPick({ lat, lng, address });
    },
  });
  return null;
}

export function MapPage() {
  const app = useApp();
  const { pois, categories, mapConfig } = app;

  const [activeCats, setActiveCats] = useState<Set<number>>(new Set());
  const [onlyFavorite, setOnlyFavorite] = useState(false);
  const [onlyUnvisited, setOnlyUnvisited] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Poi | undefined>(undefined);
  const [draft, setDraft] = useState<PoiDraft | undefined>(undefined);

  const filtered = useMemo(() => {
    return pois.filter((p) => {
      if (activeCats.size > 0 && (p.category_id == null || !activeCats.has(p.category_id))) return false;
      if (onlyFavorite && !p.favorite) return false;
      if (onlyUnvisited && p.visited) return false;
      return true;
    });
  }, [pois, activeCats, onlyFavorite, onlyUnvisited]);

  function toggleCat(id: number) {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openNew() {
    setEditing(undefined);
    setDraft(undefined);
    setDialogOpen(true);
  }
  function openEdit(p: Poi) {
    setEditing(p);
    setDraft(undefined);
    setDialogOpen(true);
  }
  function openFromMap(d: PoiDraft) {
    setEditing(undefined);
    setDraft(d);
    setDialogOpen(true);
  }

  const center = mapConfig?.defaultCenter ?? [38.7223, -9.1393];
  const zoom = mapConfig?.defaultZoom ?? 12;

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Map</h1>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {filtered.length} of {pois.length} place{pois.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button onClick={openNew} aria-label="Add place">
          <Plus className="mr-1 h-4 w-4" /> Add place
        </Button>
      </header>

      <div className="relative flex-1">
        {mapConfig && (
          <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom>
            <MapTiles url={mapConfig.tileUrl} attribution={mapConfig.attribution} />
            <RightClickToAdd onPick={openFromMap} />
            {filtered.map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={poiDivIcon({ color: p.category_color, imageUrl: p.image_url, name: p.name, visited: !!p.visited })}
              >
                <Popup>
                  <PoiPopup poi={p} currency={app.settings.currency} onEdit={() => openEdit(p)} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Filter panel — an eyebrow-zoned card floating over the map. */}
        <div className="pointer-events-none absolute left-4 top-4 z-[1000] w-60 max-w-[calc(100%-2rem)]">
          <div className="pointer-events-auto rounded-md border bg-card shadow-lg">
            <div className="border-b px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Filters</div>
            </div>
            <div className="space-y-3 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Categories</div>
              {categories.length === 0 ? (
                <p className="text-xs text-muted-foreground">No categories yet.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => {
                    const active = activeCats.has(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCat(cat.id)}
                        aria-pressed={active}
                        aria-label={`Filter ${cat.name}`}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-medium transition-colors",
                          active ? "text-card" : "text-muted-foreground hover:bg-secondary",
                        )}
                        style={active ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? "currentColor" : cat.color }} />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="space-y-2 border-t pt-3">
                <FilterToggle active={onlyFavorite} onClick={() => setOnlyFavorite(!onlyFavorite)} label="Favorites only">
                  <Star className={cn("h-3.5 w-3.5", onlyFavorite && "fill-current")} /> Favorites only
                </FilterToggle>
                <FilterToggle active={onlyUnvisited} onClick={() => setOnlyUnvisited(!onlyUnvisited)} label="Not visited yet">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Not visited yet
                </FilterToggle>
              </div>
            </div>
          </div>
        </div>

        {pois.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center">
            <div className="pointer-events-auto flex flex-col items-center gap-2 text-center">
              <MapPinned className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No places yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">Right-click anywhere on the map, or use Add place to drop your first pin.</p>
              <Button className="mt-1" onClick={openNew} aria-label="Add place">
                <Plus className="mr-1 h-4 w-4" /> Add place
              </Button>
            </div>
          </div>
        )}
      </div>

      <PoiDialog open={dialogOpen} onOpenChange={setDialogOpen} poi={editing} draft={draft} />
    </div>
  );
}

function FilterToggle({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}

function PoiPopup({ poi, currency, onEdit }: { poi: Poi; currency: string; onEdit: () => void }) {
  return (
    <div className="min-w-[200px] p-3 font-sans">
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-foreground">{poi.name}</div>
        <div className="flex shrink-0 items-center gap-1">
          {!!poi.favorite && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
          {!!poi.visited && <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.5} />}
        </div>
      </div>
      <CategoryChip name={poi.category_name} color={poi.category_color} icon={poi.category_icon} />
      {poi.address && <p className="mt-2 text-xs text-muted-foreground">{poi.address}</p>}
      <div className="mt-2 flex items-center gap-2">
        {poi.price != null && (
          <span className="text-xs font-medium tabular-nums text-foreground">
            {formatMoney(poi.price, poi.currency ?? currency)}
          </span>
        )}
        {poi.link && (
          <a href={poi.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-[var(--ring)] hover:underline">
            <ExternalLink className="h-3 w-3" /> Open
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${poi.name}`}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3 w-3" /> Edit
      </button>
    </div>
  );
}
