import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { useApp } from "@/context";
import { cn, CATEGORY_SWATCHES } from "@/lib/utils";
import { categoryIcon, CATEGORY_ICON_NAMES } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Category } from "@/types";
import { ConfirmButton } from "@/components/confirm-button";

export function CategoriesPage() {
  const app = useApp();
  const { categories } = app;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>(undefined);

  function openNew() {
    setEditing(undefined);
    setOpen(true);
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
        <header className="flex h-10 items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">Categories</h1>
          <Button onClick={openNew} aria-label="New category">
            <Plus className="mr-1 h-4 w-4" /> New category
          </Button>
        </header>

        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <Tags className="h-8 w-8 text-muted-foreground" />
            <p className="font-medium">No categories yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">Categories color your places on the map — add one to get started.</p>
            <Button className="mt-1" onClick={openNew} aria-label="New category">
              <Plus className="mr-1 h-4 w-4" /> New category
            </Button>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="border-b px-5 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Categories · {categories.length}
              </div>
            </div>
            <ul className="divide-y">
              {categories.map((cat) => {
                const Icon = categoryIcon(cat.icon);
                return (
                  <li key={cat.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-md"
                        style={{ backgroundColor: `color-mix(in srgb, ${cat.color} 14%, transparent)`, color: cat.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {cat.poi_count ?? 0} place{(cat.poi_count ?? 0) === 1 ? "" : "s"}
                        </div>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" aria-label={`Edit ${cat.name}`} onClick={() => { setEditing(cat); setOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>

      <CategoryDialog open={open} onOpenChange={setOpen} category={editing} />
    </div>
  );
}

function CategoryDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  category?: Category;
}) {
  const app = useApp();
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_SWATCHES[0]);
  const [icon, setIcon] = useState("map-pin");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setColor(category?.color ?? CATEGORY_SWATCHES[0]);
    setIcon(category?.icon ?? "map-pin");
  }, [open, category]);

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name: name.trim(), color, icon };
      if (category) await app.updateCategory(category.id, payload);
      else await app.createCategory(payload);
      onOpenChange(false);
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!category) return;
    try {
      await app.deleteCategory(category.id);
      onOpenChange(false);
    } catch (err) {
      app.setError((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Food" />
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  className={cn(
                    "h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition",
                    color === c && "ring-2 ring-foreground",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <Label>Icon</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICON_NAMES.map((n) => {
                const Icon = categoryIcon(n);
                return (
                  <button
                    key={n}
                    type="button"
                    aria-label={`Icon ${n}`}
                    onClick={() => setIcon(n)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
                      icon === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          {category && (
            <ConfirmButton variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" prompt={`Delete "${category.name}"? Places keep their data.`} onConfirm={remove}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </ConfirmButton>
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={save} disabled={saving || !name.trim()}>
            {category ? "Save changes" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
