import { NextRequest, NextResponse } from "next/server";
import { getPlaceSuggestions } from "@/lib/places/search";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    const places = await getPlaceSuggestions(q);

    return NextResponse.json({
      places,
    });
  } catch (error) {
    console.error("Places list error:", error);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}
