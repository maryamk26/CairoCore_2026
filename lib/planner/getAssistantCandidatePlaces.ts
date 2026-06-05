import { PlaceType } from "@prisma/client";

import { getAiPlannerConfig, isAiPlannerEnabled } from "@/lib/ai/config";
import {
  mapPlannerRowToRecommendation,
  PLANNER_PLACE_SELECT,
  type PlannerPlaceRow,
} from "@/lib/planner/mapDbPlaceForRecommendation";
import { buildTripProfileRetrievalText } from "@/lib/planner/buildTripProfileRetrievalText";
import { BUDGET_TIER_MAX_EGP } from "@/lib/planner/parseBudgetFromText";
import { prisma } from "@/lib/prisma";
import {
  isFoodStopCategory,
  profileForMainPlaceRetrieval,
  type TripProfile,
} from "@/lib/planner/tripProfile";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";
import { embedSingleText } from "@/lib/ai/lmStudioEmbeddings";
import { searchPlaceIdsBySimilarity } from "@/lib/places/searchPlacesByVector";
import {
  mapProfileVibesToPlaceVibes,
  rankCandidatesForTrip,
} from "@/lib/planner/scoreCandidatesForTrip";

export type CandidateResult = {
  candidates: PlaceRecommendation[];
  retrievalText: string;
};

function placeHasAnyVibe(place: PlannerPlaceRow, desired: string[]): boolean {
  if (desired.length === 0) return true;
  const set = new Set(desired.map((x) => x.toLowerCase()));
  const vibes: string[] = [];
  if (typeof place.vibe === "string" && place.vibe.trim()) vibes.push(place.vibe.trim().toLowerCase());
  if (Array.isArray(place.vibes)) {
    for (const v of place.vibes) {
      if (typeof v === "string" && v.trim()) vibes.push(v.trim().toLowerCase());
    }
  }
  return vibes.some((v) => set.has(v));
}

function applyHardFilters(rows: PlannerPlaceRow[], profile: TripProfile): PlannerPlaceRow[] {
  let out = rows;
  const companions = profile.companions ?? [];
  const desiredVibes = mapProfileVibesToPlaceVibes(profile.vibes);
  const desiredCategories = Array.isArray(profile.categories)
    ? profile.categories.map((c) => String(c).trim().toLowerCase()).filter(Boolean)
    : [];
  const desiredTimes = Array.isArray(profile.visitTimes)
    ? profile.visitTimes.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    : [];
  if (companions.includes("kids")) {
    out = out.filter((p) => p.kidsFriendly !== false);
  }
  if (companions.includes("pets")) {
    out = out.filter((p) => p.petsFriendly !== false);
  }
  if (desiredVibes.length > 0) {
    out = out.filter((p) => placeHasAnyVibe(p, desiredVibes));
  }
  if (desiredCategories.length > 0) {
    out = out.filter((p) => {
      const c = p.category ? String(p.category).toLowerCase() : "";
      return c && desiredCategories.includes(c);
    });
  }
  if (desiredTimes.length > 0) {
    out = out.filter((p) => {
      const t = p.bestVisitTime ? String(p.bestVisitTime).toLowerCase() : "";
      if (!t) return true;
      return desiredTimes.some((x) => t.includes(x));
    });
  }

  const budgets = profile.budgetPerPlace ?? [];
  const allowLow = budgets.includes("low");
  const allowMed = budgets.includes("medium");
  const allowHigh = budgets.includes("high") || budgets.length === 0;
  if (!allowHigh) {
    const maxFee = allowMed
      ? BUDGET_TIER_MAX_EGP.medium
      : allowLow
        ? BUDGET_TIER_MAX_EGP.low
        : undefined;
    if (typeof maxFee === "number" && Number.isFinite(maxFee)) {
      out = out.filter((p) => (p.entranceFee ?? 0) <= maxFee);
    }
  }
  return out;
}

function buildHardWhere(profile: TripProfile): Record<string, unknown> {
  const companions = profile.companions ?? [];
  const budgets = profile.budgetPerPlace ?? [];
  const desiredVibes = mapProfileVibesToPlaceVibes(profile.vibes);
  const desiredCategories = Array.isArray(profile.categories)
    ? profile.categories.map((c) => String(c).trim()).filter(Boolean)
    : [];
  const desiredTimes = Array.isArray(profile.visitTimes)
    ? profile.visitTimes.map((t) => String(t).trim()).filter(Boolean)
    : [];

  const where: Record<string, unknown> = {};
  const and: Record<string, unknown>[] = [];

  if (companions.includes("kids")) {
    and.push({ OR: [{ kidsFriendly: null }, { kidsFriendly: true }] });
  }
  if (companions.includes("pets")) {
    and.push({ OR: [{ petsFriendly: null }, { petsFriendly: true }] });
  }

  if (desiredVibes.length > 0) {
    and.push({
      OR: [{ vibe: { in: desiredVibes } }, { vibes: { hasSome: desiredVibes } }],
    });
  }
  if (desiredCategories.length > 0) {
    and.push({ category: { in: desiredCategories } });
  }
  if (desiredTimes.length > 0) {
    and.push({
      OR: [
        { bestVisitTime: null },
        ...desiredTimes.map((t) => ({ bestVisitTime: { contains: t, mode: "insensitive" } })),
      ],
    });
  }

  const allowLow = budgets.includes("low");
  const allowMed = budgets.includes("medium");
  const allowHigh = budgets.includes("high") || budgets.length === 0;
  if (!allowHigh) {
    const maxFee = allowMed
      ? BUDGET_TIER_MAX_EGP.medium
      : allowLow
        ? BUDGET_TIER_MAX_EGP.low
        : undefined;
    if (typeof maxFee === "number" && Number.isFinite(maxFee)) {
      and.push({ OR: [{ entranceFee: null }, { entranceFee: { lte: maxFee } }] });
    }
  }

  if (and.length > 0) where.AND = and;
  return where;
}

async function fetchCandidatesForProfile(options: {
  profile: TripProfile;
  placeType: PlaceType;
  limit: number;
  excludeIds: string[];
}): Promise<{ rows: PlannerPlaceRow[]; retrievalText: string }> {
  const { profile, placeType, limit, excludeIds } = options;
  const retrievalText = buildTripProfileRetrievalText(profile);
  const baseWhere: Record<string, unknown> = {
    type: placeType,
    ...buildHardWhere(profile),
    ...(excludeIds.length > 0 ? { NOT: { id: { in: excludeIds } } } : {}),
  };

  if (!isAiPlannerEnabled()) {
    throw new Error(
      "Place retrieval requires AI_PLANNER_ENABLED and embedded places (pgvector)."
    );
  }

  try {
    const embedding = await embedSingleText(retrievalText);
    const vecRows = await searchPlaceIdsBySimilarity({
      embedding,
      placeType,
      limit: Math.min(200, Math.max(limit * 3, 60)),
    });
    const ids = vecRows.map((r) => r.placeId).filter((id) => !excludeIds.includes(id));
    if (ids.length === 0) throw new Error("vector returned no ids");

    const rows = await prisma.place.findMany({
      where: { ...baseWhere, id: { in: ids } } as any,
      select: PLANNER_PLACE_SELECT,
    });
    const byId = new Map(rows.map((r) => [r.id, r]));
    const ordered: PlannerPlaceRow[] = [];
    for (const id of ids) {
      const row = byId.get(id);
      if (!row) continue;
      ordered.push(row);
      if (ordered.length >= limit) break;
    }
    return { rows: applyHardFilters(ordered, profile), retrievalText };
  } catch (err) {
    throw new Error(
      err instanceof Error ? err.message : "Vector retrieval failed; check LM Studio embeddings."
    );
  }
}

export async function getAssistantCandidatePlaces(options: {
  profile: TripProfile;
  placeType?: PlaceType;
  candidateLimit?: number;
  excludePlaceIds?: string[];
}): Promise<CandidateResult> {
  const placeType = options.placeType ?? PlaceType.place_to_visit;
  const limit = Math.max(8, Math.min(120, options.candidateLimit ?? getAiPlannerConfig().vectorTopK));
  const retrievalProfile = profileForMainPlaceRetrieval(options.profile);
  const excludeIds = (options.excludePlaceIds ?? []).filter((x) => typeof x === "string" && x.trim());
  const wantsPets = (retrievalProfile.companions ?? []).includes("pets");
  const MIN_RESULTS = 24;

  let { rows, retrievalText } = await fetchCandidatesForProfile({
    profile: retrievalProfile,
    placeType,
    limit,
    excludeIds,
  });

  const hadVibeFilter = (options.profile.vibes?.length ?? 0) > 0;
  if (rows.length < MIN_RESULTS && (options.profile.visitTimes?.length ?? 0) > 0) {
    const relaxed: TripProfile = {
      ...retrievalProfile,
      visitTimes: undefined,
    };
    const retry = await fetchCandidatesForProfile({
      profile: relaxed,
      placeType,
      limit,
      excludeIds,
    });
    if (retry.rows.length > rows.length) {
      rows = retry.rows;
      retrievalText = retry.retrievalText;
    }
  }

  if (hadVibeFilter) {
    const desiredVibes = mapProfileVibesToPlaceVibes(options.profile.vibes);
    const strictRows = rows.filter((p) => placeHasAnyVibe(p, desiredVibes));
    if (strictRows.length < MIN_RESULTS && strictRows.length < rows.length) {
      rows = strictRows;
    } else if (strictRows.length < MIN_RESULTS) {
      const supplemental = await fetchCandidatesForProfile({
        profile: { ...retrievalProfile, vibes: undefined, visitTimes: undefined },
        placeType,
        limit,
        excludeIds,
      });
      const strictIds = new Set(strictRows.map((r) => r.id));
      const extra = supplemental.rows.filter((r) => !strictIds.has(r.id));
      if (extra.length > 0) {
        rows = [...strictRows, ...extra];
      } else {
        rows = strictRows;
      }
    } else {
      rows = strictRows;
    }
  }

  let filtered = rows;
  if (wantsPets && filtered.length < MIN_RESULTS) {
    const relaxedProfile = {
      ...retrievalProfile,
      companions: (retrievalProfile.companions ?? []).filter((c) => c !== "pets"),
    };
    const retry = await fetchCandidatesForProfile({
      profile: relaxedProfile,
      placeType,
      limit,
      excludeIds,
    });
    filtered = retry.rows;
    retrievalText = retry.retrievalText;
  }

  let candidates = filtered
    .map((place) => mapPlannerRowToRecommendation(place))
    .filter((c) => !isFoodStopCategory(c.category));
  if (hadVibeFilter && candidates.length > 0) {
    candidates = rankCandidatesForTrip(candidates, options.profile);
  }

  return { candidates, retrievalText };
}
