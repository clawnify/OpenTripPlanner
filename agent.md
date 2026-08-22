# OpenTripPlanner — agent guide

This app is a **map-based trip planner and place tracker**. You plan trips for
the user by calling its JSON API: geocode an address into coordinates, save it
as a place (POI) on the map, then assemble a trip out of days and ordered stops.
You never touch a browser or a map library — you write JSON.

Base URL: this app's own origin. All endpoints are under `/api`.

## The data model

- **Place (POI)** — a point on the map: `name`, `lat`/`lng`, optional `category_id`,
  `address`, `price`/`currency`, `rating` (1–5), `visited`, `favorite`, `notes`, `link`.
- **Category** — colors a place's marker and pill (e.g. Food, Sights, Hotel).
- **Trip** — a titled plan with a `destination` and date range.
- **Day** — one day of a trip (`day_index` is assigned automatically in order).
- **Stop** — a place placed into a day at a `sort_order` (assigned automatically),
  with an optional `arrive_time` and `duration_min`.

## API

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/config` | Map tile URL + default center/zoom |
| GET | `/api/geocode?q=` | Address → `{ results: [{ display_name, lat, lng }] }` (top 5) |
| GET | `/api/reverse?lat=&lng=` | Coordinates → `{ display_name }` |
| GET | `/api/categories` | List categories (with `poi_count`) |
| POST | `/api/categories` | Create `{ name, color?, icon? }` |
| PATCH | `/api/categories/{id}` | Update any field |
| DELETE | `/api/categories/{id}` | Delete |
| GET | `/api/pois` | List places. Filters: `?category_id=&favorite=1&visited=0` |
| GET | `/api/pois/{id}` | Get one place |
| POST | `/api/pois` | Create `{ name, lat, lng, category_id?, address?, price?, currency?, rating?, visited?, favorite?, notes?, link?, image_url? }` |
| PATCH | `/api/pois/{id}` | Update any field |
| DELETE | `/api/pois/{id}` | Delete |
| GET | `/api/trips` | List trips (with `day_count`, `stop_count`) |
| GET | `/api/trips/{id}` | Get a trip with nested `days[]`, each with ordered `stops[]` |
| POST | `/api/trips` | Create `{ title, destination?, start_date?, end_date?, notes?, color? }` |
| PATCH | `/api/trips/{id}` | Update any field |
| DELETE | `/api/trips/{id}` | Delete (cascades days + stops) |
| POST | `/api/trips/{id}/days` | Add a day `{ date?, title?, notes? }` (`day_index` auto-assigned) |
| PATCH | `/api/days/{id}` | Update a day |
| DELETE | `/api/days/{id}` | Delete a day (cascades stops) |
| POST | `/api/days/{id}/stops` | Add a stop `{ poi_id, arrive_time?, duration_min?, note? }` (`sort_order` auto-assigned) |
| PATCH | `/api/stops/{id}` | Update a stop |
| DELETE | `/api/stops/{id}` | Remove a stop |
| POST | `/api/days/{id}/reorder` | Reorder stops `{ stop_ids: [...] }` (new order) |
| GET | `/api/settings` | All settings as an object |
| PATCH | `/api/settings` | Merge keys (`default_center_lat/lng`, `default_zoom`, `currency`, `home_title`) |
| GET | `/api/stats` | `{ trips, pois, visited, favorites }` |

Dates are `YYYY-MM-DD`; times are `HH:MM`. `visited`/`favorite` accept booleans on
input and read back as `0`/`1`. IDs are integers. Errors return `{ error }`.

## Planning recipe

1. **Read the brief** — destination(s), dates, travel style.
2. **Make sure categories exist** — `GET /api/categories`; create any you need
   (`POST /api/categories`) so markers are colored sensibly.
3. **Add the places.** For each spot, if you only have a name/address, call
   `GET /api/geocode?q=<name>, <city>` and take the first result's `lat`/`lng`.
   Then `POST /api/pois` with the name, coordinates, a `category_id`, and any
   `price`/`notes`/`link` you know. Use real coordinates — never guess them.
4. **Create the trip** — `POST /api/trips` with the title, destination, and dates.
5. **Add a day per travel day** — `POST /api/trips/{id}/days` (repeat; `day_index`
   increments automatically). Give each a short `title` ("Old town & Alfama").
6. **Place stops into days in visiting order** — `POST /api/days/{dayId}/stops`
   with the `poi_id`, an `arrive_time`, and a `duration_min`. They append in order;
   use `POST /api/days/{dayId}/reorder` if you need to re-sequence.
7. **Hand it over.** The user sees the places on the Map page and the day-by-day
   plan (with a route map) on the trip's page. Confirm with `GET /api/trips/{id}`
   that days and stops landed as intended.

## Tips

- Geocoding goes through OpenStreetMap's Nominatim — be specific (`"Time Out Market, Lisbon"`)
  for a clean hit, and reuse the returned `display_name` as the place's `address`.
- Set `visited: true` for places the user has already been (they render dimmed on
  the map and checked in the table); `favorite: true` for highlights.
- One place can appear on multiple days — add a stop referencing the same `poi_id`.
