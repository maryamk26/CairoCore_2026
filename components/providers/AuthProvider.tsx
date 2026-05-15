"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type SessionJson = {
  authenticated?: boolean;
  user?: {
    id: string;
    email?: string;
    metadata?: Record<string, unknown>;
  } | null;
};

async function loadSession(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/session", { credentials: "same-origin" });
  if (!res.ok) return null;
  const data = (await res.json()) as SessionJson;
  if (!data.authenticated || !data.user) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    user_metadata: data.user.metadata ?? {},
  };
}

type AuthContextValue = {
  user: AuthUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  userId: string | null;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setUser(await loadSession());
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setIsLoading(false);
    try {
      await fetch("/api/auth/sign-out", { method: "POST", credentials: "same-origin" });
    } catch {
      await refreshSession();
    }
  }, [refreshSession]);

  useEffect(() => {
    let cancelled = false;
    void loadSession().then((u) => {
      if (!cancelled) {
        setUser(u);
        setIsLoading(false);
      }
    });
    const t = window.setTimeout(() => {
      if (!cancelled) setIsLoading(false);
    }, 5000);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const onFocus = () => void refreshSession();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSignedIn: !!user,
        userId: user?.id ?? null,
        refreshSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
