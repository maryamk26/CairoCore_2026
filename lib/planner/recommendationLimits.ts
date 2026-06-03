import type { PlaceRecommendation } from "@/utils/planner/recommendation";

export const RECOMMENDATIONS_PAGE_SIZE = 12;
export const RECOMMENDATIONS_MAX = 24;

export function sortRecommendationsByMatchScore(
  recs: PlaceRecommendation[]
): PlaceRecommendation[] {
  return [...recs].sort((a, b) => {
    const d = (b.matchScore ?? 0) - (a.matchScore ?? 0);
    if (d !== 0) return d;
    return a.title.localeCompare(b.title);
  });
}
