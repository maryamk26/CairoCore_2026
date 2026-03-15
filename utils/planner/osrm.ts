import { SPEED_KMH } from "./routeConstants";

export type OsrmResult = {
  distanceKm: number;
  durationMinutes: number;
  profileUsed: string;
} | null;

export async function fetchOsrmRoute(
  start: { lat: number; lng: number },
  places: { latitude: number; longitude: number }[],
  transportMode: string
): Promise<OsrmResult> {
  if (places.length === 0) return null;
  const waypoints = [start, ...places.map((p) => ({ lat: p.latitude, lng: p.longitude }))];
  const coordinates = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");
  const profileForRequest = transportMode === "walk" ? "foot" : "car";
  const url = `https://router.project-osrm.org/route/v1/${profileForRequest}/${coordinates}?overview=simplified`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) {
      if (transportMode === "walk") {
        const carUrl = `https://router.project-osrm.org/route/v1/car/${coordinates}?overview=simplified`;
        const carRes = await fetch(carUrl);
        if (!carRes.ok) return null;
        const carData = await carRes.json();
        if (carData.code !== "Ok" || !carData.routes?.[0]) return null;
        const distanceKm = (carData.routes[0].distance as number) / 1000;
        const durationMinutes = Math.round((distanceKm / SPEED_KMH.walk) * 60);
        return { distanceKm, durationMinutes, profileUsed: "car" };
      }
      return null;
    }
    const route = data.routes[0];
    const distanceKm = (route.distance as number) / 1000;
    let durationMinutes: number;
    if (transportMode === "walk") {
      durationMinutes = Math.round((distanceKm / SPEED_KMH.walk) * 60);
    } else if (transportMode === "motorcycle") {
      durationMinutes = Math.round((distanceKm / SPEED_KMH.motorcycle) * 60);
    } else {
      durationMinutes = Math.round((route.duration as number) / 60);
    }
    return { distanceKm, durationMinutes, profileUsed: profileForRequest };
  } catch {
    return null;
  }
}
