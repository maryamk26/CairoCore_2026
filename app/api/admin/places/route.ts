import { NextRequest, NextResponse } from "next/server";
import {
  parseAdminDateRange,
  parseAdminPagination,
  parseAdminVisibility,
  placeVisibilityFilter,
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
  const userCreatedOnly = searchParams.get("userCreatedOnly") !== "false";

  const where = {
    createdAt:
      dateRange.range.lte !== undefined
        ? { gte: dateRange.range.gte, lte: dateRange.range.lte }
        : { gte: dateRange.range.gte },
    ...placeVisibilityFilter(visibility),
    ...(userCreatedOnly ? { createdBy: { not: null } } : {}),
  };

  try {
    const [total, places] = await Promise.all([
      prisma.place.count({ where }),
      prisma.place.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          type: true,
          city: true,
          createdAt: true,
          createdBy: true,
          deletedAt: true,
          deleteReason: true,
          deletedByAdminId: true,
        },
      }),
    ]);

    return NextResponse.json({ total, limit, offset, places });
  } catch (error) {
    console.error("admin places list failed:", error);
    return NextResponse.json({ error: "Failed to list places" }, { status: 500 });
  }
}
