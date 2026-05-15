import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { ensureProfile, updateUserProfile } from "@/lib/db/user";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await ensureProfile(user.id, user.email);

    return NextResponse.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      username: profile.username,
      usernameRaw: profile.usernameRaw,
      followerCount: profile.followerCount,
      followingCount: profile.followingCount,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Email required") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Profile not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Profile fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name.trim() || null : undefined;
    const username = typeof body.username === "string" ? body.username.trim() || null : undefined;

    await updateUserProfile(user.id, {
      ...(name !== undefined && { name }),
      ...(username !== undefined && { username }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile update failed:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
