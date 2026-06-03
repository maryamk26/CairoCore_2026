import { BUDGET_TIER_MAX_EGP } from "@/lib/planner/parseBudgetFromText";
import type { TripProfile } from "@/lib/planner/tripProfile";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function mapProfileVibesToPlaceVibes(vibes: string[] | undefined): string[] {
  if (!Array.isArray(vibes) || vibes.length === 0) return [];
  const out: string[] = [];
  for (const v of vibes) {
    const t = String(v).trim().toLowerCase();
    if (!t) continue;
    if (t === "cultural") out.push("traditional");
    else out.push(t);
  }
  return [...new Set(out)];
}

function placeVibeList(place: PlaceRecommendation): string[] {
  return (place.vibe ?? []).map((v) => String(v).trim().toLowerCase()).filter(Boolean);
}

export function placeMatchesRequestedVibes(
  place: PlaceRecommendation,
  profile: TripProfile
): boolean {
  const desired = mapProfileVibesToPlaceVibes(profile.vibes);
  if (desired.length === 0) return true;
  const placeVibes = placeVibeList(place);
  return desired.some((d) => placeVibes.includes(d));
}

export function orderPlaceVibesForDisplay(
  vibes: string[] | undefined,
  preferred: string[] | undefined
): string[] {
  if (!vibes?.length) return [];
  if (!preferred?.length) return vibes.slice(0, 3);
  const pref = new Set(preferred.map((p) => p.toLowerCase()));
  const front = vibes.filter((v) => pref.has(v.toLowerCase()));
  const back = vibes.filter((v) => !pref.has(v.toLowerCase()));
  return [...front, ...back].slice(0, 3);
}

export function scorePlaceForTrip(
  place: PlaceRecommendation,
  profile: TripProfile
): { matchScore: number; matchReasons: string[] } {
  const reasons: string[] = [];
  let score = 40;

  const desiredVibes = mapProfileVibesToPlaceVibes(profile.vibes);
  const placeVibes = placeVibeList(place);

  if (desiredVibes.length > 0) {
    const matched = desiredVibes.filter((d) => placeVibes.includes(d));
    if (matched.length > 0) {
      const vibeBoost = Math.round(45 * (matched.length / desiredVibes.length));
      score += vibeBoost;
      reasons.push(
        matched.length === 1
          ? `${matched[0].charAt(0).toUpperCase()}${matched[0].slice(1)} vibe`
          : `${matched.map((v) => v.charAt(0).toUpperCase() + v.slice(1)).join(" & ")} vibes`
      );
    } else {
      score -= 25;
      reasons.push("Different vibe than requested");
    }
  }

  const companions = profile.companions ?? [];
  if (companions.includes("partner") && placeVibes.includes("romantic")) {
    score += 8;
    if (!reasons.some((r) => r.toLowerCase().includes("romantic"))) {
      reasons.push("Good for couples");
    }
  }
  if (companions.includes("kids") && place.kidsFriendly) {
    score += 5;
    reasons.push("Kids-friendly");
  }
  if (companions.includes("pets") && place.petsFriendly) {
    score += 8;
    reasons.push("Pet-friendly");
  }

  const budgets = profile.budgetPerPlace ?? [];
  if (budgets.length > 0 && !budgets.includes("high")) {
    const maxFee = budgets.includes("medium")
      ? BUDGET_TIER_MAX_EGP.medium
      : BUDGET_TIER_MAX_EGP.low;
    const fee = place.entryFees ?? 0;
    if (fee <= maxFee) {
      score += 6;
      if (fee === 0) reasons.push("Fits your budget (free entry)");
      else reasons.push("Fits your budget");
    } else {
      score -= 12;
    }
  }

  if (reasons.length === 0) reasons.push("Matches your trip profile");

  return { matchScore: clampScore(score), matchReasons: reasons.slice(0, 3) };
}

export function rankCandidatesForTrip(
  candidates: PlaceRecommendation[],
  profile: TripProfile
): PlaceRecommendation[] {
  const scored = candidates.map((c) => {
    const { matchScore, matchReasons } = scorePlaceForTrip(c, profile);
    return { ...c, matchScore, matchReasons };
  });

  const sortByScore = (a: PlaceRecommendation, b: PlaceRecommendation) => {
    const d = b.matchScore - a.matchScore;
    if (d !== 0) return d;
    return a.title.localeCompare(b.title);
  };

  const desiredVibes = mapProfileVibesToPlaceVibes(profile.vibes);
  if (desiredVibes.length === 0) {
    scored.sort(sortByScore);
    return scored;
  }

  const matching = scored.filter((c) => placeMatchesRequestedVibes(c, profile));
  const other = scored.filter((c) => !placeMatchesRequestedVibes(c, profile));
  matching.sort(sortByScore);
  other.sort(sortByScore);
  return [...matching, ...other];
}
