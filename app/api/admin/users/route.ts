import { NextRequest, NextResponse } from "next/server";
import {
  parseAdminDateRange,
  parseAdminPagination,
  parseAdminVisibility,
  userVisibilityFilter,
} from "@/lib/admin/parseDateRange";
import { requireAdminApi } from "@/lib/auth/requireAdmin";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const searchParams = request.nextUrl.searchParams;
  const dateRange = parseAdminDateRange(searchParams);
  if (!dateRange.ok) {
    return NextResponse.json({ error: dateRange.error }, { status: 400 });
  }

  const { limit, offset } = parseAdminPagination(searchParams);
  const visibility = parseAdminVisibility(searchParams);

  const where = {
    createdAt:
      dateRange.range.lte !== undefined
        ? { gte: dateRange.range.gte, lte: dateRange.range.lte }
        : { gte: dateRange.range.gte },
    ...userVisibilityFilter(visibility),
  };

  try {
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          username: true,
          role: true,
          isBanned: true,
          bannedAt: true,
          banReason: true,
          deletedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const userIds = users.map((user) => user.id);
    const strikeRows =
      userIds.length > 0
        ? await prisma.moderationAction.groupBy({
            by: ["ownerUserId"],
            where: {
              ownerUserId: { in: userIds },
              actionType: "SOFT_DELETE_CONTENT",
            },
            _count: {
              _all: true,
            },
          })
        : [];

    const strikeByUserId = new Map<string, number>(
      strikeRows
        .filter((row) => row.ownerUserId)
        .map((row) => [row.ownerUserId as string, row._count._all])
    );

    return NextResponse.json({
      total,
      limit,
      offset,
      users: users.map((user) => ({
        ...user,
        strikeCount: strikeByUserId.get(user.id) ?? 0,
      })),
    });
  } catch (error) {
    console.error("admin users list failed:", error);
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }
}
