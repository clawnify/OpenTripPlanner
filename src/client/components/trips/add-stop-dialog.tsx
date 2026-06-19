import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryChip } from "@/components/category-chip";
import type { Poi } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayId: number;
  onAdded: () => void;
}

export function AddStopDialog({ open, onOpenChange, dayId, onAdded }: Props) {
  const app = useApp();
  const [poiId, setPoiId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [arriveTime, setArriveTime] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPoiId(null);
    setSearch("");
    setArriveTime("");
    setDurationMin("");
    setNote("");
  }, [open]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q ? app.pois.filter((p) => p.name.toLowerCase().includes(q) || (p.address ?? "").toLowerCase().includes(q)) : app.pois;
    return list.slice(0, 50);
  }, [app.pois, search]);

  async function save() {
    if (!poiId) {
      app.setError("Pick a place to add to this day.");
      return;
    }
    setSaving(true);
    try {
      await app.addStop(dayId, {
        poi_id: poiId,
        arrive_time: arriveTime || null,
        duration_min: durationMin ? parseInt(durationMin, 10) : null,
        note: note.trim() || null,
      });
      onAdded();
      onOpenChange(false);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add stop</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="contents">
        <div className="grid gap-3">
          <div>
            <Label htmlFor="stop-search">Place</Label>
            <Input id="stop-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search saved places…" />
          </div>

          <div className="max-h-56 overflow-y-auto rounded-md border">
            {matches.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                {app.pois.length === 0 ? "No saved places yet. Add places on the map first." : "No matches."}
              </p>
            ) : (
              <ul className="divide-y">
                {matches.map((p: Poi) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setPoiId(p.id)}
                      aria-pressed={poiId === p.id}
                      aria-label={`Select ${p.name}`}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors",
                        poiId === p.id ? "bg-primary/10" : "hover:bg-secondary",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{p.name}</span>
                        {p.address && <span className="block truncate text-xs text-muted-foreground">{p.address}</span>}
                      </span>
                      <CategoryChip name={p.category_name} color={p.category_color} icon={p.category_icon} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="stop-time">Arrive time</Label>
              <Input id="stop-time" type="time" value={arriveTime} onChange={(e) => setArriveTime(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="stop-dur">Duration (min)</Label>
              <Input id="stop-dur" type="number" min={0} value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="stop-note">Note</Label>
            <Input id="stop-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={saving || !poiId}>Add stop</Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
