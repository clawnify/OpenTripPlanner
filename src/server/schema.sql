-- ── Settings (key/value) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('default_center_lat', '38.7223');
INSERT OR IGNORE INTO settings (key, value) VALUES ('default_center_lng', '-9.1393');
INSERT OR IGNORE INTO settings (key, value) VALUES ('default_zoom', '12');
INSERT OR IGNORE INTO settings (key, value) VALUES ('currency', 'USD');
INSERT OR IGNORE INTO settings (key, value) VALUES ('home_title', 'My Trips');

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

-- ── Seed: categories (only on a fresh DB) ────────────────────────
INSERT INTO categories (name, color, icon)
SELECT 'Food', '#EA580C', 'utensils'
WHERE NOT EXISTS (SELECT 1 FROM categories);

INSERT INTO categories (name, color, icon)
SELECT 'Sights', '#2563EB', 'landmark'
WHERE (SELECT COUNT(*) FROM categories) = 1;

INSERT INTO categories (name, color, icon)
SELECT 'Hotel', '#7C3AED', 'bed-double'
WHERE (SELECT COUNT(*) FROM categories) = 2;

INSERT INTO categories (name, color, icon)
SELECT 'Nature', '#059669', 'trees'
WHERE (SELECT COUNT(*) FROM categories) = 3;

INSERT INTO categories (name, color, icon)
SELECT 'Nightlife', '#DB2777', 'wine'
WHERE (SELECT COUNT(*) FROM categories) = 4;

INSERT INTO categories (name, color, icon)
SELECT 'Shopping', '#D97706', 'shopping-bag'
WHERE (SELECT COUNT(*) FROM categories) = 5;

-- ── Seed: sample POIs in Lisbon (only on a fresh DB) ─────────────
INSERT INTO pois (name, category_id, lat, lng, address, price, currency, visited, favorite, rating)
SELECT 'Belém Tower', (SELECT id FROM categories WHERE name = 'Sights'), 38.6916, -9.2160, 'Av. Brasília, Lisbon', 8, 'EUR', 0, 1, 5
WHERE NOT EXISTS (SELECT 1 FROM pois);

INSERT INTO pois (name, category_id, lat, lng, address, price, currency, visited, favorite, rating)
SELECT 'Time Out Market', (SELECT id FROM categories WHERE name = 'Food'), 38.7077, -9.1459, 'Av. 24 de Julho 49, Lisbon', NULL, 'EUR', 0, 1, 5
WHERE (SELECT COUNT(*) FROM pois) = 1;

INSERT INTO pois (name, category_id, lat, lng, address, price, currency, visited, favorite, rating)
SELECT 'Jerónimos Monastery', (SELECT id FROM categories WHERE name = 'Sights'), 38.6979, -9.2065, 'Praça do Império, Lisbon', 10, 'EUR', 0, 0, 5
WHERE (SELECT COUNT(*) FROM pois) = 2;

INSERT INTO pois (name, category_id, lat, lng, address, price, currency, visited, favorite, rating)
SELECT 'Alfama', (SELECT id FROM categories WHERE name = 'Sights'), 38.7128, -9.1287, 'Alfama, Lisbon', NULL, 'EUR', 0, 1, 4
WHERE (SELECT COUNT(*) FROM pois) = 3;

INSERT INTO pois (name, category_id, lat, lng, address, price, currency, visited, favorite, rating)
SELECT 'LX Factory', (SELECT id FROM categories WHERE name = 'Shopping'), 38.7016, -9.1786, 'R. Rodrigues de Faria 103, Lisbon', NULL, 'EUR', 0, 0, 4
WHERE (SELECT COUNT(*) FROM pois) = 4;

-- ── Seed: sample trip (only on a fresh DB) ───────────────────────
INSERT INTO trips (title, destination, start_date, end_date, notes, color)
SELECT '3 Days in Lisbon', 'Lisbon, Portugal', '2026-09-12', '2026-09-14', 'A first taste of Lisbon — sights, seafood, and sunset miradouros.', 'amber'
WHERE NOT EXISTS (SELECT 1 FROM trips);

INSERT INTO trip_days (trip_id, day_index, date, title)
SELECT (SELECT id FROM trips WHERE title = '3 Days in Lisbon'), 1, '2026-09-12', 'Belém & the river'
WHERE NOT EXISTS (SELECT 1 FROM trip_days);

INSERT INTO trip_days (trip_id, day_index, date, title)
SELECT (SELECT id FROM trips WHERE title = '3 Days in Lisbon'), 2, '2026-09-13', 'Old town & Alfama'
WHERE (SELECT COUNT(*) FROM trip_days) = 1;

INSERT INTO trip_days (trip_id, day_index, date, title)
SELECT (SELECT id FROM trips WHERE title = '3 Days in Lisbon'), 3, '2026-09-14', 'Markets & departure'
WHERE (SELECT COUNT(*) FROM trip_days) = 2;

-- Day 1 stops
INSERT INTO day_stops (day_id, poi_id, sort_order, arrive_time, duration_min)
SELECT (SELECT id FROM trip_days WHERE day_index = 1 LIMIT 1),
       (SELECT id FROM pois WHERE name = 'Belém Tower'), 0, '09:30', 90
WHERE NOT EXISTS (SELECT 1 FROM day_stops);

INSERT INTO day_stops (day_id, poi_id, sort_order, arrive_time, duration_min)
SELECT (SELECT id FROM trip_days WHERE day_index = 1 LIMIT 1),
       (SELECT id FROM pois WHERE name = 'Jerónimos Monastery'), 1, '11:30', 75
WHERE (SELECT COUNT(*) FROM day_stops) = 1;

-- Day 2 stops
INSERT INTO day_stops (day_id, poi_id, sort_order, arrive_time, duration_min)
SELECT (SELECT id FROM trip_days WHERE day_index = 2 LIMIT 1),
       (SELECT id FROM pois WHERE name = 'Alfama'), 0, '10:00', 120
WHERE (SELECT COUNT(*) FROM day_stops) = 2;

-- Day 3 stops
INSERT INTO day_stops (day_id, poi_id, sort_order, arrive_time, duration_min)
SELECT (SELECT id FROM trip_days WHERE day_index = 3 LIMIT 1),
       (SELECT id FROM pois WHERE name = 'Time Out Market'), 0, '12:30', 90
WHERE (SELECT COUNT(*) FROM day_stops) = 3;
