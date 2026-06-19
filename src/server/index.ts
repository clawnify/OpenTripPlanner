import { Hono, type Context } from "hono";
import { z } from "zod";
import { initDB, query, get, run } from "./db";
import { initUploads, putUpload, getUpload, deleteUpload } from "./uploads";

type Env = {
  Bindings: {
    DB: D1Database;
    UPLOADS: R2Bucket;
    MAPTILER_KEY?: string;
  };
};

const app = new Hono<Env>();

app.use("*", async (c, next) => {
  initDB(c.env);
  initUploads(c.env.UPLOADS);
  await next();
});

// ── Helpers ────────────────────────────────────────────────────────

const intParam = (raw: string | undefined | null): number | null => {
  if (raw === undefined || raw === null || raw === "") return null;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
};

async function parseJson<T>(c: Context, schema: z.ZodType<T>): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return { ok: false, error: "Invalid JSON" };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, error: parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ") };
  return { ok: true, data: parsed.data };
}

function buildUpdate(fields: Record<string, unknown>): { sets: string[]; params: unknown[] } {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) { sets.push(`${k} = ?`); params.push(v); }
  }
  return { sets, params };
}

// Accept booleans (from the UI) or 0/1 ints (the on-disk shape agents see), normalize to 0/1.
const bool = (v: boolean | number | undefined): number | undefined => (v === undefined ? undefined : v ? 1 : 0);
const boolish = z.union([z.boolean(), z.number().int().min(0).max(1)]);

async function readSettings(): Promise<Record<string, string>> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings").catch(() => []);
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

// ── Config (map tiles + default view) ──────────────────────────────

app.get("/api/config", async (c) => {
  const s = await readSettings();
  const lat = parseFloat(s.default_center_lat ?? "38.7223");
  const lng = parseFloat(s.default_center_lng ?? "-9.1393");
  const zoom = parseInt(s.default_zoom ?? "12", 10);
  const key = c.env.MAPTILER_KEY;

  if (key) {
    return c.json({
      tileUrl: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`,
      attribution: '© <a href="https://www.maptiler.com/copyright/">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      maptiler: true,
      defaultCenter: [Number.isFinite(lat) ? lat : 38.7223, Number.isFinite(lng) ? lng : -9.1393] as [number, number],
      defaultZoom: Number.isFinite(zoom) ? zoom : 12,
    });
  }

  return c.json({
    tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    maptiler: false,
    defaultCenter: [Number.isFinite(lat) ? lat : 38.7223, Number.isFinite(lng) ? lng : -9.1393] as [number, number],
    defaultZoom: Number.isFinite(zoom) ? zoom : 12,
  });
});

// ── Geocoding (Nominatim proxy) ────────────────────────────────────

const NOMINATIM_HEADERS = { "User-Agent": "open-trip-planner (clawnify.com)" };

app.get("/api/geocode", async (c) => {
  const q = c.req.query("q")?.trim();
  if (!q) return c.json({ results: [] });
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return c.json({ results: [] });
    const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    const results = data.map((d) => ({ display_name: d.display_name, lat: parseFloat(d.lat), lng: parseFloat(d.lon) }));
    return c.json({ results });
  } catch {
    return c.json({ results: [] });
  }
});

app.get("/api/reverse", async (c) => {
  const lat = c.req.query("lat");
  const lng = c.req.query("lng");
  if (!lat || !lng) return c.json({ error: "lat and lng required" }, 400);
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
  try {
    const res = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!res.ok) return c.json({ display_name: null });
    const data = (await res.json()) as { display_name?: string };
    return c.json({ display_name: data.display_name ?? null });
  } catch {
    return c.json({ display_name: null });
  }
});

// ── Image uploads (R2) ─────────────────────────────────────────────
// A place photo can be uploaded here; the returned URL goes in poi.image_url.

const UPLOAD_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

app.post("/api/uploads", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];
  if (!file || typeof file === "string") return c.json({ error: "No file provided" }, 400);

  const ext = file.name?.split(".").pop()?.toLowerCase() || "png";
  const mime = UPLOAD_MIME[ext];
  if (!mime) return c.json({ error: "Unsupported file type — use JPG, PNG, GIF or WebP" }, 400);
  if (file.size > 8 * 1024 * 1024) return c.json({ error: "Image too large (max 8 MB)" }, 400);

  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const url = await putUpload(filename, await file.arrayBuffer(), mime);
  return c.json({ url }, 200);
});

app.get("/api/uploads/:filename", async (c) => {
  const result = await getUpload(c.req.param("filename"));
  if (!result) return c.json({ error: "Not found" }, 404);
  return new Response(result.data, {
    headers: { "Content-Type": result.contentType, "Cache-Control": "public, max-age=31536000" },
  });
});

// ── Categories ─────────────────────────────────────────────────────

const CategoryInput = z.object({
  name: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
});

app.get("/api/categories", async (c) => {
  const rows = await query(
    `SELECT cat.*, (SELECT COUNT(*) FROM pois p WHERE p.category_id = cat.id) as poi_count
     FROM categories cat ORDER BY cat.name`,
  );
  return c.json({ categories: rows });
});

app.post("/api/categories", async (c) => {
  const parsed = await parseJson(c, CategoryInput);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const d = parsed.data;
  const result = await run(
    "INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)",
    [d.name, d.color ?? "#2563EB", d.icon ?? "map-pin"],
  );
  const row = await get("SELECT * FROM categories WHERE id = ?", [result.lastInsertRowid]);
  return c.json({ category: row }, 201);
});

app.patch("/api/categories/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const parsed = await parseJson(c, CategoryInput.partial());
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const { sets, params } = buildUpdate(parsed.data);
  if (!sets.length) return c.json({ error: "No fields" }, 400);
  params.push(id);
  const r = await run(`UPDATE categories SET ${sets.join(", ")} WHERE id = ?`, params);
  if (!r.changes) return c.json({ error: "Not found" }, 404);
  const row = await get("SELECT * FROM categories WHERE id = ?", [id]);
  return c.json({ category: row });
});

app.delete("/api/categories/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const r = await run("DELETE FROM categories WHERE id = ?", [id]);
  if (!r.changes) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

// ── Points of interest (places) ────────────────────────────────────

const PoiInput = z.object({
  name: z.string().min(1),
  category_id: z.number().int().nullable().optional(),
  lat: z.number(),
  lng: z.number(),
  address: z.string().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional().nullable(),
  visited: boolish.optional(),
  favorite: boolish.optional(),
  rating: z.number().int().min(1).max(5).optional().nullable(),
  notes: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
});

const POI_SELECT = `
  SELECT p.*,
    cat.name as category_name,
    cat.color as category_color,
    cat.icon as category_icon
  FROM pois p
  LEFT JOIN categories cat ON cat.id = p.category_id
`;

app.get("/api/pois", async (c) => {
  const categoryId = intParam(c.req.query("category_id"));
  const favorite = c.req.query("favorite");
  const visited = c.req.query("visited");
  const where: string[] = [];
  const params: unknown[] = [];
  if (categoryId) { where.push("p.category_id = ?"); params.push(categoryId); }
  if (favorite === "1" || favorite === "true") where.push("p.favorite = 1");
  if (visited === "1" || visited === "true") where.push("p.visited = 1");
  if (visited === "0" || visited === "false") where.push("p.visited = 0");
  const sql = `${POI_SELECT}${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY p.name`;
  const rows = await query(sql, params);
  return c.json({ pois: rows });
});

app.get("/api/pois/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const row = await get(`${POI_SELECT} WHERE p.id = ?`, [id]);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ poi: row });
});

app.post("/api/pois", async (c) => {
  const parsed = await parseJson(c, PoiInput);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const d = parsed.data;
  const result = await run(
    `INSERT INTO pois (name, category_id, lat, lng, address, price, currency, visited, favorite, rating, notes, image_url, link)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.name, d.category_id ?? null, d.lat, d.lng,
      d.address ?? null, d.price ?? null, d.currency ?? null,
      bool(d.visited) ?? 0, bool(d.favorite) ?? 0, d.rating ?? null,
      d.notes ?? null, d.image_url ?? null, d.link ?? null,
    ],
  );
  const row = await get(`${POI_SELECT} WHERE p.id = ?`, [result.lastInsertRowid]);
  return c.json({ poi: row }, 201);
});

app.patch("/api/pois/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const parsed = await parseJson(c, PoiInput.partial());
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const d = { ...parsed.data, visited: bool(parsed.data.visited), favorite: bool(parsed.data.favorite) };
  const { sets, params } = buildUpdate(d);
  if (!sets.length) return c.json({ error: "No fields" }, 400);
  params.push(id);
  const r = await run(`UPDATE pois SET ${sets.join(", ")} WHERE id = ?`, params);
  if (!r.changes) return c.json({ error: "Not found" }, 404);
  const row = await get(`${POI_SELECT} WHERE p.id = ?`, [id]);
  return c.json({ poi: row });
});

app.delete("/api/pois/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const row = await get<{ image_url: string | null }>("SELECT image_url FROM pois WHERE id = ?", [id]);
  const r = await run("DELETE FROM pois WHERE id = ?", [id]);
  if (!r.changes) return c.json({ error: "Not found" }, 404);
  // Drop the R2 blob if the photo was one of ours (external URLs are left alone).
  if (row?.image_url?.startsWith("/api/uploads/")) {
    try { await deleteUpload(row.image_url.replace("/api/uploads/", "")); } catch { /* best-effort */ }
  }
  return c.json({ ok: true });
});

// ── Trips ──────────────────────────────────────────────────────────

const TripInput = z.object({
  title: z.string().min(1),
  destination: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  cover_url: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  color: z.string().optional(),
});

app.get("/api/trips", async (c) => {
  const rows = await query(
    `SELECT t.*,
       (SELECT COUNT(*) FROM trip_days d WHERE d.trip_id = t.id) as day_count,
       (SELECT COUNT(*) FROM day_stops s
          JOIN trip_days d ON d.id = s.day_id WHERE d.trip_id = t.id) as stop_count
     FROM trips t ORDER BY t.start_date DESC, t.created_at DESC`,
  );
  return c.json({ trips: rows });
});

app.get("/api/trips/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const trip = await get("SELECT * FROM trips WHERE id = ?", [id]);
  if (!trip) return c.json({ error: "Not found" }, 404);

  const days = await query<{ id: number }>(
    "SELECT * FROM trip_days WHERE trip_id = ? ORDER BY day_index",
    [id],
  );
  const stops = await query(
    `SELECT s.*,
       p.name as poi_name, p.lat as poi_lat, p.lng as poi_lng,
       p.address as poi_address, p.visited as poi_visited, p.favorite as poi_favorite,
       cat.name as category_name, cat.color as category_color, cat.icon as category_icon
     FROM day_stops s
     LEFT JOIN pois p ON p.id = s.poi_id
     LEFT JOIN categories cat ON cat.id = p.category_id
     WHERE s.day_id IN (SELECT id FROM trip_days WHERE trip_id = ?)
     ORDER BY s.day_id, s.sort_order`,
    [id],
  ) as Array<Record<string, unknown> & { day_id: number }>;

  const byDay = new Map<number, Array<Record<string, unknown>>>();
  for (const s of stops) {
    const arr = byDay.get(s.day_id) ?? [];
    arr.push(s);
    byDay.set(s.day_id, arr);
  }
  const daysWithStops = days.map((d) => ({ ...d, stops: byDay.get(d.id) ?? [] }));

  return c.json({ trip: { ...trip, days: daysWithStops } });
});

app.post("/api/trips", async (c) => {
  const parsed = await parseJson(c, TripInput);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const d = parsed.data;
  const result = await run(
    `INSERT INTO trips (title, destination, start_date, end_date, cover_url, notes, color)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [d.title, d.destination ?? null, d.start_date ?? null, d.end_date ?? null, d.cover_url ?? null, d.notes ?? null, d.color ?? "sky"],
  );
  const row = await get("SELECT * FROM trips WHERE id = ?", [result.lastInsertRowid]);
  return c.json({ trip: row }, 201);
});

app.patch("/api/trips/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const parsed = await parseJson(c, TripInput.partial());
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const { sets, params } = buildUpdate(parsed.data);
  if (!sets.length) return c.json({ error: "No fields" }, 400);
  params.push(id);
  const r = await run(`UPDATE trips SET ${sets.join(", ")} WHERE id = ?`, params);
  if (!r.changes) return c.json({ error: "Not found" }, 404);
  const row = await get("SELECT * FROM trips WHERE id = ?", [id]);
  return c.json({ trip: row });
});

app.delete("/api/trips/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const r = await run("DELETE FROM trips WHERE id = ?", [id]);
  if (!r.changes) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

// ── Trip days ──────────────────────────────────────────────────────

const DayInput = z.object({
  date: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

app.post("/api/trips/:id/days", async (c) => {
  const tripId = intParam(c.req.param("id"));
  if (!tripId) return c.json({ error: "Invalid ID" }, 400);
  const trip = await get("SELECT id FROM trips WHERE id = ?", [tripId]);
  if (!trip) return c.json({ error: "Trip not found" }, 404);
  const parsed = await parseJson(c, DayInput);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const d = parsed.data;
  const nextRow = await get<{ next: number }>(
    "SELECT COALESCE(MAX(day_index), 0) + 1 as next FROM trip_days WHERE trip_id = ?",
    [tripId],
  );
  const dayIndex = nextRow?.next ?? 1;
  const result = await run(
    "INSERT INTO trip_days (trip_id, day_index, date, title, notes) VALUES (?, ?, ?, ?, ?)",
    [tripId, dayIndex, d.date ?? null, d.title ?? null, d.notes ?? null],
  );
  const row = await get("SELECT * FROM trip_days WHERE id = ?", [result.lastInsertRowid]);
  return c.json({ day: row }, 201);
});

app.patch("/api/days/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const parsed = await parseJson(c, DayInput.extend({ day_index: z.number().int().optional() }).partial());
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const { sets, params } = buildUpdate(parsed.data);
  if (!sets.length) return c.json({ error: "No fields" }, 400);
  params.push(id);
  const r = await run(`UPDATE trip_days SET ${sets.join(", ")} WHERE id = ?`, params);
  if (!r.changes) return c.json({ error: "Not found" }, 404);
  const row = await get("SELECT * FROM trip_days WHERE id = ?", [id]);
  return c.json({ day: row });
});

app.delete("/api/days/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const r = await run("DELETE FROM trip_days WHERE id = ?", [id]);
  if (!r.changes) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

// ── Day stops ──────────────────────────────────────────────────────

const StopInput = z.object({
  poi_id: z.number().int().nullable().optional(),
  arrive_time: z.string().optional().nullable(),
  duration_min: z.number().int().optional().nullable(),
  note: z.string().optional().nullable(),
});

const STOP_SELECT = `
  SELECT s.*,
    p.name as poi_name, p.lat as poi_lat, p.lng as poi_lng,
    p.address as poi_address, p.visited as poi_visited, p.favorite as poi_favorite,
    cat.name as category_name, cat.color as category_color, cat.icon as category_icon
  FROM day_stops s
  LEFT JOIN pois p ON p.id = s.poi_id
  LEFT JOIN categories cat ON cat.id = p.category_id
`;

app.post("/api/days/:id/stops", async (c) => {
  const dayId = intParam(c.req.param("id"));
  if (!dayId) return c.json({ error: "Invalid ID" }, 400);
  const day = await get("SELECT id FROM trip_days WHERE id = ?", [dayId]);
  if (!day) return c.json({ error: "Day not found" }, 404);
  const parsed = await parseJson(c, StopInput);
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const d = parsed.data;
  const nextRow = await get<{ next: number }>(
    "SELECT COALESCE(MAX(sort_order), -1) + 1 as next FROM day_stops WHERE day_id = ?",
    [dayId],
  );
  const sortOrder = nextRow?.next ?? 0;
  const result = await run(
    "INSERT INTO day_stops (day_id, poi_id, sort_order, arrive_time, duration_min, note) VALUES (?, ?, ?, ?, ?, ?)",
    [dayId, d.poi_id ?? null, sortOrder, d.arrive_time ?? null, d.duration_min ?? null, d.note ?? null],
  );
  const row = await get(`${STOP_SELECT} WHERE s.id = ?`, [result.lastInsertRowid]);
  return c.json({ stop: row }, 201);
});

app.patch("/api/stops/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const parsed = await parseJson(c, StopInput.extend({ sort_order: z.number().int().optional() }).partial());
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const { sets, params } = buildUpdate(parsed.data);
  if (!sets.length) return c.json({ error: "No fields" }, 400);
  params.push(id);
  const r = await run(`UPDATE day_stops SET ${sets.join(", ")} WHERE id = ?`, params);
  if (!r.changes) return c.json({ error: "Not found" }, 404);
  const row = await get(`${STOP_SELECT} WHERE s.id = ?`, [id]);
  return c.json({ stop: row });
});

app.delete("/api/stops/:id", async (c) => {
  const id = intParam(c.req.param("id"));
  if (!id) return c.json({ error: "Invalid ID" }, 400);
  const r = await run("DELETE FROM day_stops WHERE id = ?", [id]);
  if (!r.changes) return c.json({ error: "Not found" }, 404);
  return c.json({ ok: true });
});

app.post("/api/days/:id/reorder", async (c) => {
  const dayId = intParam(c.req.param("id"));
  if (!dayId) return c.json({ error: "Invalid ID" }, 400);
  const parsed = await parseJson(c, z.object({ stop_ids: z.array(z.number().int()) }));
  if (!parsed.ok) return c.json({ error: parsed.error }, 400);
  const ids = parsed.data.stop_ids;
  for (let i = 0; i < ids.length; i++) {
    await run("UPDATE day_stops SET sort_order = ? WHERE id = ? AND day_id = ?", [i, ids[i], dayId]);
  }
  const rows = await query(`${STOP_SELECT} WHERE s.day_id = ? ORDER BY s.sort_order`, [dayId]);
  return c.json({ stops: rows });
});

// ── Settings (key/value) ───────────────────────────────────────────

app.get("/api/settings", async (c) => {
  const out = await readSettings();
  return c.json({ settings: out });
});

app.patch("/api/settings", async (c) => {
  let body: unknown;
  try { body = await c.req.json(); } catch { return c.json({ error: "Invalid JSON" }, 400); }
  if (!body || typeof body !== "object") return c.json({ error: "Body must be an object" }, 400);
  const entries = Object.entries(body as Record<string, unknown>).filter(([, v]) => v !== undefined && v !== null);
  for (const [key, value] of entries) {
    await run(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
      [key, String(value)],
    );
  }
  const out = await readSettings();
  return c.json({ settings: out });
});

// ── Stats (dashboard counts) ───────────────────────────────────────

app.get("/api/stats", async (c) => {
  const safeGet = <T,>(sql: string, fallback: T) =>
    get<T>(sql).catch(() => fallback as T | undefined).then((v) => v ?? fallback);
  const [trips, pois, visited, favorites] = await Promise.all([
    safeGet<{ n: number }>("SELECT COUNT(*) as n FROM trips", { n: 0 }),
    safeGet<{ n: number }>("SELECT COUNT(*) as n FROM pois", { n: 0 }),
    safeGet<{ n: number }>("SELECT COUNT(*) as n FROM pois WHERE visited = 1", { n: 0 }),
    safeGet<{ n: number }>("SELECT COUNT(*) as n FROM pois WHERE favorite = 1", { n: 0 }),
  ]);
  return c.json({ trips: trips.n, pois: pois.n, visited: visited.n, favorites: favorites.n });
});

// ── Health ─────────────────────────────────────────────────────────

app.get("/api/health", (c) => c.json({ ok: true }));

export default app;
