import { NextRequest, NextResponse } from "next/server";
import { PlaceType } from "@prisma/client";

import {
  mapPlannerPlaceRowToInput,
  PLANNER_PLACE_SELECT,
} from "@/lib/planner/mapDbPlaceForRecommendation";
import { tryHybridSurveyRecommendations } from "@/lib/planner/tryHybridSurveyRecommendations";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json({ error: "Preferences are required" }, { status: 400 });
    }

    const allPlaces = await prisma.place.findMany({
      where: { type: PlaceType.place_to_visit },
      select: PLANNER_PLACE_SELECT,
    });

    const inputPlaces = allPlaces.map(mapPlannerPlaceRowToInput);
    const finalLimit = 24;

    const { recommendations } = await tryHybridSurveyRecommendations({
      route: "recommend",
      inputPlaces,
      preferences,
      placeType: PlaceType.place_to_visit,
      finalLimit,
    });

    return NextResponse.json({
      success: true,
      recommendations,
      totalPlaces: allPlaces.length,
      matchedPlaces: recommendations.length,
    });
  } catch (error) {
    console.error("Error getting recommendations:", error);
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
