import { createClient } from "@/lib/supabase/server";
import { upsertUser } from "@/lib/db/user";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      password?: unknown;
    } | null;
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json(
        { error: error.message || "Invalid email or password" },
        { status: 401 }
      );
    }
    if (!data.session) {
      return NextResponse.json({ error: "Sign-in failed" }, { status: 401 });
    }

    if (data.user?.email) {
      try {
        await upsertUser(data.user.id, data.user.email, {
          name:
            typeof data.user.user_metadata?.name === "string"
              ? data.user.user_metadata.name
              : undefined,
          username:
            typeof data.user.user_metadata?.username === "string"
              ? data.user.user_metadata.username
              : undefined,
        });
      } catch (syncError) {
        console.error("sign-in profile sync failed:", syncError);
        await supabase.auth.signOut();
        return NextResponse.json(
          {
            error: "Signed in but profile sync failed. Check database connectivity and try again.",
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}
