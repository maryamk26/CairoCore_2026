import { transportModeToOrsProfile } from "@/utils/planner/routeConstants";

export type OrsRouteGeometryResult = {
  distanceKm: number;
  durationMinutes: number;
  routeCoordinates: [number, number][];
} | null;

export async function fetchOrsRouteGeometry(options: {
  start: { lat: number; lng: number };
  stops: { latitude: number; longitude: number }[];
  transportMode: string;
}): Promise<OrsRouteGeometryResult> {
  const { start, stops, transportMode } = options;
  if (stops.length === 0) return null;

  const coordinates: [number, number][] = [
    [start.lng, start.lat],
    ...stops.map((p) => [p.longitude, p.latitude] as [number, number]),
  ];

  try {
    const res = await fetch("/api/routing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coordinates,
        profile: transportModeToOrsProfile(transportMode || "car"),
        instructions: false,
      }),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      distance?: number;
      duration?: number;
      coordinates?: [number, number][];
    };

    const routeCoordinates = data.coordinates;
    if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) return null;

    return {
      distanceKm: (data.distance ?? 0) / 1000,
      durationMinutes: Math.round((data.duration ?? 0) / 60),
      routeCoordinates,
    };
  } catch {
    return null;
  }
}
