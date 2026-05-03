import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PlaceType } from "@prisma/client";

function toRecommendationShape(place: {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  entranceFee: number | null;
  cameraFee: number | null;
  vibe: string | null;
  vibes: string[];
  images: string[];
  kidsFriendly: boolean | null;
  petsFriendly: boolean | null;
}) {
  const vibeArr =
    place.vibes?.length > 0 ? [...place.vibes] : place.vibe ? [place.vibe] : [];
  return {
    id: place.id,
    title: place.name,
    description: place.description ?? "",
    images: place.images ?? [],
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address ?? "",
    vibe: vibeArr,
    entryFees: place.entranceFee,
    cameraFees: place.cameraFee,
    petsFriendly: place.petsFriendly ?? false,
    kidsFriendly: place.kidsFriendly ?? true,
    matchScore: 0,
    matchReasons: [] as string[],
    ...(place.category && { category: place.category }),
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get("type");

    const placeType = typeParam === "coffee_shop" ? PlaceType.cafe : typeParam === "restaurant" ? PlaceType.restaurant : null;
    if (!placeType) {
      return NextResponse.json(
        { error: "Invalid type. Use coffee_shop or restaurant" },
        { status: 400 }
      );
    }

    const places = await prisma.place.findMany({
      where: { type: placeType },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        latitude: true,
        longitude: true,
        address: true,
        entranceFee: true,
        cameraFee: true,
        vibe: true,
        vibes: true,
        images: true,
        kidsFriendly: true,
        petsFriendly: true,
      },
      orderBy: { name: "asc" },
    });

    const recommendations = places.map(toRecommendationShape);

    return NextResponse.json({
      success: true,
      recommendations,
      type: typeParam,
    });
  } catch (error) {
    console.error("Error getting stop recommendations:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
