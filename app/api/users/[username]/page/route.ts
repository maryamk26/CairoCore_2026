import { NextResponse } from "next/server";
import {
  decodeUsernamePathSegment,
  getProfileByUsername,
  isUserFollowing,
  listCreatedPlacesByUserId,
} from "@/lib/db/user";
import { getSessionUser } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const profile = await getProfileByUsername(decodeUsernamePathSegment(username));

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const places = await listCreatedPlacesByUserId(profile.id);

    const sessionUser = await getSessionUser();
    const isViewerOwner = !!(sessionUser && sessionUser.id === profile.id);

    let viewerFollows: boolean | null = null;
    if (sessionUser && !isViewerOwner) {
      viewerFollows = await isUserFollowing(sessionUser.id, profile.id);
    }

    return NextResponse.json({
      profile,
      places,
      viewerFollows,
      isViewerOwner,
    });
  } catch (err) {
    console.error("Public profile page fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
