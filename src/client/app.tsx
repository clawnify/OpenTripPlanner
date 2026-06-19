import { useEffect, useMemo } from "react";
import { useAppState } from "./hooks/use-app-state";
import { useRouter } from "./hooks/use-router";
import { AppContext } from "./context";
import { Sidebar } from "./components/sidebar";
import { ErrorBanner } from "./components/error-banner";
import { MapPage } from "./components/map/map-page";
import { TripsList } from "./components/trips/trips-list";
import { TripPage } from "./components/trips/trip-page";
import { PlacesPage } from "./components/places/places-page";
import { CategoriesPage } from "./components/categories/categories-page";
import { SettingsPage } from "./components/settings/settings-page";

export function App() {
  const state = useAppState();
  const { route, navigate } = useRouter();

  // Agent dual-mode: ?agent or ?mode=agent flips data-agent on <html>.
  const isAgent = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.has("agent") || params.get("mode") === "agent";
  }, []);
  useEffect(() => {
    if (isAgent) document.documentElement.setAttribute("data-agent", "");
  }, [isAgent]);

  return (
    <AppContext.Provider value={state}>
      <div className="flex h-screen min-h-0 overflow-hidden">
        <Sidebar route={route} navigate={navigate} />
        <main className="flex flex-1 flex-col overflow-hidden">
          {state.loading ? (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Loading…
            </div>
          ) : (
            <>
              {route.name === "map" && <MapPage />}
              {route.name === "trips" && <TripsList navigate={navigate} />}
              {route.name === "trip" && <TripPage id={route.id} navigate={navigate} />}
              {route.name === "places" && <PlacesPage />}
              {route.name === "categories" && <CategoriesPage />}
              {route.name === "settings" && <SettingsPage />}
              {route.name === "not-found" && (
                <Placeholder title="Not found" message="That page doesn't exist." />
              )}
            </>
          )}
        </main>
        <ErrorBanner />
      </div>
    </AppContext.Provider>
  );
}

function Placeholder({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-12 text-center">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
