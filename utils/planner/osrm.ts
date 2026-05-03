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
  try {
    const res = await fetch("/api/routing/osrm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start, places, transportMode }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: OsrmResult };
    return data.result ?? null;
  } catch {
    return null;
  }
}
