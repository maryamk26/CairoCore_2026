import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeAdminEmail } from "@/lib/auth/adminPolicy";
import { getUserIdAndEmailFromAccessToken } from "@/lib/auth/sessionAccessToken";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const parsed = getUserIdAndEmailFromAccessToken(session?.access_token);
  const userId = parsed?.userId ?? "";
  const userEmail = parsed ? normalizeAdminEmail(parsed.email) : "";
  response.headers.set("x-user-id", userId);
  response.headers.set("x-user-email", userEmail);

  return response;
}
