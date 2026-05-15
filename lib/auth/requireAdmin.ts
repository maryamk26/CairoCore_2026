import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { isAdminEmail, normalizeAdminEmail } from "@/lib/auth/adminPolicy";
import { getUserIdAndEmailFromAccessToken } from "@/lib/auth/sessionAccessToken";
import { upsertUser } from "@/lib/db/user";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type AdminDbUser = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  isBanned: boolean;
};

async function getAdminContext(): Promise<
  | { ok: true; supabaseUser: SupabaseUser; dbUser: AdminDbUser }
  | { ok: false; kind: "unauthorized" | "forbidden" }
> {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    return { ok: false, kind: "unauthorized" };
  }

  const tokenUser = getUserIdAndEmailFromAccessToken(session.access_token);
  if (!tokenUser) {
    return { ok: false, kind: "unauthorized" };
  }

  const { userId, email: sessionEmailRaw } = tokenUser;
  const supabaseUser = {
    id: userId,
    email: sessionEmailRaw,
  } as SupabaseUser;

  let dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      isBanned: true,
    },
  });

  if (sessionEmailRaw) {
    if (!dbUser) {
      try {
        await upsertUser(userId, sessionEmailRaw);
      } catch (e) {
        console.error("getAdminContext: upsertUser failed:", e);
        return { ok: false, kind: "forbidden" };
      }
      dbUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          isBanned: true,
        },
      });
    } else {
      const sessionEmail = normalizeAdminEmail(sessionEmailRaw);
      const storedEmail = normalizeAdminEmail(dbUser.email);
      const expectedRole = isAdminEmail(sessionEmail) ? "ADMIN" : "USER";
      if (storedEmail !== sessionEmail || dbUser.role !== expectedRole) {
        try {
          await upsertUser(userId, sessionEmailRaw);
        } catch (e) {
          console.error("getAdminContext: upsertUser sync failed:", e);
          return { ok: false, kind: "forbidden" };
        }
        dbUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            role: true,
            isBanned: true,
          },
        });
      }
    }
  }

  if (
    !dbUser ||
    dbUser.isBanned ||
    dbUser.role !== "ADMIN" ||
    !isAdminEmail(normalizeAdminEmail(dbUser.email))
  ) {
    return { ok: false, kind: "forbidden" };
  }

  return { ok: true, supabaseUser, dbUser };
}

function adminErrorResponse(kind: "unauthorized" | "forbidden") {
  if (kind === "unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function requireAdminApi() {
  const ctx = await getAdminContext();
  if (!ctx.ok) {
    return { ok: false as const, response: adminErrorResponse(ctx.kind) };
  }
  return { ok: true as const, supabaseUser: ctx.supabaseUser, dbUser: ctx.dbUser };
}

export async function requireAdminPage() {
  const ctx = await getAdminContext();
  if (!ctx.ok) {
    redirect(
      ctx.kind === "unauthorized" ? "/auth?redirect=/admin" : "/auth?notice=admin_forbidden"
    );
  }
  return ctx;
}
