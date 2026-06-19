// ── Core entities ──────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  color: string;   // hex
  icon: string;    // lucide icon name
  created_at: string;
  // Joined
  poi_count?: number;
}

export interface Poi {
  id: number;
  name: string;
  category_id: number | null;
  lat: number;
  lng: number;
  address: string | null;
  price: number | null;
  currency: string | null;
  visited: number;   // 0 | 1
  favorite: number;  // 0 | 1
  rating: number | null;
  notes: string | null;
  image_url: string | null;
  link: string | null;
  created_at: string;
  // Joined
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
}

export interface Trip {
  id: number;
  title: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  cover_url: string | null;
  notes: string | null;
  color: string;
  created_at: string;
  // Joined (list view)
  day_count?: number;
  stop_count?: number;
  // Nested (detail view)
  days?: TripDay[];
}

export interface TripDay {
  id: number;
  trip_id: number;
  day_index: number;
  date: string | null;
  title: string | null;
  notes: string | null;
  // Nested (detail view)
  stops?: DayStop[];
}

export interface DayStop {
  id: number;
  day_id: number;
  poi_id: number | null;
  sort_order: number;
  arrive_time: string | null;
  duration_min: number | null;
  note: string | null;
  // Joined
  poi_name?: string | null;
  poi_lat?: number | null;
  poi_lng?: number | null;
  poi_address?: string | null;
  poi_visited?: number | null;
  poi_favorite?: number | null;
  category_name?: string | null;
  category_color?: string | null;
  category_icon?: string | null;
}

export interface MapConfig {
  tileUrl: string;
  attribution: string;
  maptiler: boolean;
  defaultCenter: [number, number];
  defaultZoom: number;
}

export interface GeocodeResult {
  display_name: string;
  lat: number;
  lng: number;
}

export interface Stats {
  trips: number;
  pois: number;
  visited: number;
  favorites: number;
}

// ── Input types for mutations ──────────────────────────────────────

export type NewCategory = { name: string; color?: string; icon?: string };

export type NewPoi = {
  name: string;
  category_id?: number | null;
  lat: number;
  lng: number;
  address?: string | null;
  price?: number | null;
  currency?: string | null;
  visited?: boolean;
  favorite?: boolean;
  rating?: number | null;
  notes?: string | null;
  image_url?: string | null;
  link?: string | null;
};

export type NewTrip = {
  title: string;
  destination?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  cover_url?: string | null;
  notes?: string | null;
  color?: string;
};

export type NewDay = { date?: string | null; title?: string | null; notes?: string | null };

export type NewStop = {
  poi_id?: number | null;
  arrive_time?: string | null;
  duration_min?: number | null;
  note?: string | null;
};
