import type { PlaceType } from "@prisma/client";

import { embedSingleText } from "@/lib/ai/lmStudioEmbeddings";
import {
  getAiPlannerConfig,
  isAiPlannerEnabled,
  isPlannerChatRerankEnabled,
} from "@/lib/ai/config";
import { buildSurveyEmbeddingSource } from "@/lib/planner/buildSurveyEmbeddingSource";
import { mergeRuleAndVectorRecommendations } from "@/lib/planner/mergeHybridRecommendations";
import type { PlannerAiTelemetry } from "@/lib/planner/plannerAiTelemetry";
import { logPlannerAiTelemetry } from "@/lib/planner/plannerAiTelemetry";
import { rerankRecommendationsWithLmStudio } from "@/lib/planner/rerankRecommendationsLmStudio";
import { searchPlaceIdsBySimilarity } from "@/lib/places/searchPlacesByVector";
import type { SurveyAnswers } from "@/lib/planner/survey";
import type { PlaceForRecommendation, PlaceRecommendation } from "@/utils/planner/recommendation";
import { getTopRecommendations } from "@/utils/planner/recommendation";

export async function tryHybridSurveyRecommendations(options: {
  route: string;
  inputPlaces: PlaceForRecommendation[];
  preferences: SurveyAnswers;
  placeType: PlaceType;
  finalLimit: number;
}): Promise<{
  recommendations: PlaceRecommendation[];
  telemetry: PlannerAiTelemetry;
}> {
  const { route, inputPlaces, preferences, placeType, finalLimit } = options;

  const emptyTelemetry = (): PlannerAiTelemetry => ({
    route,
    embedMs: null,
    vectorMs: null,
    rerankMs: null,
    fallback: "none",
  });

  let recommendations = getTopRecommendations(inputPlaces, preferences, finalLimit);

  if (!isAiPlannerEnabled()) {
    return { recommendations, telemetry: emptyTelemetry() };
  }

  const telemetry = emptyTelemetry();
  try {
    const cfg = getAiPlannerConfig();
    const surveyText = buildSurveyEmbeddingSource(preferences);

    const tEmbed0 = Date.now();
    const embedding = await embedSingleText(surveyText);
    telemetry.embedMs = Date.now() - tEmbed0;

    const tVec0 = Date.now();
    const ruleRecs = getTopRecommendations(inputPlaces, preferences, cfg.ruleTopK);
    const vecRows = await searchPlaceIdsBySimilarity({
      embedding,
      placeType,
      limit: cfg.vectorTopK,
    });
    telemetry.vectorMs = Date.now() - tVec0;

    const vectorIds = vecRows.map((r) => r.placeId);
    recommendations = mergeRuleAndVectorRecommendations(
      ruleRecs,
      vectorIds,
      inputPlaces,
      preferences,
      finalLimit
    );

    if (isPlannerChatRerankEnabled()) {
      const tRr0 = Date.now();
      try {
        recommendations = await rerankRecommendationsWithLmStudio({
          surveyText,
          recommendations,
        });
        telemetry.rerankMs = Date.now() - tRr0;
      } catch (rerankErr) {
        telemetry.rerankMs = Date.now() - tRr0;
        telemetry.fallback = "rerank_skipped";
        console.warn(`[planner-ai] ${route} chat rerank failed; hybrid order kept:`, rerankErr);
      }
    }
  } catch (err) {
    telemetry.fallback = "hybrid_failed";
    console.warn(`[planner-ai] ${route} hybrid (embeddings + vector) failed; rule-only:`, err);
    recommendations = getTopRecommendations(inputPlaces, preferences, finalLimit);
  }

  logPlannerAiTelemetry(telemetry);
  return { recommendations, telemetry };
}
