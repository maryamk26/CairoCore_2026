"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { isAdminEmail, normalizeAdminEmail } from "@/lib/auth/adminPolicy";

export default function UserButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user, signOut } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  const firstName = user?.user_metadata?.first_name;
  const firstInitial =
    typeof firstName === "string" && firstName.length > 0
      ? firstName[0]!.toUpperCase()
      : (user?.email?.[0]?.toUpperCase() ?? "U");
  const userInitials = firstInitial;
  const userName =
    (typeof firstName === "string" && firstName) || user?.email?.split("@")[0] || "User";

  const sessionEmail = user?.email ? normalizeAdminEmail(user.email) : "";
  const isPolicyAdmin = sessionEmail.length > 0 && isAdminEmail(sessionEmail);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#8b6f47] text-white hover:bg-[#5d4e37] transition-colors focus:outline-none focus:ring-2 focus:ring-[#8b6f47] focus:ring-offset-2"
        aria-label="User menu"
      >
        {userInitials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200">
          <div className="px-4 py-2 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900 font-cinzel">{userName}</p>
            <p className="text-xs text-gray-500 truncate font-cinzel">{user?.email}</p>
          </div>
          {!isPolicyAdmin && (
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-cinzel"
              onClick={() => setIsOpen(false)}
              onMouseEnter={() => fetch("/api/profile/page")}
            >
              Profile
            </Link>
          )}
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-cinzel"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
