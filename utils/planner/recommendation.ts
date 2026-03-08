import { SurveyAnswers } from "@/lib/planner/survey";

export interface PlaceRecommendation {
  id: string;
  title: string;
  description: string;
  images: string[];
  latitude: number;
  longitude: number;
  address: string;
  vibe: string[];
  entryFees: number | null;
  cameraFees: number | null;
  petsFriendly: boolean;
  kidsFriendly: boolean;
  matchScore: number;
  matchReasons: string[];
  category?: string;
}

function normalizeVibe(place: { vibe?: string | string[] | null }): string[] {
  const v = place.vibe;
  if (Array.isArray(v)) return v;
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim());
  return [];
}

const WEIGHTS = {
  vibe: 50,
  budget: 30,
  companions: 15,
  timeOfDay: 5,
};

export function calculatePlaceMatch(
  place: any,
  preferences: SurveyAnswers
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const placeVibe = normalizeVibe(place);
  const preferredVibes = (preferences.vibe as string[]) || [];

  if (preferredVibes.length > 0) {
    const matchingVibes = placeVibe.filter((v) => preferredVibes.includes(v));
    const vibeScore = (matchingVibes.length / preferredVibes.length) * WEIGHTS.vibe;
    score += vibeScore;
    if (matchingVibes.length > 0) {
      reasons.push(`Matches your ${matchingVibes.join(", ")} vibe`);
    }
    if (preferredVibes.includes("photography") && placeVibe.includes("photography")) {
      reasons.push("Great for photography!");
    }
  }

  const budget = preferences.budget as string;
  const entryFee = place.entryFees ?? place.entranceFee ?? 0;
  let budgetScore = 0;
  if (budget === "low" && entryFee <= 50) {
    budgetScore = WEIGHTS.budget;
    reasons.push(entryFee === 0 ? "Free entry" : "Within your per-place budget");
  } else if (budget === "medium" && entryFee > 50 && entryFee <= 200) {
    budgetScore = WEIGHTS.budget;
    reasons.push("Within your per-place budget");
  } else if (budget === "high" && entryFee > 200) {
    budgetScore = WEIGHTS.budget;
    reasons.push("Premium range");
  } else if (budget === "high" && entryFee <= 200) {
    budgetScore = WEIGHTS.budget * 0.5;
  } else if (budget === "low" && entryFee > 50) {
    budgetScore = WEIGHTS.budget * 0.25;
  } else if (budget === "medium" && (entryFee <= 50 || entryFee > 200)) {
    budgetScore = WEIGHTS.budget * 0.25;
  }
  score += budgetScore;

  const companions = (preferences.companions as string[]) || [];
  let companionScore = 0;
  if (companions.includes("kids") && place.kidsFriendly !== false) {
    companionScore += 5;
    reasons.push("Kid-friendly");
  } else if (companions.includes("kids") && place.kidsFriendly === false) {
    companionScore -= 5;
  }
  if (companions.includes("pets") && place.petsFriendly === true) {
    companionScore += 5;
    reasons.push("Pet-friendly");
  } else if (companions.includes("pets") && place.petsFriendly !== true) {
    companionScore -= 5;
  }
  if (companions.includes("elderly")) companionScore += 3;
  if ((companions.includes("romantic") || companions.includes("partner")) && placeVibe.includes("romantic")) {
    companionScore += 5;
    reasons.push("Perfect for couples");
  }
  score += Math.max(0, Math.min(WEIGHTS.companions, companionScore));

  const timeOfDay = (preferences.timeOfDay as string[]) || [];
  if (timeOfDay.length > 0) score += WEIGHTS.timeOfDay;

  score = Math.max(0, Math.min(100, score));
  return { score, reasons };
}

const TOP_PLACES_LIMIT = 24;

export function getTopRecommendations(
  places: any[],
  preferences: SurveyAnswers,
  limit?: number
): PlaceRecommendation[] {
  const returnCount = limit ?? TOP_PLACES_LIMIT;

  const scoredPlaces = places.map((place) => {
    const { score, reasons } = calculatePlaceMatch(place, preferences);
    return {
      ...place,
      matchScore: score,
      matchReasons: reasons,
    };
  });

  return scoredPlaces
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, returnCount)
    .map((place) => ({
      id: place.id,
      title: place.title ?? place.name,
      description: place.description ?? "",
      images: place.images ?? [],
      latitude: place.latitude,
      longitude: place.longitude,
      address: place.address ?? "",
      vibe: normalizeVibe(place),
      entryFees: place.entryFees ?? place.entranceFee ?? null,
      cameraFees: place.cameraFees ?? place.cameraFee ?? null,
      petsFriendly: place.petsFriendly === true,
      kidsFriendly: place.kidsFriendly !== false,
      matchScore: place.matchScore,
      matchReasons: place.matchReasons,
      ...(place.category && { category: place.category }),
    }));
}

