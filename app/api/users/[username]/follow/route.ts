import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import {
  decodeUsernamePathSegment,
  followUser,
  getProfileByUsername,
  unfollowUser,
} from "@/lib/db/user";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;
    const profile = await getProfileByUsername(decodeUsernamePathSegment(username));
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as { action?: string };

    if (body.action === "unfollow") {
      const result = await unfollowUser(user.id, profile.id);
      return NextResponse.json({
        following: false,
        followerCountDelta: result.count > 0 ? -1 : 0,
      });
    }

    if (profile.id === user.id) {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }

    const result = await followUser(user.id, profile.id);
    const followerCountDelta = result.created ? 1 : 0;

    return NextResponse.json({
      following: true,
      followerCountDelta,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "SELF_FOLLOW") {
      return NextResponse.json(
        { error: "You cannot follow yourself" },
        { status: 400 }
      );
    }
    console.error("Follow failed:", err);
    return NextResponse.json({ error: "Failed to follow" }, { status: 500 });
  }
}
