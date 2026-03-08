import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const place = await prisma.place.findUnique({ where: { id } });

    if (!place) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 });
    }

    const vibeArr = place.vibe ? [place.vibe] : [];

    return NextResponse.json({
      id: place.id,
      type: place.type,
      title: place.name,
      description: place.description ?? "",
      images: place.images ?? [],
      location: {
        address: place.address ?? "",
        lat: place.latitude,
        lng: place.longitude,
      },
      city: place.city ?? null,
      workingHours: place.openingHours ?? null,
      entryFees: place.entranceFee,
      cameraFees: place.cameraFee,
      vibe: vibeArr,
      petsFriendly: place.petsFriendly ?? false,
      kidsFriendly: place.kidsFriendly ?? true,
      elderlyFriendly: place.elderlyFriendly ?? null,
      bestTimeToVisit: place.bestVisitTime ? { timeOfDay: [place.bestVisitTime] } : null,
      category: place.category ?? "other",
    });
  } catch (error) {
    console.error("Place fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch place" }, { status: 500 });
  }
}
