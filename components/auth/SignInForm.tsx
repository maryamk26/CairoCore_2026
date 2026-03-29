"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error || "Invalid email or password");
        return;
      }

      window.location.href = redirectTo;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/fetch|network/i.test(msg)) setError("Could not reach the server.");
      else setError(msg || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "apple" | "github") => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ provider, redirectPath: redirectTo }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error || "Sign-in failed");
        return;
      }
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-0">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-cinzel font-medium text-[#5d4e37] mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-full border border-white/50 bg-white/20 backdrop-blur-sm text-[#3a3428] font-cinzel focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/70 transition-all"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-cinzel font-medium text-[#5d4e37] mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-full border border-white/50 bg-white/20 backdrop-blur-sm text-[#3a3428] font-cinzel focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/70 transition-all"
            placeholder="Enter your password"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-[#5d4e37] font-cinzel cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-white/50 bg-white/20 focus:ring-2 focus:ring-white/50 cursor-pointer"
            style={{ accentColor: "#8b6f47" }}
          />
          Remember me
        </label>

        {error && (
          <div className="p-3 rounded-full bg-red-50/50 border border-red-200/50 text-red-700 text-sm font-cinzel backdrop-blur-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-full bg-[#8b6f47]/80 backdrop-blur-sm text-white font-cinzel font-medium hover:bg-[#8b6f47] focus:outline-none focus:ring-2 focus:ring-[#8b6f47] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/40"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-transparent text-[#5d4e37] font-cinzel">or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleSocialSignIn("google")}
        disabled={isLoading}
        className="w-full py-3 px-4 rounded-full border-2 border-white/50 bg-white/30 backdrop-blur-sm text-[#5d4e37] font-cinzel font-medium hover:bg-[#5d4e37]/20 hover:border-[#5d4e37]/40 hover:text-[#3a3428] focus:outline-none focus:ring-2 focus:ring-[#8b6f47] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}
