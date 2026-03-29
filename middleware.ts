import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/auth",
  "/about",
  "/search",
  "/places",
  "/users",
  "/clear-session",
  "/api/webhooks",
  "/api/auth",
  "/api/places",
  "/api/users",
  "/auth/callback",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function middleware(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  const isPublic = isPublicRoute(pathname);
  const isApiRequest = pathname.startsWith("/api/");

  if (isPublic) {
    return NextResponse.next();
  }

  const response = await updateSession(request);
  const userId = response.headers.get("x-user-id");
  if (!userId) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|clear-session|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
