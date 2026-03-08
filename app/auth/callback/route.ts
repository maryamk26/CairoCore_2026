import { createServerClient } from "@supabase/ssr";
import { upsertUser } from "@/lib/db/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const redirectUrl =
    process.env.NODE_ENV === "development"
      ? `${origin}${next}`
      : request.headers.get("x-forwarded-host")
        ? `https://${request.headers.get("x-forwarded-host")}${next}`
        : `${origin}${next}`;

  const response = NextResponse.redirect(redirectUrl);

  if (code) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options ?? {})
          );
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) upsertUser(user.id, user.email).catch(() => {});
      });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
