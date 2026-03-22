import { NextResponse } from "next/server";
import { getFollowLists, getProfileByUsername } from "@/lib/db/user";

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

    const lists = await getFollowLists(profile.id);
    return NextResponse.json(lists);
  } catch (err) {
    console.error("Public follow lists fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch follow lists" },
      { status: 500 }
    );
  }
}
