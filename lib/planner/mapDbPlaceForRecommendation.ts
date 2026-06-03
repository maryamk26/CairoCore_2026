import type { PlaceRecommendation } from "@/utils/planner/recommendation";

export const PLANNER_PLACE_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  latitude: true,
  longitude: true,
  address: true,
  bestVisitTime: true,
  entranceFee: true,
  cameraFee: true,
  vibe: true,
  vibes: true,
  images: true,
  kidsFriendly: true,
  petsFriendly: true,
} as const;

export type PlannerPlaceRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  bestVisitTime: string | null;
  entranceFee: number | null;
  cameraFee: number | null;
  vibe: string | null;
  vibes: string[];
  images: string[];
  kidsFriendly: boolean | null;
  petsFriendly: boolean | null;
};

export function mapPlannerRowToRecommendation(
  place: PlannerPlaceRow,
  matchReasons: string[] = []
): PlaceRecommendation {
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
    matchReasons,
    ...(place.category && { category: place.category }),
  };
}
