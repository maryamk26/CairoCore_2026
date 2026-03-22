import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server";
import { getFollowLists } from "@/lib/db/user";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lists = await getFollowLists(user.id);
    return NextResponse.json(lists);
  } catch (err) {
    console.error("Profile follow lists fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch follow lists" },
      { status: 500 }
    );
  }
}
