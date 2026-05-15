import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { getSavedRouteById } from "@/lib/db/savedRoute";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const route = await getSavedRouteById(id, user.id);
    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    return NextResponse.json({
      route: {
        id: route.id,
        name: route.name,
        createdAt: route.createdAt,
        transportMode: route.transportMode,
        stopCount: route.stopCount,
      },
      places: route.places,
    });
  } catch (err) {
    console.error("Saved route fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch saved route" }, { status: 500 });
  }
}
