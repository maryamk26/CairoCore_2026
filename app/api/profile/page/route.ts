import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getProfile, upsertUser } from "@/lib/db/user";
import { getFoldersByUserId } from "@/lib/db/folder";

/**
 * Single endpoint for the profile page: returns profile + places + folders
 * in one round-trip so the page loads faster (one auth check, one response).
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Fetch profile; if missing, upsert user then fetch again
    let profile = await getProfile(userId);
    if (!profile) {
      const email = user.email?.trim() || "";
      if (!email) {
        return NextResponse.json(
          { error: "Email required" },
          { status: 400 }
        );
      }
      await upsertUser(userId, email);
      profile = await getProfile(userId);
    }
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    // In parallel: get places and folders (profile already done)
    const [placesRows, foldersRows] = await Promise.all([
      prisma.place.findMany({
        where: { createdBy: userId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          address: true,
          createdAt: true,
          images: true,
        },
      }),
      getFoldersByUserId(userId),
    ]);

    const name =
      profile.name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.first_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User";
    const username =
      profile.username ||
      user.user_metadata?.user_name ||
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      "";

    return NextResponse.json({
      profile: {
        name,
        username: username
          ? username.startsWith("@")
            ? username
            : `@${username}`
          : `@${profile.email?.split("@")[0] || "user"}`,
        followerCount: profile.followerCount,
        followingCount: profile.followingCount,
      },
      places: placesRows.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        address: p.address,
        createdAt: p.createdAt,
        images: p.images ?? [],
      })),
      folders: foldersRows.map((f) => ({
        id: f.id,
        name: f.name,
        pinCount: f._count.savedPlaces,
        createdAt: f.createdAt,
      })),
    });
  } catch (err) {
    console.error("Profile page fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
