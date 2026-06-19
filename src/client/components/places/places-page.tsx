import { useState } from "react";
import { Plus, Star, Check, MapPin, Pencil } from "lucide-react";
import { useApp } from "@/context";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CategoryChip } from "@/components/category-chip";
import { PoiDialog } from "@/components/poi-dialog";
import type { Poi } from "@/types";

export function PlacesPage() {
  const app = useApp();
  const { pois } = app;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Poi | undefined>(undefined);

  const visitedCount = pois.filter((p) => p.visited).length;
  const favoriteCount = pois.filter((p) => p.favorite).length;

  function openNew() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function openEdit(p: Poi) {
    setEditing(p);
    setDialogOpen(true);
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <header className="flex h-10 items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Places</h1>
          <Button onClick={openNew} aria-label="Add place">
            <Plus className="mr-1 h-4 w-4" /> Add place
          </Button>
        </header>

        {pois.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No places yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">Save the spots you want to visit — they'll appear here and on the map.</p>
            <Button className="mt-1" onClick={openNew} aria-label="Add place">
              <Plus className="mr-1 h-4 w-4" /> Add place
            </Button>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="border-b px-5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Places · {pois.length}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-secondary/60 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2.5 font-semibold">Place</th>
                    <th className="px-3 py-2.5 font-semibold">Category</th>
                    <th className="px-3 py-2.5 text-center font-semibold">Status</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {pois.map((p) => (
                    <tr
                      key={p.id}
                      className="group cursor-pointer border-b last:border-0 hover:bg-secondary/50"
                      onClick={() => openEdit(p)}
                    >
                      <td className="px-5 py-2.5">
                        <div className="font-medium text-foreground">{p.name}</div>
                        {p.address && <div className="truncate text-xs text-muted-foreground">{p.address}</div>}
                      </td>
                      <td className="px-3 py-2.5">
                        <CategoryChip name={p.category_name} color={p.category_color} icon={p.category_icon} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          {!!p.favorite && <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-label="Favorite" />}
                          {!!p.visited && <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.5} aria-label="Visited" />}
                          {!p.favorite && !p.visited && <span className="text-xs text-muted-foreground">—</span>}
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-right tabular-nums text-foreground">
                        {p.price != null ? formatMoney(p.price, p.currency ?? app.settings.currency) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-secondary/40 text-xs text-muted-foreground">
                    <td className="px-5 py-2.5 font-medium" colSpan={4}>
                      <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" strokeWidth={2.5} /> {visitedCount} visited</span>
                      <span className="mx-2">·</span>
                      <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {favoriteCount} favorite</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        )}
      </div>

      <PoiDialog open={dialogOpen} onOpenChange={setDialogOpen} poi={editing} />
    </div>
  );
}
