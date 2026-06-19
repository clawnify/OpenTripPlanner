import { useState, useEffect, useCallback } from "react";

export type Route =
  | { name: "map" }
  | { name: "trips" }
  | { name: "trip"; id: number }
  | { name: "places" }
  | { name: "categories" }
  | { name: "settings" }
  | { name: "not-found" };

function parse(path: string): Route {
  if (path === "/" || path === "/map") return { name: "map" };
  if (path === "/trips") return { name: "trips" };
  const m = path.match(/^\/trips\/(\d+)$/);
  if (m) return { name: "trip", id: parseInt(m[1], 10) };
  if (path === "/places") return { name: "places" };
  if (path === "/categories") return { name: "categories" };
  if (path === "/settings") return { name: "settings" };
  return { name: "not-found" };
}

export function useRouter() {
  const [path, setPath] = useState<string>(() => window.location.pathname);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname) return;
    window.history.pushState(null, "", to);
    setPath(to);
  }, []);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return { path, route: parse(path), navigate };
}
