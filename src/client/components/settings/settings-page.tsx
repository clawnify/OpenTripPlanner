import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { useApp } from "@/context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SettingsPage() {
  const app = useApp();
  const [lat, setLat] = useState(String(app.settings.default_center_lat));
  const [lng, setLng] = useState(String(app.settings.default_center_lng));
  const [zoom, setZoom] = useState(String(app.settings.default_zoom));
  const [currency, setCurrency] = useState(app.settings.currency);
  const [homeTitle, setHomeTitle] = useState(app.settings.home_title);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLat(String(app.settings.default_center_lat));
    setLng(String(app.settings.default_center_lng));
    setZoom(String(app.settings.default_zoom));
    setCurrency(app.settings.currency);
    setHomeTitle(app.settings.home_title);
  }, [app.settings]);

  async function save() {
    setSaving(true);
    try {
      await app.updateSettings({
        default_center_lat: parseFloat(lat) || 0,
        default_center_lng: parseFloat(lng) || 0,
        default_zoom: Math.min(19, Math.max(1, parseInt(zoom, 10) || 12)),
        currency: currency.trim().toUpperCase() || "USD",
        home_title: homeTitle.trim() || "My Trips",
      });
    } catch (err) {
      app.setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto w-full max-w-3xl space-y-6 p-6">
        <header className="flex h-10 items-center">
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
        </header>

        <Card className="overflow-hidden">
          <div className="border-b px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Default map view</div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-5 py-5 md:grid-cols-3">
            <div>
              <Label htmlFor="s-lat">Center latitude</Label>
              <Input id="s-lat" value={lat} onChange={(e) => setLat(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <Label htmlFor="s-lng">Center longitude</Label>
              <Input id="s-lng" value={lng} onChange={(e) => setLng(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <Label htmlFor="s-zoom">Default zoom</Label>
              <Input id="s-zoom" type="number" min={1} max={19} value={zoom} onChange={(e) => setZoom(e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Preferences</div>
          </div>
          <div className="grid grid-cols-2 gap-4 px-5 py-5">
            <div>
              <Label htmlFor="s-title">Home title</Label>
              <Input id="s-title" value={homeTitle} onChange={(e) => setHomeTitle(e.target.value)} placeholder="My Trips" />
            </div>
            <div>
              <Label htmlFor="s-cur">Default currency</Label>
              <Input id="s-cur" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="USD" />
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b px-5 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Map tiles</div>
          </div>
          <div className="flex items-start gap-3 px-5 py-5 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              The map uses free OpenStreetMap tiles by default. To switch to crisper, higher-rate-limit
              MapTiler tiles, set a <span className="font-medium text-foreground">MAPTILER_KEY</span> environment
              variable on this app — the map picks it up automatically, no code changes.
            </p>
          </div>
        </Card>

        <div>
          <Button onClick={save} disabled={saving} aria-label="Save settings">Save settings</Button>
        </div>
      </div>
    </div>
  );
}
