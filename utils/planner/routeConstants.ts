/** Maps route-builder transport chips to OpenRouteService profile names (POST /api/routing). */
export function transportModeToOrsProfile(transportMode: string): string {
  if (transportMode === "walk") return "walking";
  if (transportMode === "motorcycle") return "motorcycle";
  return "driving";
}

export const SPEED_KMH: Record<string, number> = {
  walk: 5,
  car: 60,
  motorcycle: 78,
};

export const ROAD_FACTOR: Record<string, number> = {
  walk: 1.2,
  car: 1.35,
  motorcycle: 1.3,
};

const TIME_OF_DAY_BOUNDS: Record<string, { start: number; end: number; label: string }> = {
  morning: { start: 6 * 60, end: 12 * 60, label: "Morning (6am–12pm)" },
  afternoon: { start: 12 * 60, end: 18 * 60, label: "Afternoon (12pm–6pm)" },
  evening: { start: 18 * 60, end: 22 * 60, label: "Evening (6pm–10pm)" },
  night: { start: 22 * 60, end: 24 * 60, label: "Night (10pm+)" },
};

export function getPreferredWindow(
  timeOfDay: string[] | undefined
): { minutes: number; label: string } | null {
  if (!timeOfDay || timeOfDay.length === 0) return null;
  let minStart = 24 * 60;
  let maxEnd = 0;
  const labels: string[] = [];
  for (const key of timeOfDay) {
    const b = TIME_OF_DAY_BOUNDS[key];
    if (!b) continue;
    if (b.start < minStart) minStart = b.start;
    if (b.end > maxEnd) maxEnd = b.end;
    if (!labels.includes(b.label)) labels.push(b.label);
  }
  if (maxEnd <= minStart) return null;
  return { minutes: maxEnd - minStart, label: labels.join(" / ") };
}
