import type { SurveyAnswers } from "@/lib/planner/survey";
import type { PlaceForRecommendation, PlaceRecommendation } from "@/utils/planner/recommendation";
import { formatPlaceRecommendation } from "@/utils/planner/recommendation";

export function mergeRuleAndVectorRecommendations(
  ruleRecs: PlaceRecommendation[],
  vectorPlaceIdsOrdered: string[],
  inputPlaces: PlaceForRecommendation[],
  preferences: SurveyAnswers,
  finalLimit: number
): PlaceRecommendation[] {
  const byId = new Map(inputPlaces.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const out: PlaceRecommendation[] = [];

  for (const r of ruleRecs) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }

  for (const vid of vectorPlaceIdsOrdered) {
    if (seen.has(vid)) continue;
    const place = byId.get(vid);
    if (!place) continue;
    seen.add(vid);
    out.push(formatPlaceRecommendation(place, preferences));
  }

  return out.slice(0, finalLimit);
}
