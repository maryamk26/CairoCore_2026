import type { PlaceRecommendation } from "@/utils/planner/recommendation";
import { calculateDistance } from "@/utils/algorithms/distance";
import { SPEED_KMH, ROAD_FACTOR } from "./routeConstants";

export type RouteStopWhen = "beginning" | "middle" | "end";

export interface UserLocation {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
}

export function insertStopIntoRoute(
  mainPlaces: PlaceRecommendation[],
  stop: PlaceRecommendation,
  when: RouteStopWhen
): PlaceRecommendation[] {
  if (mainPlaces.length === 0) return [stop];
  const n = mainPlaces.length;
  const insertIndex = when === "beginning" ? 0 : when === "middle" ? Math.floor(n / 2) : n;
  return [...mainPlaces.slice(0, insertIndex), stop, ...mainPlaces.slice(insertIndex)];
}

export function getStopDisplayIndex(
  orderedPlacesLength: number,
  routeStopWhen: RouteStopWhen
): number {
  return routeStopWhen === "beginning"
    ? 0
    : routeStopWhen === "middle"
      ? Math.floor(orderedPlacesLength / 2)
      : orderedPlacesLength;
}

export function displayIndexToMainIndex(
  displayIndex: number,
  routeStop: PlaceRecommendation | null,
  stopDisplayIndex: number,
  routeStopWhen: RouteStopWhen
): number | null {
  if (!routeStop || stopDisplayIndex < 0) return displayIndex;
  if (displayIndex === stopDisplayIndex) return null;
  if (routeStopWhen === "beginning") return displayIndex - 1;
  if (routeStopWhen === "end") return displayIndex;
  return displayIndex < stopDisplayIndex ? displayIndex : displayIndex - 1;
}

export type TripStats = {
  totalDistance: number;
  travelTime: number;
  totalTime: number;
};

export function calculateTripStats(
  userLocation: UserLocation | null,
  placesWithStop: PlaceRecommendation[],
  transportMode: string,
  minutesPerPlace: number
): TripStats {
  if (!userLocation || placesWithStop.length === 0 || !transportMode) {
    return { totalDistance: 0, totalTime: 0, travelTime: 0 };
  }
  let totalDistance = 0;
  let previousLocation = userLocation;
  placesWithStop.forEach((place) => {
    const distance = calculateDistance(
      { lat: previousLocation.lat, lng: previousLocation.lng },
      { lat: place.latitude, lng: place.longitude }
    );
    totalDistance += Number.isFinite(distance) ? distance : 0;
    previousLocation = { lat: place.latitude, lng: place.longitude };
  });
  const factor = ROAD_FACTOR[transportMode] ?? 1.35;
  const roadDistanceKm = totalDistance * factor;
  const speed = SPEED_KMH[transportMode] ?? 60;
  const travelTimeMinutes = Math.round((roadDistanceKm / speed) * 60);
  const visitTimeMinutes = placesWithStop.length * minutesPerPlace;
  const totalTimeMinutes = travelTimeMinutes + visitTimeMinutes;
  const safe = (n: number) => (Number.isFinite(n) ? n : 0);
  return {
    totalDistance: safe(Math.round(roadDistanceKm * 10) / 10),
    travelTime: safe(travelTimeMinutes),
    totalTime: safe(totalTimeMinutes),
  };
}
