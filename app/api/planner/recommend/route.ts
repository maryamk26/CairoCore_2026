import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTopRecommendations } from "@/utils/planner/recommendation";
import { PlaceType } from "@prisma/client";

function dbPlaceToInput(place: {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  openingHours: string | null;
  entranceFee: number | null;
  cameraFee: number | null;
  vibe: string | null;
  images: string[];
  kidsFriendly: boolean | null;
  elderlyFriendly: boolean | null;
  petsFriendly: boolean | null;
}) {
  const vibeArr = place.vibe ? [place.vibe] : [];
  return {
    id: place.id,
    name: place.name,
    title: place.name,
    description: place.description ?? "",
    latitude: place.latitude,
    longitude: place.longitude,
    address: place.address ?? "",
    entranceFee: place.entranceFee,
    cameraFee: place.cameraFee,
    vibe: vibeArr,
    category: place.category ?? undefined,
    images: place.images ?? [],
    entryFees: place.entranceFee,
    cameraFees: place.cameraFee,
    petsFriendly: place.petsFriendly ?? false,
    kidsFriendly: place.kidsFriendly ?? true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { error: "Preferences are required" },
        { status: 400 }
      );
    }

    const allPlaces = await prisma.place.findMany({
      where: { type: PlaceType.place_to_visit },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        latitude: true,
        longitude: true,
        address: true,
        openingHours: true,
        entranceFee: true,
        cameraFee: true,
        vibe: true,
        images: true,
        kidsFriendly: true,
        elderlyFriendly: true,
        petsFriendly: true,
      },
    });

    const inputPlaces = allPlaces.map(dbPlaceToInput);
    const recommendations = getTopRecommendations(inputPlaces, preferences, 24);

    return NextResponse.json({
      success: true,
      recommendations,
      totalPlaces: allPlaces.length,
      matchedPlaces: recommendations.length,
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return NextResponse.json(
      { error: "Failed to get recommendations" },
      { status: 500 }
    );
  }
}
