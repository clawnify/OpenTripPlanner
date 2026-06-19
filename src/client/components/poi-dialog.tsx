import { useEffect, useRef, useState } from "react";
import { Search, Star, Check, Trash2, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";
import { useApp } from "@/context";
import { api } from "@/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Poi, GeocodeResult } from "@/types";

export interface PoiDraft {
  lat?: number;
  lng?: number;
  address?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poi?: Poi;
  draft?: PoiDraft;
  onSaved?: (p: Poi) => void;
}

const NONE = "__none__";

export function PoiDialog({ open, onOpenChange, poi, draft, onSaved }: Props) {
  const app = useApp();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>(NONE);
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(app.settings.currency);
  const [rating, setRating] = useState(0);
  const [visited, setVisited] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setName(poi?.name ?? "");
    setCategoryId(poi?.category_id ? String(poi.category_id) : NONE);
    setAddress(poi?.address ?? draft?.address ?? "");
    setLat(poi ? String(poi.lat) : draft?.lat !== undefined ? String(draft.lat) : "");
    setLng(poi ? String(poi.lng) : draft?.lng !== undefined ? String(draft.lng) : "");
    setPrice(poi?.price != null ? String(poi.price) : "");
    setCurrency(poi?.currency ?? app.settings.currency);
    setRating(poi?.rating ?? 0);
    setVisited(!!poi?.visited);
    setFavorite(!!poi?.favorite);
    setImageUrl(poi?.image_url ?? "");
    setLink(poi?.link ?? "");
    setNotes(poi?.notes ?? "");
  }, [open, poi, draft, app.settings.currency]);

  async function findOnMap() {
    if (!address.trim()) return;
    setGeocoding(true);
    try {
      const res = await api<{ results: GeocodeResult[] }>("GET", `/api/geocode?q=${encodeURIComponent(address.trim())}`);
      const first = res.results[0];
      if (first) {
        setLat(String(first.lat));
        setLng(String(first.lng));
        setAddress(first.display_name);
      } else {
        app.setError("No location found for that address.");
      }
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setGeocoding(false);
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
      setImageUrl(data.url);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (!name.trim() || !Number.isFinite(latN) || !Number.isFinite(lngN)) {
      app.setError("Name and a valid latitude/longitude are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        category_id: categoryId === NONE ? null : parseInt(categoryId, 10),
        lat: latN,
        lng: lngN,
        address: address.trim() || null,
        price: price ? parseFloat(price) : null,
        currency: currency.trim().toUpperCase() || null,
        rating: rating || null,
        visited,
        favorite,
        image_url: imageUrl.trim() || null,
        link: link.trim() || null,
        notes: notes.trim() || null,
      };
      const saved = poi ? await app.updatePoi(poi.id, payload) : await app.createPoi(payload);
      onSaved?.(saved);
      onOpenChange(false);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!poi) return;
    if (!confirm(`Delete "${poi.name}"?`)) return;
    try {
      await app.deletePoi(poi.id);
      onOpenChange(false);
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{poi ? "Edit place" : "Add place"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="contents">
        <div className="grid gap-3">
          <div>
            <Label htmlFor="poi-name">Name</Label>
            <Input id="poi-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Belém Tower" />
          </div>

          <div>
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Uncategorized" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Uncategorized</SelectItem>
                {app.categories.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      {cat.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="poi-address">Address</Label>
            <div className="flex gap-2">
              <Input id="poi-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Search an address or place" />
              <Button type="button" variant="outline" onClick={findOnMap} disabled={geocoding || !address.trim()} aria-label="Find on map">
                {geocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-1 hidden sm:inline">Find</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="poi-lat">Latitude</Label>
              <Input id="poi-lat" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="38.6916" inputMode="decimal" />
            </div>
            <div>
              <Label htmlFor="poi-lng">Longitude</Label>
              <Input id="poi-lng" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-9.2160" inputMode="decimal" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <Label htmlFor="poi-price">Price</Label>
              <Input id="poi-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label htmlFor="poi-cur">Currency</Label>
              <Input id="poi-cur" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />
            </div>
          </div>

          <div>
            <Label>Rating</Label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} star${n === 1 ? "" : "s"}`}
                  onClick={() => setRating(rating === n ? 0 : n)}
                  className="rounded p-1 hover:bg-secondary"
                >
                  <Star className={cn("h-5 w-5", n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <ToggleChip active={favorite} onClick={() => setFavorite(!favorite)} label="Favorite" aria-label="Toggle favorite">
              <Star className={cn("h-3.5 w-3.5", favorite && "fill-current")} />
              Favorite
            </ToggleChip>
            <ToggleChip active={visited} onClick={() => setVisited(!visited)} label="Visited" aria-label="Toggle visited">
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              Visited
            </ToggleChip>
          </div>

          <div>
            <Label>Photo</Label>
            <div className="flex items-start gap-3">
              {imageUrl ? (
                <div className="relative shrink-0">
                  <img src={imageUrl} alt="" className="h-16 w-16 rounded-md border object-cover" />
                  <button
                    type="button"
                    aria-label="Remove photo"
                    onClick={() => setImageUrl("")}
                    className="absolute -right-1.5 -top-1.5 rounded-full border bg-card p-0.5 text-muted-foreground shadow-sm transition-colors hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" className="hidden" onChange={onUpload} />
                <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Upload photo">
                  {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                  {uploading ? "Uploading…" : "Upload photo"}
                </Button>
                <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="or paste an image URL" aria-label="Image URL" />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="poi-link">Link</Label>
            <Input id="poi-link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
          </div>

          <div>
            <Label htmlFor="poi-notes">Notes</Label>
            <Textarea id="poi-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="mt-2">
          {poi && (
            <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={remove}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={saving || !name.trim()}>
            {poi ? "Save changes" : "Add place"}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ToggleChip({
  active,
  onClick,
  children,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  "aria-label"?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
