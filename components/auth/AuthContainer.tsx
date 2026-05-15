"use client";

import { useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import SignInForm from "@/components/auth/SignInForm";
import SignUpForm from "@/components/auth/SignUpForm";
import AuthSwitch from "@/components/auth/AuthSwitch";
import { useAuth } from "@/lib/hooks/useAuth";

interface AuthContainerProps {
  initialMode?: "sign-in" | "sign-up";
  useAuthRoute?: boolean;
}

export default function AuthContainer({ initialMode, useAuthRoute }: AuthContainerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, signOut } = useAuth();
  const [isSignIn, setIsSignIn] = useState(() => {
    if (initialMode === "sign-up") return false;
    if (pathname?.includes("/sign-up")) return false;
    return true;
  });

  useEffect(() => {
    if (useAuthRoute && pathname === "/auth") {
      const mode = searchParams.get("mode");
      setIsSignIn(mode !== "sign-up");
    } else if (pathname?.includes("/sign-up")) {
      setIsSignIn(false);
    } else if (pathname?.includes("/sign-in")) {
      setIsSignIn(true);
    }
  }, [pathname, searchParams, useAuthRoute]);

  const handleSwitch = (type: "sign-in" | "sign-up") => {
    setIsSignIn(type === "sign-in");
    if (useAuthRoute) {
      const params = new URLSearchParams(window.location.search);
      params.set("mode", type === "sign-in" ? "sign-in" : "sign-up");
      const url = `/auth?${params.toString()}`;
      window.history.replaceState(null, "", url);
    } else {
      const path = type === "sign-in" ? "/sign-in" : "/sign-up";
      window.history.replaceState(null, "", path);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      {searchParams.get("notice") === "admin_forbidden" && user && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 font-cinzel">
          <p className="font-medium">Admin access is not available for this session.</p>
          <p className="mt-1 text-amber-900/90">
            Sign out if you need to use a different account, or contact support if this is
            unexpected.
          </p>
          <button
            type="button"
            className="mt-3 rounded-full bg-[#5d4e37] px-4 py-2 text-xs font-medium text-white hover:bg-[#3d3428]"
            onClick={() => void signOut().then(() => window.location.assign("/auth"))}
          >
            Sign out
          </button>
        </div>
      )}
      <AuthSwitch isSignIn={isSignIn} onSwitch={handleSwitch} />

      <div
        className={`bg-white/40 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 mt-6 relative overflow-hidden min-h-[700px] ${
          isSignIn ? "px-8 pt-8 pb-6" : "p-8"
        }`}
      >
        <div className="grid grid-cols-1">
          <div
            className={`col-start-1 row-start-1 transition-all duration-500 ease-in-out flex flex-col ${
              isSignIn
                ? "opacity-100 translate-x-0 z-10 justify-start"
                : "opacity-0 translate-x-[-30px] z-0 pointer-events-none"
            }`}
          >
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-cinzel font-bold text-[#5d4e37] mb-2">Welcome back</h2>
              <p className="text-[#8b6f47] font-cinzel">Sign in to continue your adventure</p>
            </div>
            <SignInForm />
          </div>

          <div
            className={`col-start-1 row-start-1 transition-all duration-500 ease-in-out ${
              !isSignIn
                ? "opacity-100 translate-x-0 z-10"
                : "opacity-0 translate-x-[30px] z-0 pointer-events-none"
            }`}
          >
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-cinzel font-bold text-[#5d4e37] mb-2">Create account</h2>
              <p className="text-[#8b6f47] font-cinzel">Start exploring Cairo's amazing places</p>
            </div>
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
