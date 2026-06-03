import { isPlannerAiConfigured, PLANNER_AI_REQUIRED_MESSAGE } from "@/lib/ai/config";
import { curateAssistantRecommendationsWithLmStudio } from "@/lib/planner/curateAssistantRecommendationsLmStudio";
import { getAssistantCandidatePlaces } from "@/lib/planner/getAssistantCandidatePlaces";
import { collectUserMessageText } from "@/lib/planner/detectSignalsFromText";
import { searchPlacesByCategory } from "@/lib/planner/searchPlacesByCategory";
import { applyUserConfirmedFields } from "@/lib/planner/applyUserConfirmedFields";
import { gatheringTurn } from "@/lib/planner/gatheringFields";
import { getPrimaryStopOnlyType } from "@/lib/planner/primaryStopTrip";
import { rankCandidatesForTrip } from "@/lib/planner/scoreCandidatesForTrip";
import { BUDGET_TIER_MAX_EGP } from "@/lib/planner/parseBudgetFromText";
import {
  buildCategoryBrowseQuickReplies,
  categoryBrowseChipLabel,
  categoryDisplayLabel,
  getPendingBrowseCategory,
  initCategoryBrowse,
  isCategoryBrowseComplete,
  isShowMoreSameCategoryMessage,
  placeMatchesBrowseCategory,
  profileForCategoryBrowseStep,
  resolveCategoryBrowseAdvance,
} from "@/lib/planner/categoryBrowse";
import { interpretTripProfileWithLmStudio } from "@/lib/planner/parseTripProfileFromLmStudio";
import {
  applyFoodStopPolicy,
  createEmptyTripProfile,
  getMissingCriticalFields,
  isFoodStopCategory,
  isProfileReady,
  mergeTripProfile,
  normalizeTripProfile,
  profileForMainPlaceRetrieval,
  resolveEffectiveWantsStop,
  shouldForceReady,
  userExplicitlyWantsFoodStop,
  type AssistantPhase,
  type PlannerChatMessage,
  type StopType,
  type TripProfile,
} from "@/lib/planner/tripProfile";
import {
  RECOMMENDATIONS_MAX,
  sortRecommendationsByMatchScore,
} from "@/lib/planner/recommendationLimits";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";
import { PlaceCategory, PlaceType } from "@prisma/client";

export type PlannerAssistantRequest = {
  messages: PlannerChatMessage[];
  tripProfile: TripProfile | null;
  userMessage: string;
  excludePlaceIds?: string[];
};

export type PlannerAssistantResponse = {
  assistantMessage: string;
  tripProfile: TripProfile;
  quickReplies?: string[];
  phase: AssistantPhase;
  recommendations?: PlaceRecommendation[];
};

function resolvePhase(profile: TripProfile): AssistantPhase {
  return profile.confidence === "ready" ? "recommendations" : "gathering";
}

function withoutFoodStops(recs: PlaceRecommendation[]): PlaceRecommendation[] {
  return recs.filter((r) => !isFoodStopCategory(r.category));
}

function finalizeMainRecommendations(
  curated: PlaceRecommendation[],
  candidates: PlaceRecommendation[],
  profile: TripProfile,
  allowFood: boolean
): PlaceRecommendation[] {
  const limit = RECOMMENDATIONS_MAX;
  let pool = allowFood ? [...curated] : withoutFoodStops(curated);
  const used = new Set(pool.map((r) => r.id));
  const extras = rankCandidatesForTrip(
    allowFood ? candidates : withoutFoodStops(candidates),
    profile
  );
  for (const r of extras) {
    if (pool.length >= limit) break;
    if (used.has(r.id)) continue;
    used.add(r.id);
    pool.push(r);
  }
  if (pool.some((r) => r.matchScore <= 0)) {
    pool = rankCandidatesForTrip(pool, profile);
  }
  return sortRecommendationsByMatchScore(pool).slice(0, limit);
}

function resolveUserFoodStopType(
  profile: TripProfile,
  conversationText: string
): StopType | undefined {
  if (!userExplicitlyWantsFoodStop(conversationText)) return undefined;
  return resolveEffectiveWantsStop(profile, { userMessageText: conversationText });
}

function isStopListingRequest(message: string): boolean {
  const t = message.trim().toLowerCase().replace(/^["']+|["']+$/g, "");
  if (/^show (coffee shops?|cafes?|cafés?|restaurants?)\b/.test(t)) return true;
  if (/^(coffee shop|restaurant) stop\b/.test(t)) return true;
  return false;
}

function stopTypeFromListingRequest(message: string, profile: TripProfile): StopType | undefined {
  const effective = resolveEffectiveWantsStop(profile);
  const t = message.trim().toLowerCase();
  if (/^show restaurants?\b/.test(t) || /^restaurant stop\b/.test(t)) return "restaurant";
  if (/^show (coffee shops?|cafes?|cafés?)\b/.test(t) || /^coffee shop stop\b/.test(t)) {
    return effective === "restaurant" ? "restaurant" : "cafe";
  }
  return effective;
}

async function stopRecommendationsForProfile(
  profile: TripProfile,
  stopType: "cafe" | "restaurant",
  limit: number
): Promise<PlaceRecommendation[]> {
  const petsOnly = (profile.companions ?? []).includes("pets");
  const kidsOk = (profile.companions ?? []).includes("kids");
  const isCafe = stopType === "cafe";
  const budgets = profile.budgetPerPlace ?? [];
  let maxEntranceFee: number | undefined;
  if (budgets.length > 0 && !budgets.includes("high")) {
    maxEntranceFee = budgets.includes("medium")
      ? BUDGET_TIER_MAX_EGP.medium
      : BUDGET_TIER_MAX_EGP.low;
  }
  let recs = await searchPlacesByCategory({
    category: isCafe ? PlaceCategory.cafe : PlaceCategory.restaurant,
    placeType: isCafe ? PlaceType.cafe : PlaceType.restaurant,
    petsOnly,
    kidsOk,
    maxEntranceFee,
    limit,
  });
  recs = recs.map((r) => {
    let score = 70;
    const reasons: string[] = [];
    if (petsOnly && r.petsFriendly) {
      score = 92;
      reasons.push("Pet-friendly");
    }
    if (kidsOk && r.kidsFriendly) reasons.push("Good for your group");
    if (reasons.length === 0) reasons.push(isCafe ? "Coffee shop" : "Restaurant");
    return { ...r, matchScore: score, matchReasons: reasons };
  });
  recs.sort((a, b) => b.matchScore - a.matchScore);
  return recs;
}

export async function runPlannerAssistantTurn(
  request: PlannerAssistantRequest
): Promise<PlannerAssistantResponse> {
  const trimmed = request.userMessage.trim();
  if (!trimmed) {
    throw new Error("Message is required");
  }

  if (!isPlannerAiConfigured()) {
    throw new Error(PLANNER_AI_REQUIRED_MESSAGE);
  }

  const forceReady = shouldForceReady(request.messages);

  const interpreted = await interpretTripProfileWithLmStudio({
    messages: request.messages,
    tripProfile: request.tripProfile,
    userMessage: trimmed,
    forceReady,
  });

  const conversationText = collectUserMessageText(request.messages, trimmed);

  let profile = mergeTripProfile(request.tripProfile, interpreted.profilePartial);
  profile = applyUserConfirmedFields(profile, request.messages, trimmed);

  profile = normalizeTripProfile(profile);
  profile = applyFoodStopPolicy(profile, conversationText);

  const ready = isProfileReady(profile);
  profile = { ...profile, confidence: ready ? "ready" : "gathering" };

  let categoryBrowse = profile.categoryBrowse ?? (ready ? initCategoryBrowse(profile) : undefined);
  if (categoryBrowse && ready) {
    const advanced = resolveCategoryBrowseAdvance(trimmed, categoryBrowse);
    if (advanced) categoryBrowse = advanced;
    profile = { ...profile, categoryBrowse };
  }

  const missing = getMissingCriticalFields(profile);
  let assistantMessage = interpreted.assistantMessage;

  const primaryStopOnly = getPrimaryStopOnlyType(profile, conversationText);

  if (profile.confidence === "ready" && primaryStopOnly && !isStopListingRequest(trimmed)) {
    const recs = await stopRecommendationsForProfile(profile, primaryStopOnly, RECOMMENDATIONS_MAX);
    return {
      assistantMessage: interpreted.assistantMessage,
      tripProfile: profile,
      phase: "recommendations",
      recommendations: recs,
    };
  }

  const wantsStopType = resolveUserFoodStopType(profile, conversationText);
  const browseComplete = isCategoryBrowseComplete(profile);
  const wantsStopListing =
    (wantsStopType === "cafe" || wantsStopType === "restaurant") && isStopListingRequest(trimmed);

  if (profile.confidence === "ready" && wantsStopListing && !browseComplete && categoryBrowse) {
    const pending = getPendingBrowseCategory(profile);
    return {
      assistantMessage: pending
        ? `Let's look at ${categoryDisplayLabel(pending).toLowerCase()} first — then we can add your ${wantsStopType === "cafe" ? "coffee shop" : "restaurant"} stop.`
        : "Let's finish browsing your place types first, then we can add a stop.",
      tripProfile: profile,
      phase: "recommendations",
      quickReplies: buildCategoryBrowseQuickReplies(categoryBrowse, { includeShowMore: true }),
    };
  }

  if (profile.confidence === "ready" && browseComplete && wantsStopListing) {
    const stopType = stopTypeFromListingRequest(trimmed, profile);
    if (stopType === "cafe" || stopType === "restaurant") {
      const recs = await stopRecommendationsForProfile(profile, stopType, RECOMMENDATIONS_MAX);
      const isCafe = stopType === "cafe";
      return {
        assistantMessage: isCafe
          ? "Here are coffee shops you can add as a stop."
          : "Here are restaurants you can add as a stop.",
        tripProfile: profile,
        phase: "recommendations",
        recommendations: recs,
      };
    }
  }

  if (!ready && missing.length > 0) {
    const turn = gatheringTurn(missing);
    if (turn) {
      return {
        assistantMessage: turn.message,
        tripProfile: profile.summary ? profile : mergeTripProfile(createEmptyTripProfile(), profile),
        quickReplies: turn.chips,
        phase: "gathering",
      };
    }
  }

  let recommendations: PlaceRecommendation[] | undefined;
  let stopQuickReplies: string[] | undefined;
  const browseActive = Boolean(categoryBrowse && categoryBrowse.queue.length >= 2);
  const activeBrowseCategory = browseActive ? categoryBrowse!.queue[categoryBrowse!.activeIndex]! : undefined;
  const onLastBrowseCategory =
    !browseActive || categoryBrowse!.activeIndex >= categoryBrowse!.queue.length - 1;

  if (ready) {
    try {
      const baseRetrievalProfile = profileForMainPlaceRetrieval(profile);
      const retrievalProfile = activeBrowseCategory
        ? profileForCategoryBrowseStep(baseRetrievalProfile, activeBrowseCategory)
        : baseRetrievalProfile;
      const { candidates, retrievalText } = await getAssistantCandidatePlaces({
        profile: retrievalProfile,
        excludePlaceIds: request.excludePlaceIds,
        candidateLimit: 120,
      });
      recommendations = await curateAssistantRecommendationsWithLmStudio({
        retrievalText,
        candidates,
      });

      const allowFoodInRecs = wantsStopType === "cafe" || wantsStopType === "restaurant";
      recommendations = finalizeMainRecommendations(
        recommendations ?? [],
        candidates,
        profile,
        allowFoodInRecs
      );

      if (recommendations.length > 0 && activeBrowseCategory) {
        recommendations = recommendations
          .filter((r) => placeMatchesBrowseCategory(r, activeBrowseCategory))
          .slice(0, RECOMMENDATIONS_MAX);
      }

    } catch (err) {
      console.warn("[planner-assistant] recommendations failed; skipping:", err);
      recommendations = undefined;
    }

    if (onLastBrowseCategory) {
      if (wantsStopType === "cafe") {
        stopQuickReplies = ["Show coffee shops", "No extra stop"];
      } else if (wantsStopType === "restaurant") {
        stopQuickReplies = ["Show restaurants", "No extra stop"];
      } else {
        stopQuickReplies = ["Coffee shop stop", "Restaurant stop", "No extra stop"];
      }
    }
  }

  let finalMessage = assistantMessage;
  if (recommendations && recommendations.length > 0) {
    if (activeBrowseCategory) {
      const label = categoryDisplayLabel(activeBrowseCategory);
      const nextCat = categoryBrowse!.queue[categoryBrowse!.activeIndex + 1];
      finalMessage = `Here are ${label} that match your trip. Pick any you like.`;
      if (nextCat) {
        finalMessage += `\n\nWhen you're ready, tap "${categoryBrowseChipLabel(nextCat)}" to see ${categoryDisplayLabel(nextCat).toLowerCase()} next.`;
      }
    } else if (!finalMessage.toLowerCase().includes("here")) {
      finalMessage = `${finalMessage} Here are ${recommendations.length} places that match your trip.`;
    }
  } else if (ready) {
    const isShowMore = isShowMoreSameCategoryMessage(trimmed);
    const hadExclusions = (request.excludePlaceIds?.length ?? 0) > 0;

    if (isShowMore && hadExclusions) {
      profile = { ...profile, confidence: "ready" };
      if (wantsStopType === "cafe") {
        stopQuickReplies = ["Show coffee shops", "No extra stop"];
      } else if (wantsStopType === "restaurant") {
        stopQuickReplies = ["Show restaurants", "No extra stop"];
      }
    } else {
      profile = { ...profile, confidence: "gathering" };
      stopQuickReplies = undefined;
    }
  }

  let outputQuickReplies: string[] | undefined;
  if (profile.confidence === "ready") {
    if (browseActive && categoryBrowse) {
      const browseReplies = buildCategoryBrowseQuickReplies(categoryBrowse, { includeShowMore: true });
      outputQuickReplies = onLastBrowseCategory
        ? [...browseReplies, ...(stopQuickReplies ?? [])]
        : browseReplies;
    } else {
      outputQuickReplies = stopQuickReplies;
    }
  } else {
    outputQuickReplies = gatheringTurn(missing)?.chips ?? interpreted.quickReplies;
  }

  return {
    assistantMessage: finalMessage,
    tripProfile: profile.summary ? profile : mergeTripProfile(createEmptyTripProfile(), profile),
    quickReplies: outputQuickReplies,
    phase: resolvePhase(profile),
    recommendations,
  };
}
