import { NextRequest, NextResponse } from "next/server";
import { PlaceType } from "@prisma/client";

import { getAiPlannerConfig, isAiPlannerEnabled } from "@/lib/ai/config";
import { appendAlphabeticalTail } from "@/lib/planner/appendAlphabeticalTail";
import {
  mapPlannerPlaceRowToInput,
  PLANNER_PLACE_SELECT,
  type PlannerPlaceRow,
} from "@/lib/planner/mapDbPlaceForRecommendation";
import type { SurveyAnswers } from "@/lib/planner/survey";
import { tryHybridSurveyRecommendations } from "@/lib/planner/tryHybridSurveyRecommendations";
import { prisma } from "@/lib/prisma";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";

function toRecommendationShape(place: PlannerPlaceRow): PlaceRecommendation {
  const vibeArr = place.vibes?.length > 0 ? [...place.vibes] : place.vibe ? [place.vibe] : [];
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
    matchReasons: [],
    ...(place.category && { category: place.category }),
  };
}

function parseStopType(typeParam: string | null): {
  placeType: PlaceType;
  typeLabel: string;
} | null {
  if (typeParam === "coffee_shop") {
    return { placeType: PlaceType.cafe, typeLabel: typeParam };
  }
  if (typeParam === "restaurant") {
    return { placeType: PlaceType.restaurant, typeLabel: typeParam };
  }
  return null;
}

function alphabeticalStops(places: PlannerPlaceRow[], typeLabel: string) {
  const sorted = [...places].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
  return NextResponse.json({
    success: true,
    recommendations: sorted.map(toRecommendationShape),
    type: typeLabel,
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseStopType(searchParams.get("type"));
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid type. Use coffee_shop or restaurant" },
        { status: 400 }
      );
    }

    const places = await prisma.place.findMany({
      where: { type: parsed.placeType },
      select: PLANNER_PLACE_SELECT,
      orderBy: { name: "asc" },
    });

    return alphabeticalStops(places, parsed.typeLabel);
  } catch (error) {
    console.error("Error getting stop recommendations:", error);
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: { type?: unknown; preferences?: unknown };
    try {
      body = (await request.json()) as { type?: unknown; preferences?: unknown };
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = parseStopType(typeof body.type === "string" ? body.type : null);
    if (!parsed) {
      return NextResponse.json(
        { error: "Invalid type. Use coffee_shop or restaurant" },
        { status: 400 }
      );
    }

    const preferences = body.preferences as SurveyAnswers | undefined;
    if (!preferences || typeof preferences !== "object") {
      return NextResponse.json({ error: "preferences object is required" }, { status: 400 });
    }

    const places = await prisma.place.findMany({
      where: { type: parsed.placeType },
      select: PLANNER_PLACE_SELECT,
    });

    if (!isAiPlannerEnabled()) {
      return alphabeticalStops(places, parsed.typeLabel);
    }

    const inputPlaces = places.map(mapPlannerPlaceRowToInput);
    const headLimit = getAiPlannerConfig().stopsHybridHeadLimit;

    const { recommendations: head } = await tryHybridSurveyRecommendations({
      route: "stops",
      inputPlaces,
      preferences,
      placeType: parsed.placeType,
      finalLimit: headLimit,
    });

    const recommendations = appendAlphabeticalTail(head, inputPlaces, preferences);

    return NextResponse.json({
      success: true,
      recommendations,
      type: parsed.typeLabel,
    });
  } catch (error) {
    console.error("Error getting stop recommendations (POST):", error);
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
