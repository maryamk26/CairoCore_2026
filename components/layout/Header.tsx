"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isAdminEmail, normalizeAdminEmail } from "@/lib/auth/adminPolicy";
import { useAuth } from "@/lib/hooks/useAuth";
import UserButton from "@/components/auth/UserButton";

function HeaderContent() {
  const pathname = usePathname();
  const { isSignedIn, isLoading, userId, user } = useAuth();
  const authenticated = !isLoading && (isSignedIn || !!userId);
  const sessionEmail = user?.email ? normalizeAdminEmail(user.email) : "";
  const isPolicyAdmin = sessionEmail.length > 0 && isAdminEmail(sessionEmail);

  const scrollToSection = (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    if (pathname === "/") {
      event.preventDefault();
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up") ||
    pathname?.startsWith("/auth")
  ) {
    return null;
  }

  const textNavLinks = isPolicyAdmin
    ? []
    : authenticated
      ? [
          { href: "/", label: "Home" },
          { href: "/planner", label: "Planner" },
          { href: "/profile", label: "Profile" },
        ]
      : [
          { href: "/", label: "Home" },
          { href: "/#places", label: "Places" },
          { href: "/#about", label: "About Us" },
        ];

  const isLight =
    pathname === "/search" ||
    pathname === "/planner" ||
    (pathname === "/" && !authenticated) ||
    pathname.startsWith("/admin");
  const linkCls =
    "font-cinzel text-base md:text-lg font-normal transition-colors hover:underline " +
    (isLight ? "text-white hover:text-white/80" : "text-[#5d4e37] hover:text-[#8b6f47]");
  const iconCls =
    "p-1 transition-colors " +
    (isLight ? "text-white hover:text-white/80" : "text-[#5d4e37] hover:text-[#8b6f47]");

  return (
    <header className="w-full pt-8 pb-4 absolute top-0 left-0 right-0 z-50 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link
            href={isPolicyAdmin ? "/admin" : "/"}
            className={`font-cinzel text-3xl md:text-4xl font-bold transition-colors ${iconCls}`}
          >
            CairoCore
          </Link>

          {!isPolicyAdmin ? (
            <nav className="flex items-center gap-8">
              {textNavLinks.map((link) => {
                if (link.href === "/#about") {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(event) => scrollToSection(event, "about")}
                      className={linkCls}
                    >
                      {link.label}
                    </Link>
                  );
                }
                if (link.href === "/#places") {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={(event) => scrollToSection(event, "places")}
                      className={linkCls}
                    >
                      {link.label}
                    </Link>
                  );
                }
                return (
                  <Link key={link.href} href={link.href} className={linkCls}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          ) : (
            <div className="flex-1" aria-hidden />
          )}

          <div className="flex items-center gap-4">
            {(!authenticated || !isPolicyAdmin) && (
              <Link href="/search" className={iconCls} aria-label="Search">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </Link>
            )}
            {!authenticated && (
              <Link href="/auth" className={iconCls} aria-label="Sign In">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Link>
            )}
            {authenticated && <UserButton />}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  const pathname = usePathname();

  if (
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up") ||
    pathname?.startsWith("/auth")
  ) {
    return null;
  }

  return <HeaderContent />;
}
