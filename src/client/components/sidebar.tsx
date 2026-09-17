import {
  Map as MapIcon,
  Route as RouteIcon,
  MapPin,
  Tags,
  Settings,
  Compass,
} from "lucide-react";
import { AppNav, embedded } from "@clawnify/app/client";
import { cn } from "@/lib/utils";
import type { Route } from "@/hooks/use-router";

interface NavItem {
  id: string;
  hostIcon: string;
  label: string;
  icon: typeof MapIcon;
  path: string;
  match: (r: Route) => boolean;
}

const sections: { heading: string; items: NavItem[] }[] = [
  {
    heading: "Plan",
    items: [
      { id: "map", hostIcon: "map", label: "Map",    icon: MapIcon,   path: "/map",    match: (r) => r.name === "map" },
      { id: "trips", hostIcon: "calendar-days", label: "Trips",  icon: RouteIcon, path: "/trips",  match: (r) => r.name === "trips" || r.name === "trip" },
      { id: "places", hostIcon: "star", label: "Places", icon: MapPin,    path: "/places", match: (r) => r.name === "places" },
    ],
  },
  {
    heading: "Manage",
    items: [
      { id: "categories", hostIcon: "tag", label: "Categories", icon: Tags,     path: "/categories", match: (r) => r.name === "categories" },
      { id: "settings", hostIcon: "settings", label: "Settings",   icon: Settings, path: "/settings",   match: (r) => r.name === "settings" },
    ],
  },
];

export function Sidebar({
  route,
  navigate,
}: {
  route: Route;
  navigate: (to: string) => void;
}) {
  if (embedded) {
    const active = sections.flatMap((s) => s.items).find((item) => item.match(route))?.id;
    return (
      <AppNav
        title="Trip Planner"
        icon="map"
        active={active}
        groups={sections.map((section, i) => ({
          // The host already names the app, so the first group stays unlabelled.
          label: i === 0 ? undefined : section.heading,
          items: section.items.map((item) => ({
            id: item.id,
            label: item.label,
            href: item.path,
            icon: item.hostIcon,
            home: item.id === "map",
          })),
        }))}
        onNavigate={(item) => item.href && navigate(item.href)}
      />
    );
  }
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Compass className="h-4 w-4" />
        </div>
        <span className="text-base font-semibold tracking-tight">OpenTripPlanner</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {sections.map((section) => (
          <div key={section.heading} className="mb-4">
            <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {section.heading}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.match(route);
                return (
                  <li key={item.label}>
                    <button
                      type="button"
                      onClick={() => navigate(item.path)}
                      aria-label={item.label}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active && "bg-sidebar-accent text-sidebar-accent-foreground",
                        !active && "hover:bg-sidebar-accent/60",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
