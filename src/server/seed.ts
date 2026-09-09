/**
 * Sample data for a fresh database.
 *
 * These rows used to live at the bottom of schema.sql. Clawnify applies that
 * file as DDL only — a single INSERT fails the whole deploy — so the data
 * moved here and is written by ensureSeeded() in index.ts.
 */

export const DEFAULT_SETTINGS: ReadonlyArray<readonly [key: string, value: string]> = [
  ["default_center_lat", "38.7223"],
  ["default_center_lng", "-9.1393"],
  ["default_zoom", "12"],
  ["currency", "USD"],
  ["home_title", "My Trips"],
];

export interface SeedCategory {
  name: string;
  color: string;
  icon: string;
}

// Sights, nature, nightlife — all things to do — collapse into one "Activities".
export const SEED_CATEGORIES: readonly SeedCategory[] = [
  { name: "Food", color: "#EA580C", icon: "utensils" },
  { name: "Activities", color: "#FFFFFF", icon: "camera" },
  { name: "Hotel", color: "#7C3AED", icon: "bed-double" },
  { name: "Shopping", color: "#D97706", icon: "shopping-bag" },
];

export interface SeedPoi {
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  price: number | null;
  currency: string;
  visited: number;
  favorite: number;
  rating: number;
}

export const SEED_POIS: readonly SeedPoi[] = [
  { name: "Belém Tower", category: "Activities", lat: 38.6916, lng: -9.2160, address: "Av. Brasília, Lisbon", price: 8, currency: "EUR", visited: 0, favorite: 1, rating: 5 },
  { name: "Time Out Market", category: "Food", lat: 38.7077, lng: -9.1459, address: "Av. 24 de Julho 49, Lisbon", price: null, currency: "EUR", visited: 0, favorite: 1, rating: 5 },
  { name: "Jerónimos Monastery", category: "Activities", lat: 38.6979, lng: -9.2065, address: "Praça do Império, Lisbon", price: 10, currency: "EUR", visited: 0, favorite: 0, rating: 5 },
  { name: "Alfama", category: "Activities", lat: 38.7128, lng: -9.1287, address: "Alfama, Lisbon", price: null, currency: "EUR", visited: 0, favorite: 1, rating: 4 },
  { name: "LX Factory", category: "Shopping", lat: 38.7016, lng: -9.1786, address: "R. Rodrigues de Faria 103, Lisbon", price: null, currency: "EUR", visited: 0, favorite: 0, rating: 4 },
];

export const SEED_TRIP = {
  title: "3 Days in Lisbon",
  destination: "Lisbon, Portugal",
  start_date: "2026-09-12",
  end_date: "2026-09-14",
  notes: "A first taste of Lisbon — sights, seafood, and sunset miradouros.",
  color: "amber",
} as const;

export interface SeedDay {
  day_index: number;
  date: string;
  title: string;
}

export const SEED_DAYS: readonly SeedDay[] = [
  { day_index: 1, date: "2026-09-12", title: "Belém & the river" },
  { day_index: 2, date: "2026-09-13", title: "Old town & Alfama" },
  { day_index: 3, date: "2026-09-14", title: "Markets & departure" },
];

export interface SeedStop {
  day_index: number;
  poi: string;
  sort_order: number;
  arrive_time: string;
  duration_min: number;
}

export const SEED_STOPS: readonly SeedStop[] = [
  { day_index: 1, poi: "Belém Tower", sort_order: 0, arrive_time: "09:30", duration_min: 90 },
  { day_index: 1, poi: "Jerónimos Monastery", sort_order: 1, arrive_time: "11:30", duration_min: 75 },
  { day_index: 2, poi: "Alfama", sort_order: 0, arrive_time: "10:00", duration_min: 120 },
  { day_index: 3, poi: "Time Out Market", sort_order: 0, arrive_time: "12:30", duration_min: 90 },
];
