const ORS_BASE = "https://api.openrouteservice.org/v2/directions";
const ORS_SNAP_BASE = "https://api.openrouteservice.org/v2/snap";

const SNAP_RADIUS_METERS = 5000;

const ORS_PROFILE_MAP: Record<string, string> = {
  driving: "driving-car",
  walking: "foot-walking",
  motorcycle: "driving-motorcycle",
  cycling: "cycling-regular",
};

import { transportModeToOrsProfile } from "@/utils/planner/routeConstants";

export function transportModeToRoutingProfile(transportMode: string): string {
  return transportModeToOrsProfile(transportMode);
}

export interface RoutingStep {
  instruction: string;
  distance: number;
  duration: number;
  location: [number, number];
  type?: number;
}

export interface RouteLeg {
  distance: number;
  duration: number;
}

export interface RoutingResponse {
  distance: number;
  duration: number;
  coordinates: [number, number][];
  steps: RoutingStep[];
  legs: RouteLeg[];
}

type LngLat = [number, number];

function orsHeaders(key: string): HeadersInit {
  return { Authorization: key, "Content-Type": "application/json" };
}

function lngLatToLatLng([lng, lat]: LngLat): [number, number] {
  return [lat, lng];
}

function haversineMeters(a: LngLat, b: LngLat): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(x)));
}

function appendPath(merged: [number, number][], segment: [number, number][]) {
  for (const pt of segment) {
    const prev = merged[merged.length - 1];
    if (prev && prev[0] === pt[0] && prev[1] === pt[1]) continue;
    merged.push(pt);
  }
}

async function snapCoordinatesToRoad(
  coordinates: LngLat[],
  orsProfile: string,
  key: string
): Promise<LngLat[]> {
  if (coordinates.length === 0) return [];
  const url = `${ORS_SNAP_BASE}/${orsProfile}/geojson`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: orsHeaders(key),
      body: JSON.stringify({ locations: coordinates, radius: SNAP_RADIUS_METERS }),
    });
    if (!res.ok) return coordinates;
    const data = (await res.json()) as {
      features?: { geometry?: { coordinates?: LngLat } }[];
    };
    const features = data.features ?? [];
    return coordinates.map((orig, i) => {
      const snapped = features[i]?.geometry?.coordinates;
      return Array.isArray(snapped) && snapped.length === 2 ? (snapped as LngLat) : orig;
    });
  } catch {
    return coordinates;
  }
}

type ParsedRoute = {
  distance: number;
  duration: number;
  coordinatesLatLng: [number, number][];
  steps: RoutingStep[];
  legs: RouteLeg[];
};

function parseOrsDirectionsFeature(
  feature: {
    geometry?: { coordinates?: LngLat[] };
    properties?: {
      summary?: { distance: number; duration: number };
      segments?: {
        steps: {
          instruction?: string;
          type?: number;
          distance: number;
          duration: number;
          way_points: [number, number];
        }[];
        distance?: number;
        duration?: number;
      }[];
    };
  },
  includeInstructions: boolean
): ParsedRoute | null {
  const rawCoords = feature.geometry?.coordinates;
  if (!Array.isArray(rawCoords) || rawCoords.length < 2) return null;

  const coords = rawCoords as LngLat[];
  const segments = feature.properties?.segments ?? [];
  const steps: RoutingStep[] = [];

  if (includeInstructions && segments.length > 0) {
    for (const seg of segments) {
      for (const step of seg.steps ?? []) {
        const [startIdx] = step.way_points;
        const pt = coords[startIdx];
        steps.push({
          instruction: step.instruction ?? "Continue",
          distance: step.distance,
          duration: step.duration,
          location: pt ? lngLatToLatLng(pt) : [0, 0],
          type: step.type,
        });
      }
    }
  }

  const summary = feature.properties?.summary;
  const legs: RouteLeg[] =
    segments.length > 0
      ? segments.map((seg) => ({
          distance: seg.distance ?? (seg.steps ?? []).reduce((s, st) => s + st.distance, 0),
          duration: seg.duration ?? (seg.steps ?? []).reduce((s, st) => s + st.duration, 0),
        }))
      : summary
        ? [{ distance: summary.distance, duration: summary.duration }]
        : [];

  return {
    distance: summary?.distance ?? 0,
    duration: summary?.duration ?? 0,
    coordinatesLatLng: coords.map(lngLatToLatLng),
    steps,
    legs,
  };
}

async function requestOrsDirections(
  coordinates: LngLat[],
  orsProfile: string,
  key: string,
  instructions: boolean
): Promise<ParsedRoute | null> {
  const url = `${ORS_BASE}/${orsProfile}/geojson`;
  const res = await fetch(url, {
    method: "POST",
    headers: orsHeaders(key),
    body: JSON.stringify({
      coordinates,
      instructions,
      instructions_format: "text",
      radiuses: coordinates.map(() => SNAP_RADIUS_METERS),
    }),
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { features?: Parameters<typeof parseOrsDirectionsFeature>[0][] };
  const feature = data.features?.[0];
  if (!feature) return null;
  return parseOrsDirectionsFeature(feature, instructions);
}

async function fetchDirectionsLegByLeg(
  coordinates: LngLat[],
  orsProfile: string,
  key: string,
  instructions: boolean
): Promise<ParsedRoute | null> {
  const merged: [number, number][] = [];
  const legs: RouteLeg[] = [];
  const steps: RoutingStep[] = [];
  let totalDistance = 0;
  let totalDuration = 0;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const from = coordinates[i]!;
    const to = coordinates[i + 1]!;
    const leg = await requestOrsDirections([from, to], orsProfile, key, instructions);

    if (leg && leg.coordinatesLatLng.length >= 2) {
      appendPath(merged, leg.coordinatesLatLng);
      legs.push({ distance: leg.distance, duration: leg.duration });
      totalDistance += leg.distance;
      totalDuration += leg.duration;
      if (instructions) steps.push(...leg.steps);
    } else {
      appendPath(merged, [lngLatToLatLng(from), lngLatToLatLng(to)]);
      const dist = haversineMeters(from, to);
      const duration = dist / 8;
      legs.push({ distance: dist, duration });
      totalDistance += dist;
      totalDuration += duration;
    }
  }

  if (merged.length < 2) return null;
  return {
    distance: totalDistance,
    duration: totalDuration,
    coordinatesLatLng: merged,
    steps,
    legs,
  };
}

export async function fetchDirectionsFromOrs(
  coordinates: LngLat[],
  profile: string,
  options?: { instructions?: boolean }
): Promise<RoutingResponse | null> {
  const key = process.env.OPENROUTESERVICE_API_KEY?.trim();
  if (!key) return null;
  if (coordinates.length < 2) return null;

  const orsProfile = ORS_PROFILE_MAP[profile] || ORS_PROFILE_MAP.driving;
  const instructions = options?.instructions !== false;
  const snapped = await snapCoordinatesToRoad(coordinates, orsProfile, key);

  const parsed =
    (await requestOrsDirections(snapped, orsProfile, key, instructions)) ??
    (await fetchDirectionsLegByLeg(snapped, orsProfile, key, instructions));

  if (!parsed) return null;

  return {
    distance: parsed.distance,
    duration: parsed.duration,
    coordinates: parsed.coordinatesLatLng,
    steps: parsed.steps,
    legs: parsed.legs,
  };
}

export function straightLineRouteLatLng(coordinatesLngLat: LngLat[]): [number, number][] {
  return coordinatesLngLat.map(lngLatToLatLng);
}
