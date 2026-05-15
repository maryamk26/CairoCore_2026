export type AiPlannerConfig = {
  enabled: boolean;
  lmStudioBaseUrl: string;
  lmStudioEmbeddingModel: string;
  lmStudioChatModel: string;
  timeoutMs: number;
  chatTimeoutMs: number;
  ruleTopK: number;
  vectorTopK: number;
  embeddingDimensions: number;
  autoEmbedOnPlaceWrite: boolean;
  stopsHybridHeadLimit: number;
};

function envString(key: string, fallback: string): string {
  const v = process.env[key];
  if (v == null) return fallback;
  const t = v.trim();
  return t === "" ? fallback : t;
}

function envBoolFalse(key: string): boolean {
  const v = process.env[key]?.trim().toLowerCase();
  if (v == null || v === "") return false;
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function envBoolDefaultTrue(key: string): boolean {
  const v = process.env[key]?.trim().toLowerCase();
  if (v == null || v === "") return true;
  if (v === "0" || v === "false" || v === "no" || v === "off") return false;
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

function envInt(key: string, fallback: number, min: number, max: number): number {
  const raw = process.env[key]?.trim();
  if (raw == null || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function getAiPlannerConfig(): AiPlannerConfig {
  return {
    enabled: envBoolFalse("AI_PLANNER_ENABLED"),
    lmStudioBaseUrl: envString("LM_STUDIO_BASE_URL", "http://127.0.0.1:1234/v1").replace(
      /\/+$/,
      ""
    ),
    lmStudioEmbeddingModel: envString(
      "LM_STUDIO_EMBEDDING_MODEL",
      "text-embedding-embeddinggemma-300m-qat"
    ),
    lmStudioChatModel: envString("LM_STUDIO_CHAT_MODEL", ""),
    timeoutMs: envInt("AI_PLANNER_TIMEOUT_MS", 8000, 1000, 120_000),
    chatTimeoutMs: envInt("AI_PLANNER_CHAT_TIMEOUT_MS", 120_000, 5000, 600_000),
    ruleTopK: envInt("AI_PLANNER_RULE_TOP_K", 40, 5, 200),
    vectorTopK: envInt("AI_PLANNER_VECTOR_TOP_K", 40, 5, 200),
    embeddingDimensions: envInt("AI_PLANNER_EMBEDDING_DIMENSIONS", 768, 32, 4096),
    autoEmbedOnPlaceWrite: envBoolDefaultTrue("AI_PLANNER_AUTO_EMBED_ON_WRITE"),
    stopsHybridHeadLimit: envInt("AI_PLANNER_STOPS_HEAD_LIMIT", 48, 12, 200),
  };
}

export function isAiPlannerEnabled(): boolean {
  return getAiPlannerConfig().enabled;
}

export function isPlannerChatRerankEnabled(): boolean {
  const c = getAiPlannerConfig();
  return c.enabled && c.lmStudioChatModel.trim() !== "";
}

export function shouldAutoEmbedPlaceOnWrite(): boolean {
  const c = getAiPlannerConfig();
  return c.enabled && c.autoEmbedOnPlaceWrite;
}
