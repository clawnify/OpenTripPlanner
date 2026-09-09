-- ── Settings (key/value) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed data (default settings + the sample Lisbon trip) lives in src/server/seed.ts
-- and is written by ensureSeeded() on first request: Clawnify applies this file as
-- DDL only, so a single INSERT here would fail the whole deploy.

-- ── Categories (for places / POIs) ───────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2563EB',     -- hex from the category palette; tints markers + pills
  icon TEXT NOT NULL DEFAULT 'map-pin',      -- lucide icon name
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Points of interest (saved places on the map) ─────────────────
CREATE TABLE IF NOT EXISTS pois (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  address TEXT,
  price REAL,
  currency TEXT,
  visited INTEGER NOT NULL DEFAULT 0,
  favorite INTEGER NOT NULL DEFAULT 0,
  rating INTEGER,                            -- 1..5
  notes TEXT,
  image_url TEXT,
  link TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pois_category ON pois(category_id);

-- ── Trips ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  destination TEXT,
  start_date TEXT,                           -- 'YYYY-MM-DD'
  end_date TEXT,
  cover_url TEXT,
  notes TEXT,
  color TEXT NOT NULL DEFAULT 'sky',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Trip days (one per day of a trip) ────────────────────────────
CREATE TABLE IF NOT EXISTS trip_days (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_index INTEGER NOT NULL,                -- 1-based order within the trip
  date TEXT,                                 -- 'YYYY-MM-DD'
  title TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_trip_days_trip ON trip_days(trip_id);

-- ── Day stops (ordered POIs within a day) ────────────────────────
CREATE TABLE IF NOT EXISTS day_stops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day_id INTEGER NOT NULL REFERENCES trip_days(id) ON DELETE CASCADE,
  poi_id INTEGER REFERENCES pois(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  arrive_time TEXT,                          -- 'HH:MM'
  duration_min INTEGER,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_day_stops_day ON day_stops(day_id);
