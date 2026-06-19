import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import type {
  Category,
  Poi,
  Trip,
  TripDay,
  DayStop,
  MapConfig,
  Stats,
  NewCategory,
  NewPoi,
  NewTrip,
  NewDay,
  NewStop,
} from "../types";

export interface AppSettings {
  default_center_lat: number;
  default_center_lng: number;
  default_zoom: number;
  currency: string;
  home_title: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  default_center_lat: 38.7223,
  default_center_lng: -9.1393,
  default_zoom: 12,
  currency: "USD",
  home_title: "My Trips",
};

function parseSettings(raw: Record<string, string>): AppSettings {
  const num = (key: keyof AppSettings, fallback: number) => {
    const v = parseFloat(raw[key]);
    return Number.isFinite(v) ? v : fallback;
  };
  return {
    default_center_lat: num("default_center_lat", DEFAULT_SETTINGS.default_center_lat),
    default_center_lng: num("default_center_lng", DEFAULT_SETTINGS.default_center_lng),
    default_zoom: num("default_zoom", DEFAULT_SETTINGS.default_zoom),
    currency: raw.currency || DEFAULT_SETTINGS.currency,
    home_title: raw.home_title || DEFAULT_SETTINGS.home_title,
  };
}

export function useAppState() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pois, setPois] = useState<Poi[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [mapConfig, setMapConfig] = useState<MapConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Loaders ──────────────────────────────────────────────────────

  const refreshCategories = useCallback(async () => {
    const res = await api<{ categories: Category[] }>("GET", "/api/categories");
    setCategories(res.categories);
  }, []);

  const refreshPois = useCallback(async () => {
    const res = await api<{ pois: Poi[] }>("GET", "/api/pois");
    setPois(res.pois);
  }, []);

  const refreshTrips = useCallback(async () => {
    const res = await api<{ trips: Trip[] }>("GET", "/api/trips");
    setTrips(res.trips);
  }, []);

  const refreshAll = useCallback(async () => {
    const [cat, poi, trip, st, cfg] = await Promise.all([
      api<{ categories: Category[] }>("GET", "/api/categories"),
      api<{ pois: Poi[] }>("GET", "/api/pois"),
      api<{ trips: Trip[] }>("GET", "/api/trips"),
      api<{ settings: Record<string, string> }>("GET", "/api/settings").catch(() => ({ settings: {} })),
      api<MapConfig>("GET", "/api/config").catch(() => null),
    ]);
    setCategories(cat.categories);
    setPois(poi.pois);
    setTrips(trip.trips);
    setSettings(parseSettings(st.settings));
    setMapConfig(cfg);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await refreshAll();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [refreshAll]);

  // ── Settings ─────────────────────────────────────────────────────

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const body: Record<string, string> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v !== undefined) body[k] = String(v);
    }
    const res = await api<{ settings: Record<string, string> }>("PATCH", "/api/settings", body);
    setSettings(parseSettings(res.settings));
    const cfg = await api<MapConfig>("GET", "/api/config").catch(() => null);
    setMapConfig(cfg);
  }, []);

  // ── Categories ───────────────────────────────────────────────────

  const createCategory = useCallback(async (data: NewCategory) => {
    const res = await api<{ category: Category }>("POST", "/api/categories", data);
    await refreshCategories();
    return res.category;
  }, [refreshCategories]);

  const updateCategory = useCallback(async (id: number, patch: Partial<NewCategory>) => {
    const res = await api<{ category: Category }>("PATCH", `/api/categories/${id}`, patch);
    await Promise.all([refreshCategories(), refreshPois()]);
    return res.category;
  }, [refreshCategories, refreshPois]);

  const deleteCategory = useCallback(async (id: number) => {
    await api("DELETE", `/api/categories/${id}`);
    await Promise.all([refreshCategories(), refreshPois()]);
  }, [refreshCategories, refreshPois]);

  // ── POIs ─────────────────────────────────────────────────────────

  const createPoi = useCallback(async (data: NewPoi) => {
    const res = await api<{ poi: Poi }>("POST", "/api/pois", data);
    await Promise.all([refreshPois(), refreshCategories()]);
    return res.poi;
  }, [refreshPois, refreshCategories]);

  const updatePoi = useCallback(async (id: number, patch: Partial<NewPoi>) => {
    const res = await api<{ poi: Poi }>("PATCH", `/api/pois/${id}`, patch);
    await Promise.all([refreshPois(), refreshCategories()]);
    return res.poi;
  }, [refreshPois, refreshCategories]);

  const deletePoi = useCallback(async (id: number) => {
    await api("DELETE", `/api/pois/${id}`);
    await Promise.all([refreshPois(), refreshCategories()]);
  }, [refreshPois, refreshCategories]);

  // ── Trips ────────────────────────────────────────────────────────

  const getTrip = useCallback(async (id: number): Promise<Trip> => {
    const res = await api<{ trip: Trip }>("GET", `/api/trips/${id}`);
    return res.trip;
  }, []);

  const createTrip = useCallback(async (data: NewTrip) => {
    const res = await api<{ trip: Trip }>("POST", "/api/trips", data);
    await refreshTrips();
    return res.trip;
  }, [refreshTrips]);

  const updateTrip = useCallback(async (id: number, patch: Partial<NewTrip>) => {
    const res = await api<{ trip: Trip }>("PATCH", `/api/trips/${id}`, patch);
    await refreshTrips();
    return res.trip;
  }, [refreshTrips]);

  const deleteTrip = useCallback(async (id: number) => {
    await api("DELETE", `/api/trips/${id}`);
    await refreshTrips();
  }, [refreshTrips]);

  // ── Days ─────────────────────────────────────────────────────────

  const addDay = useCallback(async (tripId: number, data: NewDay = {}) => {
    const res = await api<{ day: TripDay }>("POST", `/api/trips/${tripId}/days`, data);
    return res.day;
  }, []);

  const updateDay = useCallback(async (id: number, patch: Partial<NewDay>) => {
    const res = await api<{ day: TripDay }>("PATCH", `/api/days/${id}`, patch);
    return res.day;
  }, []);

  const deleteDay = useCallback(async (id: number) => {
    await api("DELETE", `/api/days/${id}`);
  }, []);

  // ── Stops ────────────────────────────────────────────────────────

  const addStop = useCallback(async (dayId: number, data: NewStop) => {
    const res = await api<{ stop: DayStop }>("POST", `/api/days/${dayId}/stops`, data);
    return res.stop;
  }, []);

  const updateStop = useCallback(async (id: number, patch: Partial<NewStop>) => {
    const res = await api<{ stop: DayStop }>("PATCH", `/api/stops/${id}`, patch);
    return res.stop;
  }, []);

  const deleteStop = useCallback(async (id: number) => {
    await api("DELETE", `/api/stops/${id}`);
  }, []);

  const reorderStops = useCallback(async (dayId: number, stopIds: number[]) => {
    await api("POST", `/api/days/${dayId}/reorder`, { stop_ids: stopIds });
  }, []);

  // ── Stats ────────────────────────────────────────────────────────

  const getStats = useCallback(async (): Promise<Stats> => {
    return api<Stats>("GET", "/api/stats");
  }, []);

  return {
    // data
    categories, pois, trips, settings, mapConfig,
    loading, error, setError,
    // refresh
    refreshAll, refreshPois, refreshTrips, refreshCategories,
    // settings
    updateSettings,
    // categories
    createCategory, updateCategory, deleteCategory,
    // pois
    createPoi, updatePoi, deletePoi,
    // trips
    getTrip, createTrip, updateTrip, deleteTrip,
    // days
    addDay, updateDay, deleteDay,
    // stops
    addStop, updateStop, deleteStop, reorderStops,
    // stats
    getStats,
  };
}

export type AppStateValue = ReturnType<typeof useAppState>;
