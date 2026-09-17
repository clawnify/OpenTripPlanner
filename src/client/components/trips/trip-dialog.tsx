import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useApp } from "@/context";
import { cn, colorClasses, TRIP_COLORS } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Trip } from "@/types";
import { ConfirmButton } from "@/components/confirm-button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip?: Trip;
  onDeleted?: () => void;
}

export function TripDialog({ open, onOpenChange, trip, onDeleted }: Props) {
  const app = useApp();
  const [title, setTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [color, setColor] = useState<string>("sky");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(trip?.title ?? "");
    setDestination(trip?.destination ?? "");
    setStartDate(trip?.start_date ?? "");
    setEndDate(trip?.end_date ?? "");
    setCoverUrl(trip?.cover_url ?? "");
    setColor(trip?.color ?? "sky");
    setNotes(trip?.notes ?? "");
  }, [open, trip]);

  async function save() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        destination: destination.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        cover_url: coverUrl.trim() || null,
        color,
        notes: notes.trim() || null,
      };
      if (trip) await app.updateTrip(trip.id, payload);
      else await app.createTrip(payload);
      onOpenChange(false);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!trip) return;
    try {
      await app.deleteTrip(trip.id);
      onOpenChange(false);
      onDeleted?.();
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{trip ? "Edit trip" : "New trip"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); void save(); }} className="contents">
        <div className="grid gap-3">
          <div>
            <Label htmlFor="trip-title">Title</Label>
            <Input id="trip-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="3 Days in Lisbon" />
          </div>
          <div>
            <Label htmlFor="trip-dest">Destination</Label>
            <Input id="trip-dest" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Lisbon, Portugal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="trip-start">Start date</Label>
              <Input id="trip-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="trip-end">End date</Label>
              <Input id="trip-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="trip-cover">Cover image URL</Label>
            <Input id="trip-cover" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {TRIP_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition",
                    colorClasses(c).dot,
                    color === c && "ring-2 ring-foreground",
                  )}
                />
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="trip-notes">Notes</Label>
            <Textarea id="trip-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter className="mt-2">
          {trip && (
            <ConfirmButton variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" prompt={`Delete "${trip.title}" and its itinerary?`} onConfirm={remove}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </ConfirmButton>
          )}
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" disabled={saving || !title.trim()}>
            {trip ? "Save changes" : "Create trip"}
          </Button>
        </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
