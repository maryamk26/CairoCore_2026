"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function FloatingAddButton() {
  const pathname = usePathname();
  const { isSignedIn, isLoading, userId } = useAuth();

  if (isLoading || !isSignedIn || !userId) {
    return null;
  }

  const hidePaths = ["/sign-in", "/sign-up", "/auth", "/about", "/search", "/planner"];
  if (hidePaths.some((p) => pathname?.startsWith(p) || pathname === p)) return null;

  return (
    <Link
      href="/search"
      className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-[#8b6f47] hover:bg-[#5d4e37] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
      aria-label="Discover places"
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
    </Link>
  );
}
