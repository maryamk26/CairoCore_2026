import { isAdminEmail } from "@/lib/auth/adminPolicy";
import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

const publicRoutes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/auth",
  "/search",
  "/places",
  "/users",
  "/api/auth",
  "/api/places",
  "/api/users",
  "/auth/callback",
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAdminShellPath(pathname: string): boolean {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up")
  );
}

function copySetCookies(from: NextResponse, to: NextResponse) {
  const raw = typeof from.headers.getSetCookie === "function" ? from.headers.getSetCookie() : [];
  if (raw.length > 0) {
    for (const c of raw) {
      to.headers.append("Set-Cookie", c);
    }
    return;
  }
  for (const { name, value } of from.cookies.getAll()) {
    to.cookies.set(name, value);
  }
}

export async function middleware(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  const sessionResponse = await updateSession(request);
  const userId = sessionResponse.headers.get("x-user-id") ?? "";
  const userEmail = sessionResponse.headers.get("x-user-email") ?? "";

  if (userId && userEmail && isAdminEmail(userEmail) && !isAdminShellPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    copySetCookies(sessionResponse, redirectResponse);
    return redirectResponse;
  }

  const isPublic = isPublicRoute(pathname);
  const isApiRequest = pathname.startsWith("/api/");

  if (isPublic) {
    return sessionResponse;
  }

  if (!userId) {
    if (isApiRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const redirectUrl = new URL("/auth", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    copySetCookies(sessionResponse, redirectResponse);
    return redirectResponse;
  }

  return sessionResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
