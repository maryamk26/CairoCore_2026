import { NextRequest, NextResponse } from "next/server";
import { searchProfiles } from "@/lib/db/user";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.searchParams.get("q") ?? "";
    const users = await searchProfiles(query, 10);
    return NextResponse.json({ users });
  } catch (err) {
    console.error("User search failed:", err);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
