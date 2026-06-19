import {
  MapPin,
  Utensils,
  Landmark,
  BedDouble,
  Trees,
  Wine,
  ShoppingBag,
  Coffee,
  Camera,
  Mountain,
  Waves,
  Plane,
  Train,
  Building2,
  Music,
  Beer,
  type LucideIcon,
} from "lucide-react";

/** lucide icon names a category may use, mapped to their components.
 *  Falls back to MapPin for anything unknown so the data never breaks the UI. */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "map-pin": MapPin,
  utensils: Utensils,
  landmark: Landmark,
  "bed-double": BedDouble,
  trees: Trees,
  wine: Wine,
  "shopping-bag": ShoppingBag,
  coffee: Coffee,
  camera: Camera,
  mountain: Mountain,
  waves: Waves,
  plane: Plane,
  train: Train,
  building: Building2,
  music: Music,
  beer: Beer,
};

/** The icon names offered in the category editor, in display order. */
export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICONS);

export function categoryIcon(name: string | null | undefined): LucideIcon {
  return CATEGORY_ICONS[name ?? "map-pin"] ?? MapPin;
}
