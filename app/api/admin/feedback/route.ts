import { NextRequest, NextResponse } from "next/server";
import {
  feedbackVisibilityFilter,
  parseAdminDateRange,
  parseAdminPagination,
  parseAdminVisibility,
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
    ...feedbackVisibilityFilter(visibility),
  };

  try {
    const [total, feedback] = await Promise.all([
      prisma.placeFeedback.count({ where }),
      prisma.placeFeedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          placeId: true,
          userId: true,
          rating: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
          deleteReason: true,
          deletedByAdminId: true,
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              username: true,
            },
          },
          place: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ total, limit, offset, feedback });
  } catch (error) {
    console.error("admin feedback list failed:", error);
    return NextResponse.json({ error: "Failed to list feedback" }, { status: 500 });
  }
}
