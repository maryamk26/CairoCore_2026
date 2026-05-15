import { getSessionUser } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        emailVerified: !!user.email_confirmed_at,
        metadata: user.user_metadata,
        createdAt: user.created_at,
      },
    });
  } catch {
    return NextResponse.json(
      { authenticated: false, user: null, error: "session_unavailable" },
      { status: 503 }
    );
  }
}
