import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { upsertUser } from "@/lib/db/user";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";

  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const redirectUrl =
    process.env.NODE_ENV === "development"
      ? `${origin}${next}`
      : request.headers.get("x-forwarded-host")
        ? `https://${request.headers.get("x-forwarded-host")}${next}`
        : `${origin}${next}`;

  const response = NextResponse.redirect(redirectUrl);

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
  if (error) {
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email) {
    try {
      await upsertUser(user.id, user.email);
    } catch (e) {
      console.error("auth callback upsertUser:", e);
    }
  }

  return response;
}
