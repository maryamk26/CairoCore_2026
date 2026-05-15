import { NextRequest, NextResponse } from "next/server";

const ORS_BASE = "https://api.openrouteservice.org/v2/directions";

const PROFILE_MAP: Record<string, string> = {
  driving: "driving-car",
  walking: "foot-walking",
  cycling: "cycling-regular",
};

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

async function fetchORS(
  coordinates: [number, number][],
  profile: string
): Promise<RoutingResponse | null> {
  const key = process.env.OPENROUTESERVICE_API_KEY;
  if (!key) return null;

  const orsProfile = PROFILE_MAP[profile] || "driving-car";
  const url = `${ORS_BASE}/${orsProfile}/geojson`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      coordinates,
      instructions: true,
      instructions_format: "text",
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature?.geometry?.coordinates || !feature?.properties?.segments) return null;

  const coords = feature.geometry.coordinates as [number, number][];
  const segments = feature.properties.segments as {
    steps: {
      instruction?: string;
      type?: number;
      distance: number;
      duration: number;
      way_points: [number, number];
    }[];
  }[];

  const steps: RoutingStep[] = [];
  for (const seg of segments) {
    for (const step of seg.steps) {
      const [startIdx] = step.way_points;
      const pt = coords[startIdx];
      steps.push({
        instruction: step.instruction ?? "Continue",
        distance: step.distance,
        duration: step.duration,
        location: pt ? [pt[1], pt[0]] : [0, 0],
        type: step.type,
      });
    }
  }

  const summary = feature.properties.summary as { distance: number; duration: number } | undefined;
  const legs: RouteLeg[] = segments.map((seg) => {
    const d =
      (seg as { distance?: number }).distance ?? seg.steps.reduce((s, st) => s + st.distance, 0);
    const t =
      (seg as { duration?: number }).duration ?? seg.steps.reduce((s, st) => s + st.duration, 0);
    return { distance: d, duration: t };
  });
  return {
    distance: summary?.distance ?? 0,
    duration: summary?.duration ?? 0,
    coordinates: coords.map(([lng, lat]) => [lat, lng]),
    steps,
    legs,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coordinates, profile = "driving" } = body as {
      coordinates?: [number, number][];
      profile?: string;
    };

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json({ error: "At least two coordinates required" }, { status: 400 });
    }

    const result = await fetchORS(coordinates, profile);
    if (!result) {
      return NextResponse.json({ error: "Routing failed" }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Routing request failed" }, { status: 500 });
  }
}
