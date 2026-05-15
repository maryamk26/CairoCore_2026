import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { optimizeRouteFromLocation } from "@/utils/algorithms/routeOptimization";

const MAX_STOPS = 100;

function okLat(n: number) {
  return Number.isFinite(n) && n >= -90 && n <= 90;
}

function okLng(n: number) {
  return Number.isFinite(n) && n >= -180 && n <= 180;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      userLocation?: { lat?: unknown; lng?: unknown };
      stops?: unknown;
    } | null;

    if (!body?.userLocation || !Array.isArray(body.stops)) {
      return NextResponse.json(
        { error: "userLocation and stops array are required" },
        { status: 400 }
      );
    }

    const lat = Number(body.userLocation.lat);
    const lng = Number(body.userLocation.lng);
    if (!okLat(lat) || !okLng(lng)) {
      return NextResponse.json({ error: "Invalid userLocation coordinates" }, { status: 400 });
    }

    const rawStops = body.stops;
    if (rawStops.length === 0) {
      return NextResponse.json({ error: "At least one stop is required" }, { status: 400 });
    }
    if (rawStops.length > MAX_STOPS) {
      return NextResponse.json({ error: `At most ${MAX_STOPS} stops allowed` }, { status: 400 });
    }

    const stops: { id: string; lat: number; lng: number }[] = [];
    for (let i = 0; i < rawStops.length; i++) {
      const s = rawStops[i];
      if (!s || typeof s !== "object") {
        return NextResponse.json({ error: `Invalid stop at index ${i}` }, { status: 400 });
      }
      const o = s as Record<string, unknown>;
      const slat = Number(o.lat);
      const slng = Number(o.lng);
      if (!okLat(slat) || !okLng(slng)) {
        return NextResponse.json(
          { error: `Invalid coordinates for stop at index ${i}` },
          { status: 400 }
        );
      }
      const id = typeof o.id === "string" ? o.id : `stop-${i}`;
      stops.push({ id, lat: slat, lng: slng });
    }

    const result = optimizeRouteFromLocation(stops, { lat, lng });

    const n = stops.length;
    const seen = new Set(result.order);
    if (
      result.order.length !== n ||
      result.order.some((i) => !Number.isInteger(i) || i < 0 || i >= n) ||
      seen.size !== n
    ) {
      return NextResponse.json(
        { error: "Optimization produced an invalid order" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order: result.order,
      totalDistance: result.totalDistance,
      estimatedTime: result.estimatedTime,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to optimize route" }, { status: 500 });
  }
}
