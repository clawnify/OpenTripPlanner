import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft, Pencil, Plus, ChevronUp, ChevronDown, X,
  Clock, MapPin, Trash2, CalendarDays,
} from "lucide-react";
import { useApp } from "@/context";
import { cn, colorClasses, formatDate, formatDateRange, formatDuration } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/confirm-button";
import { Card } from "@/components/ui/card";
import { CategoryChip } from "@/components/category-chip";
import { TripDialog } from "./trip-dialog";
import { AddStopDialog } from "./add-stop-dialog";
import { TripMiniMap } from "./trip-mini-map";
import type { Trip, TripDay, DayStop } from "@/types";

export function TripPage({ id, navigate }: { id: number; navigate: (to: string) => void }) {
  const app = useApp();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [addStopDay, setAddStopDay] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const t = await app.getTrip(id);
      setTrip(t);
    } catch (err) {
      app.setError((err as Error).message);
      setTrip(null);
    } finally {
      setLoading(false);
    }
  }, [app, id]);

  useEffect(() => { load(); }, [load]);

  const days = trip?.days ?? [];

  async function addDay() {
    if (!trip) return;
    try {
      await app.addDay(trip.id, {});
      await load();
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  async function deleteDay(dayId: number) {
    try {
      await app.deleteDay(dayId);
      await load();
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  async function removeStop(stopId: number) {
    try {
      await app.deleteStop(stopId);
      await load();
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  async function moveStop(day: TripDay, index: number, dir: -1 | 1) {
    const stops = [...(day.stops ?? [])];
    const target = index + dir;
    if (target < 0 || target >= stops.length) return;
    [stops[index], stops[target]] = [stops[target], stops[index]];
    try {
      await app.reorderStops(day.id, stops.map((s) => s.id));
      await load();
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!trip) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
        <p className="font-medium">Trip not found</p>
        <Button variant="outline" onClick={() => navigate("/trips")}>Back to trips</Button>
      </div>
    );
  }

  const palette = colorClasses(trip.color);
  const totalStops = days.reduce((a, d) => a + (d.stops?.length ?? 0), 0);

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-4xl space-y-6 p-6">
        <button
          type="button"
          onClick={() => navigate("/trips")}
          aria-label="Back to trips"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Trips
        </button>

        {/* Header card */}
        <Card className="overflow-hidden">
          {trip.cover_url ? (
            <div className="h-36 w-full overflow-hidden bg-secondary">
              <img src={trip.cover_url} alt="" className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className={cn("h-20 w-full", palette.bg)} />
          )}
          <div className="flex items-start justify-between gap-3 px-5 py-4">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Trip</div>
              <h1 className="text-xl font-bold tracking-tight">{trip.title}</h1>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {trip.destination && (
                  <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {trip.destination}
                  </span>
                )}
                {(trip.start_date || trip.end_date) && (
                  <span className="inline-flex items-center gap-1 rounded-sm border bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <CalendarDays className="h-3 w-3" /> {formatDateRange(trip.start_date, trip.end_date)}
                  </span>
                )}
                <span className="rounded-sm border bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                  {days.length} day{days.length === 1 ? "" : "s"} · {totalStops} stop{totalStops === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} aria-label="Edit trip">
              <Pencil className="mr-1 h-4 w-4" /> Edit
            </Button>
          </div>
          {trip.notes && (
            <div className="border-t px-5 py-3">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Notes</div>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{trip.notes}</p>
            </div>
          )}
        </Card>

        {/* Mini map */}
        {totalStops > 0 && (
          <Card className="overflow-hidden">
            <div className="border-b px-5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Route</div>
            </div>
            <div className="p-3">
              <TripMiniMap days={days} />
            </div>
          </Card>
        )}

        {/* Itinerary */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Itinerary</h2>
          <Button variant="outline" size="sm" onClick={addDay} aria-label="Add day">
            <Plus className="mr-1 h-4 w-4" /> Add day
          </Button>
        </div>

        {days.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No days planned</p>
            <p className="max-w-xs text-sm text-muted-foreground">Add a day, then pull in the places you've saved.</p>
            <Button className="mt-1" variant="outline" onClick={addDay} aria-label="Add day">
              <Plus className="mr-1 h-4 w-4" /> Add day
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                onAddStop={() => setAddStopDay(day.id)}
                onDeleteDay={() => deleteDay(day.id)}
                onRemoveStop={removeStop}
                onMove={(index, dir) => moveStop(day, index, dir)}
              />
            ))}
          </div>
        )}
      </div>

      <TripDialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) load(); }} trip={trip} onDeleted={() => navigate("/trips")} />
      {addStopDay != null && (
        <AddStopDialog
          open={addStopDay != null}
          onOpenChange={(o) => { if (!o) setAddStopDay(null); }}
          dayId={addStopDay}
          onAdded={load}
        />
      )}
    </div>
  );
}

function DayCard({
  day,
  onAddStop,
  onDeleteDay,
  onRemoveStop,
  onMove,
}: {
  day: TripDay;
  onAddStop: () => void;
  onDeleteDay: () => void;
  onRemoveStop: (stopId: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
}) {
  const stops = day.stops ?? [];
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b px-5 py-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Day {day.day_index}{day.date ? ` · ${formatDate(day.date, { weekday: "short", month: "short", day: "numeric" })}` : ""}
          </div>
          {day.title && <div className="mt-0.5 text-sm font-medium">{day.title}</div>}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onAddStop} aria-label={`Add stop to day ${day.day_index}`}>
            <Plus className="mr-1 h-4 w-4" /> Stop
          </Button>
          <ConfirmButton
            variant="ghost"
            size="icon"
            aria-label={`Delete day ${day.day_index}`}
            prompt="Delete this day and its stops?"
            onConfirm={onDeleteDay}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </ConfirmButton>
        </div>
      </div>

      {stops.length === 0 ? (
        <div className="px-5 py-6 text-center text-sm text-muted-foreground">No stops yet — add one above.</div>
      ) : (
        <ul className="divide-y">
          {stops.map((s: DayStop, i) => (
            <li key={s.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex flex-col">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={i === 0}
                  onClick={() => onMove(i, -1)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={i === stops.length - 1}
                  onClick={() => onMove(i, 1)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{s.poi_name ?? "Removed place"}</span>
                  <CategoryChip name={s.category_name} color={s.category_color} icon={s.category_icon} />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {s.arrive_time && <span className="inline-flex items-center gap-1 tabular-nums"><Clock className="h-3 w-3" /> {s.arrive_time}</span>}
                  {s.duration_min ? <span className="tabular-nums">{formatDuration(s.duration_min)}</span> : null}
                  {s.note && <span className="truncate">· {s.note}</span>}
                </div>
              </div>
              <button
                type="button"
                aria-label="Remove stop"
                onClick={() => onRemoveStop(s.id)}
                className="rounded p-1 text-muted-foreground hover:bg-secondary hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
