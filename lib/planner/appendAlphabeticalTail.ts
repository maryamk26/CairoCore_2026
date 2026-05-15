import type { SurveyAnswers } from "@/lib/planner/survey";
import type { PlaceForRecommendation, PlaceRecommendation } from "@/utils/planner/recommendation";
import { formatPlaceRecommendation } from "@/utils/planner/recommendation";

export function appendAlphabeticalTail(
  head: PlaceRecommendation[],
  inputPlaces: PlaceForRecommendation[],
  preferences: SurveyAnswers
): PlaceRecommendation[] {
  const headIds = new Set(head.map((r) => r.id));
  const tailInputs = inputPlaces
    .filter((p) => !headIds.has(p.id))
    .sort((a, b) =>
      (a.name ?? a.title ?? "").localeCompare(b.name ?? b.title ?? "", undefined, {
        sensitivity: "base",
      })
    );
  const tail = tailInputs.map((p) => formatPlaceRecommendation(p, preferences));
  return [...head, ...tail];
}
