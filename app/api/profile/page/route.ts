import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { ensureProfile, listCreatedPlacesByUserId } from "@/lib/db/user";
import { getFoldersByUserId } from "@/lib/db/folder";
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const profile = await ensureProfile(userId, user.email);

    const [placesRows, foldersRows] = await Promise.all([
      listCreatedPlacesByUserId(userId),
      getFoldersByUserId(userId),
    ]);

    return NextResponse.json({
      profile,
      places: placesRows,
      folders: foldersRows.map((f) => ({
        id: f.id,
        name: f.name,
        pinCount: f._count.savedPlaces,
        createdAt: f.createdAt,
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Email required") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Profile not found") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Profile page fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to load profile" },
      { status: 500 }
    );
  }
}
