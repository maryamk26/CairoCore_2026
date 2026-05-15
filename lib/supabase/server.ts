import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import {
  decodeAccessTokenPayload,
  getUserIdAndEmailFromAccessToken,
} from "@/lib/auth/sessionAccessToken";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const url = getSupabaseUrl();
  const key = getSupabasePublishableKey();
  if (!url || !key) throw new Error("Missing Supabase env");

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch (e) {
          console.error("Supabase SSR cookie set failed:", e);
        }
      },
    },
  });
}

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const ids = getUserIdAndEmailFromAccessToken(session.access_token);
  if (!ids) return null;

  const payload = decodeAccessTokenPayload(session.access_token) ?? {};
  const user_metadata =
    typeof payload.user_metadata === "object" && payload.user_metadata !== null
      ? (payload.user_metadata as User["user_metadata"])
      : ({} as User["user_metadata"]);

  return {
    id: ids.userId,
    email: ids.email,
    user_metadata,
    app_metadata:
      typeof payload.app_metadata === "object" && payload.app_metadata !== null
        ? (payload.app_metadata as User["app_metadata"])
        : ({} as User["app_metadata"]),
    aud: typeof payload.aud === "string" ? payload.aud : "authenticated",
    created_at:
      typeof payload.created_at === "string" ? payload.created_at : new Date().toISOString(),
    email_confirmed_at:
      typeof payload.email_confirmed_at === "string" ? payload.email_confirmed_at : null,
    phone: "",
    confirmed_at: null,
    last_sign_in_at: null,
    identities: [],
    factors: null,
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  } as unknown as User;
}
