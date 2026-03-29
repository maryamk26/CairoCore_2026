import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
      password?: unknown;
      firstName?: unknown;
      lastName?: unknown;
      redirectPath?: unknown;
    } | null;
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body?.lastName === "string" ? body.lastName.trim() : "";
    const redirectPath =
      typeof body?.redirectPath === "string" && body.redirectPath.startsWith("/")
        ? body.redirectPath
        : "/";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
        emailRedirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({
      user: data.user ? { id: data.user.id } : null,
      session: !!data.session,
    });
  } catch {
    return NextResponse.json({ error: "Sign-up failed" }, { status: 500 });
  }
}
