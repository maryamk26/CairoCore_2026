"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { isAdminEmail, normalizeAdminEmail } from "@/lib/auth/adminPolicy";
import { useAuth } from "@/lib/hooks/useAuth";

const HIDDEN_PATH_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/auth",
  "/about",
  "/search",
  "/planner",
  "/create",
  "/admin",
];

function FloatingAddButtonContent() {
  const { isSignedIn, isLoading, userId, user } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  if (isLoading || !isSignedIn || !userId) {
    return null;
  }

  const sessionEmail = user?.email ? normalizeAdminEmail(user.email) : "";
  if (sessionEmail && isAdminEmail(sessionEmail)) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 z-50" ref={menuRef}>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden min-w-[180px]">
          <Link
            href="/create/place"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-gray-900"
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#8b6f47] text-white">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span className="font-cinzel font-medium">Create a place</span>
          </Link>
          <Link
            href="/create/route"
            className="flex w-full items-center gap-3 px-4 py-3 border-t border-gray-100 hover:bg-gray-50 text-gray-900 text-left"
            onClick={() => setOpen(false)}
          >
            <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#5d4e37] text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </span>
            <span className="font-cinzel font-medium">Build a route</span>
          </Link>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 bg-[#8b6f47] hover:bg-[#5d4e37] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        aria-label="Add"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

export default function FloatingAddButton() {
  const pathname = usePathname();

  if (
    HIDDEN_PATH_PREFIXES.some(
      (pathPrefix) => pathname?.startsWith(pathPrefix) || pathname === pathPrefix
    )
  ) {
    return null;
  }

  return <FloatingAddButtonContent />;
}
