import { PlaceCategory, PlaceType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  mapPlannerRowToRecommendation,
  PLANNER_PLACE_SELECT,
} from "@/lib/planner/mapDbPlaceForRecommendation";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";

export async function searchPlacesByCategory(options: {
  category: PlaceCategory;
  placeType?: PlaceType;
  petsOnly?: boolean;
  kidsOk?: boolean;
  maxEntranceFee?: number;
  limit?: number;
}): Promise<PlaceRecommendation[]> {
  const take = Math.max(1, Math.min(24, options.limit ?? 10));
  const where: any = {
    type: options.placeType ?? PlaceType.place_to_visit,
    category: options.category,
  };
  if (options.petsOnly) where.petsFriendly = true;
  if (options.kidsOk === true) {
    where.OR = [{ kidsFriendly: null }, { kidsFriendly: true }];
  }
  if (typeof options.maxEntranceFee === "number" && Number.isFinite(options.maxEntranceFee)) {
    const existingOr = Array.isArray(where.OR) ? where.OR : [];
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : []),
      { OR: [{ entranceFee: null }, { entranceFee: { lte: options.maxEntranceFee } }] },
    ];
    if (existingOr.length === 0) delete where.OR;
  }

  const rows = await prisma.place.findMany({
    where,
    select: PLANNER_PLACE_SELECT,
    orderBy: { name: "asc" },
    take,
  });

  return rows.map((place) => mapPlannerRowToRecommendation(place));
}

