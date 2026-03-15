"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function UserButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

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
    await supabase.auth.signOut();
    router.push("/");
    setIsOpen(false);
  };

  const userInitials = user?.user_metadata?.first_name?.[0]?.toUpperCase() ||
                       user?.email?.[0]?.toUpperCase() ||
                       "U";
  const userName = user?.user_metadata?.first_name ||
                   user?.email?.split("@")[0] ||
                   "User";

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
            <p className="text-sm font-medium text-gray-900 font-cinzel">
              {userName}
            </p>
            <p className="text-xs text-gray-500 truncate font-cinzel">
              {user?.email}
            </p>
          </div>
          <Link
            href="/profile"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-cinzel"
            onClick={() => setIsOpen(false)}
            onMouseEnter={() => fetch("/api/profile/page")}
          >
            Profile
          </Link>
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
