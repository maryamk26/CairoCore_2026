import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED = new Set(["google", "apple", "github"]);

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      provider?: unknown;
      redirectPath?: unknown;
    } | null;
    const provider = typeof body?.provider === "string" ? body.provider : "";
    const redirectPath =
      typeof body?.redirectPath === "string" && body.redirectPath.startsWith("/")
        ? body.redirectPath
        : "/";

    if (!ALLOWED.has(provider)) {
      return NextResponse.json({ error: "Unsupported provider" }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as "google" | "apple" | "github",
      options: {
        redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return NextResponse.json(
        { error: error?.message || "OAuth failed" },
        { status: 400 }
      );
    }
    return NextResponse.json({ url: data.url });
  } catch {
    return NextResponse.json({ error: "OAuth failed" }, { status: 500 });
  }
}
