import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { createSavedRoute, listSavedRoutesByUserId } from "@/lib/db/savedRoute";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const routes = await listSavedRoutesByUserId(user.id);
    return NextResponse.json({ routes });
  } catch (err) {
    console.error("Saved routes fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch saved routes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const placeIds = Array.isArray(body.placeIds)
      ? body.placeIds.filter((id: unknown): id is string => typeof id === "string")
      : [];
    const transportMode =
      typeof body.transportMode === "string" ? body.transportMode : null;

    const route = await createSavedRoute(user.id, placeIds, transportMode);
    return NextResponse.json(
      {
        route: {
          id: route.id,
          name: route.name,
          createdAt: route.createdAt,
          transportMode: route.transportMode,
          stopCount: route.stopCount,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to save route";
    const status =
      message === "At least one place is required" ||
      message === "No valid places were provided"
        ? 400
        : 500;

    if (status === 500) {
      console.error("Save route failed:", err);
    }

    return NextResponse.json({ error: message }, { status });
  }
}
