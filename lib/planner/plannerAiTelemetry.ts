export type PlannerAiTelemetry = {
  route: string;
  embedMs: number | null;
  vectorMs: number | null;
  rerankMs: number | null;
  fallback: "none" | "hybrid_failed" | "rerank_skipped";
};

export function logPlannerAiTelemetry(t: PlannerAiTelemetry): void {
  console.info(
    "[planner-ai]",
    JSON.stringify({
      route: t.route,
      embedMs: t.embedMs,
      vectorMs: t.vectorMs,
      rerankMs: t.rerankMs,
      fallback: t.fallback,
    })
  );
}
