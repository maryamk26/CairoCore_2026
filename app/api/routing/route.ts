import { NextRequest, NextResponse } from "next/server";

import { fetchDirectionsFromOrs } from "@/lib/routing/openRouteService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      coordinates,
      profile = "driving",
      instructions,
    } = body as {
      coordinates?: [number, number][];
      profile?: string;
      instructions?: boolean;
    };

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return NextResponse.json({ error: "At least two coordinates required" }, { status: 400 });
    }

    if (!process.env.OPENROUTESERVICE_API_KEY?.trim()) {
      return NextResponse.json(
        { error: "OPENROUTESERVICE_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const result = await fetchDirectionsFromOrs(coordinates, profile, {
      instructions: instructions !== false,
    });
    if (!result) {
      return NextResponse.json({ error: "Routing failed" }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Routing request failed" }, { status: 500 });
  }
}
