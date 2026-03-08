import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    const places = await prisma.place.findMany({
      where: q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { description: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        address: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      places: places.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.description?.slice(0, 80) ?? p.address ?? (p.category ?? ""),
        type: "place",
        category: p.category ?? "other",
      })),
    });
  } catch (error) {
    console.error("Places list error:", error);
    return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 });
  }
}
