import { useState } from "react";
import { Plus, MapPin, CalendarDays, Route as RouteIcon } from "lucide-react";
import { useApp } from "@/context";
import { cn, colorClasses, formatDateRange } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TripDialog } from "./trip-dialog";

export function TripsList({ navigate }: { navigate: (to: string) => void }) {
  const { trips, settings } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <header className="flex h-10 items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">{settings.home_title || "Trips"}</h1>
          <Button onClick={() => setDialogOpen(true)} aria-label="New trip">
            <Plus className="mr-1 h-4 w-4" /> New trip
          </Button>
        </header>

        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <RouteIcon className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No trips yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">Plan your first trip — add days and pull in the places you've saved.</p>
            <Button className="mt-1" onClick={() => setDialogOpen(true)} aria-label="New trip">
              <Plus className="mr-1 h-4 w-4" /> New trip
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trips.map((t) => {
              const palette = colorClasses(t.color);
              return (
                <Card
                  key={t.id}
                  className="group cursor-pointer overflow-hidden transition-colors hover:border-foreground/20"
                  onClick={() => navigate(`/trips/${t.id}`)}
                >
                  {t.cover_url ? (
                    <div className="h-28 w-full overflow-hidden bg-secondary">
                      <img src={t.cover_url} alt="" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className={cn("h-28 w-full", palette.bg)} />
                  )}
                  <div className="space-y-2 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Trip</div>
                    <h3 className="font-semibold tracking-tight">{t.title}</h3>
                    {t.destination && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" /> {t.destination}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {(t.start_date || t.end_date) && (
                        <span className="inline-flex items-center gap-1 rounded-sm border bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          <CalendarDays className="h-3 w-3" /> {formatDateRange(t.start_date, t.end_date)}
                        </span>
                      )}
                      <span className="rounded-sm border bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                        {t.day_count ?? 0} day{(t.day_count ?? 0) === 1 ? "" : "s"}
                      </span>
                      <span className="rounded-sm border bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                        {t.stop_count ?? 0} stop{(t.stop_count ?? 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <TripDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
