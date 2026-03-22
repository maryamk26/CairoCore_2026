import { NextResponse } from "next/server";
import { getProfileByUsername, listCreatedPlacesByUserId } from "@/lib/db/user";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const profile = await getProfileByUsername(username);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const places = await listCreatedPlacesByUserId(profile.id);

    return NextResponse.json({
      profile,
      places,
    });
  } catch (err) {
    console.error("Public profile page fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
