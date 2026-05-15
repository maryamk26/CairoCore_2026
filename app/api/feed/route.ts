import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { getFeedForUser } from "@/lib/db/feed";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cursor = request.nextUrl.searchParams.get("cursor");
    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : null;

    const feed = await getFeedForUser(user.id, cursor, limit);
    return NextResponse.json(feed);
  } catch (err) {
    console.error("Feed fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch feed" }, { status: 500 });
  }
}
