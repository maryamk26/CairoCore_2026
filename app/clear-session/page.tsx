"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function ClearSessionPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const run = async () => {
      await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" });

      if (typeof document !== "undefined") {
        document.cookie.split(";").forEach((c) => {
          const name = c.trim().split("=")[0];
          if (name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }

      setDone(true);
    };
    void run();
  }, []);

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-4">
      <div className="max-w-md text-center">
        {done ? (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Session cleared</h1>
            <p className="text-gray-600 mb-6">
              You’re signed out and cookies were cleared. Use the link below to go home and sign in
              again.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-lg bg-[#5d4e37] text-white font-medium hover:bg-[#8b6f47]"
            >
              Go to home
            </Link>
          </>
        ) : (
          <p className="text-gray-600">Clearing session…</p>
        )}
      </div>
    </div>
  );
}
