import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params;

    if (!boardId) {
      return NextResponse.json({ error: "Board id required" }, { status: 400 });
    }

    const folder = await prisma.folder.findUnique({
      where: { id: boardId },
      include: {
        savedPlaces: {
          include: { place: true },
          orderBy: { createdAt: "desc" },
          take: 60,
        },
      },
    });

    const saved = folder?.savedPlaces ?? [];
    const folderName = folder?.name ?? "Board";

    return NextResponse.json({
      board: {
        id: boardId,
        name: folderName,
        pinCount: saved.length,
      },
      places: saved.map((s) => ({
        id: s.place.id,
        name: s.place.name,
        description: s.place.description,
        category: s.place.category,
        address: s.place.address,
        images: s.place.images,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    console.error("Board fetch failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch board" },
      { status: 500 }
    );
  }
}

