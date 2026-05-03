import { NextRequest, NextResponse } from "next/server";
import { SPEED_KMH } from "@/utils/planner/routeConstants";

type OsrmRouteResponse = {
  code?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { coordinates?: [number, number][] };
  }>;
};

async function fetchOsrmByProfile(
  coordinates: string,
  profile: "car" | "foot"
): Promise<OsrmRouteResponse | null> {
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=full&geometries=geojson`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  return (await res.json()) as OsrmRouteResponse;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      start?: { lat?: number; lng?: number };
      places?: Array<{ latitude?: number; longitude?: number }>;
      transportMode?: string;
    };

    if (!body?.start || !Array.isArray(body.places) || body.places.length === 0) {
      return NextResponse.json({ result: null }, { status: 400 });
    }

    const startLat = Number(body.start.lat);
    const startLng = Number(body.start.lng);
    if (!Number.isFinite(startLat) || !Number.isFinite(startLng)) {
      return NextResponse.json({ result: null }, { status: 400 });
    }

    const points = [{ lat: startLat, lng: startLng }];
    for (const p of body.places) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        return NextResponse.json({ result: null }, { status: 400 });
      }
      points.push({ lat, lng });
    }

    const transportMode = body.transportMode ?? "";
    const coordinates = points.map((p) => `${p.lng},${p.lat}`).join(";");
    const profileForRequest: "car" | "foot" =
      transportMode === "walk" ? "foot" : "car";

    const data = await fetchOsrmByProfile(coordinates, profileForRequest);
    if (!data?.routes?.[0] || data.code !== "Ok") {
      if (transportMode === "walk") {
        const carData = await fetchOsrmByProfile(coordinates, "car");
        if (!carData?.routes?.[0] || carData.code !== "Ok") {
          return NextResponse.json({ result: null }, { status: 502 });
        }
        const distanceKm = carData.routes[0].distance / 1000;
        const durationMinutes = Math.round((distanceKm / SPEED_KMH.walk) * 60);
        const routeCoordinates = (
          carData.routes[0].geometry?.coordinates ?? []
        ).map(([lng, lat]) => [lat, lng] as [number, number]);
        return NextResponse.json({
          result: {
            distanceKm,
            durationMinutes,
            profileUsed: "car",
            routeCoordinates,
          },
        });
      }
      return NextResponse.json({ result: null }, { status: 502 });
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000;
    const routeCoordinates = (route.geometry?.coordinates ?? []).map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );
    let durationMinutes: number;

    if (transportMode === "walk") {
      durationMinutes = Math.round((distanceKm / SPEED_KMH.walk) * 60);
    } else if (transportMode === "motorcycle") {
      durationMinutes = Math.round((distanceKm / SPEED_KMH.motorcycle) * 60);
    } else {
      durationMinutes = Math.round(route.duration / 60);
    }

    return NextResponse.json({
      result: {
        distanceKm,
        durationMinutes,
        profileUsed: profileForRequest,
        routeCoordinates,
      },
    });
  } catch {
    return NextResponse.json({ result: null }, { status: 500 });
  }
}
