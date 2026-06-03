import { calculateDistance } from "@/utils/algorithms/distance";

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  return calculateDistance({ lat: lat1, lng: lon1 }, { lat: lat2, lng: lon2 });
}

export function orsTypeToManeuver(type?: number): { type: string; modifier?: string } {
  if (type === 10) return { type: "arrive" };
  if (type === 11) return { type: "depart" };
  const modifiers: (string | undefined)[] = [
    "left",
    "right",
    "sharp left",
    "sharp right",
    "slight left",
    "slight right",
    "straight",
    undefined,
    undefined,
    "u-turn",
    undefined,
    undefined,
    "left",
    "right",
  ];
  return { type: "turn", modifier: modifiers[type ?? 6] };
}
