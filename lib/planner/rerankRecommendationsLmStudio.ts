import { getAiPlannerConfig } from "@/lib/ai/config";
import { chatCompletionLmStudio } from "@/lib/ai/lmStudioChat";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";

const DESC_PREVIEW = 280;
const MAX_REASONS = 6;
const REASON_MAX_LEN = 180;

function compactPlace(r: PlaceRecommendation) {
  return {
    id: r.id,
    title: r.title,
    description: r.description.slice(0, DESC_PREVIEW),
    category: r.category ?? "",
    vibe: r.vibe,
    matchScore: r.matchScore,
    matchReasons: r.matchReasons.slice(0, 5),
  };
}

function parseJsonFromModelContent(content: string): unknown {
  const t = content.trim().replace(/^\uFEFF/, "");
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
  const inner = fence ? fence[1].trim() : t;
  try {
    return JSON.parse(inner) as unknown;
  } catch {
    const from = inner.indexOf("{");
    const to = inner.lastIndexOf("}");
    if (from === -1 || to <= from) throw new Error("no json object");
    return JSON.parse(inner.slice(from, to + 1)) as unknown;
  }
}

function clampScore(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function sanitizeReasons(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: string[] = [];
  for (const x of raw) {
    if (typeof x !== "string") continue;
    const t = x.trim().slice(0, REASON_MAX_LEN);
    if (t) out.push(t);
    if (out.length >= MAX_REASONS) break;
  }
  return out.length > 0 ? out : null;
}

function mergeRow(
  base: PlaceRecommendation,
  row: { matchScore?: unknown; matchReasons?: unknown }
): PlaceRecommendation {
  let matchScore = base.matchScore;
  if (typeof row.matchScore === "number" && Number.isFinite(row.matchScore)) {
    matchScore = clampScore(row.matchScore);
  }
  const reasons = sanitizeReasons(row.matchReasons);
  const matchReasons = reasons ?? base.matchReasons;
  return { ...base, matchScore, matchReasons };
}

type RerankPayload = { ranked?: unknown };

export async function rerankRecommendationsWithLmStudio(input: {
  surveyText: string;
  recommendations: PlaceRecommendation[];
}): Promise<PlaceRecommendation[]> {
  const { surveyText, recommendations } = input;
  if (recommendations.length === 0) return recommendations;

  const valid = new Map(recommendations.map((r) => [r.id, r]));
  const chatModel = getAiPlannerConfig().lmStudioChatModel.toLowerCase();
  let system = [
    "You refine place recommendations for a Cairo trip planner.",
    'Reply with ONLY valid JSON: {"ranked":[{"id":"<uuid>","matchScore":0-100,"matchReasons":["reason"]}]}',
    "Rules: include every place id from the user message exactly once, best match first.",
    "Use only ids from the input; do not invent places.",
    "matchScore is 0–100. matchReasons: 1–4 short strings.",
  ].join(" ");
  if (chatModel.includes("qwen")) {
    system += " /no_think";
  }

  const userPayload = JSON.stringify({
    travelerProfile: surveyText,
    places: recommendations.map(compactPlace),
  });
  const userContent =
    chatModel.includes("qwen") && !userPayload.includes("/no_think")
      ? `${userPayload}\n/no_think`
      : userPayload;

  const preferJsonObjectFirst = !chatModel.includes("qwen");

  let raw: string;
  if (preferJsonObjectFirst) {
    try {
      raw = await chatCompletionLmStudio({
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
        jsonMode: true,
        temperature: 0.15,
        maxTokens: 8192,
      });
    } catch {
      raw = await chatCompletionLmStudio({
        messages: [
          { role: "system", content: system },
          { role: "user", content: userContent },
        ],
        jsonMode: false,
        temperature: 0.15,
        maxTokens: 8192,
      });
    }
  } else {
    raw = await chatCompletionLmStudio({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      jsonMode: false,
      temperature: 0.15,
      maxTokens: 8192,
    });
  }

  let parsed: unknown;
  try {
    parsed = parseJsonFromModelContent(raw);
  } catch {
    raw = await chatCompletionLmStudio({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      jsonMode: false,
      temperature: 0.15,
      maxTokens: 8192,
    });
    try {
      parsed = parseJsonFromModelContent(raw);
    } catch {
      throw new Error("Rerank model returned non-JSON");
    }
  }

  const ranked = (parsed as RerankPayload).ranked;
  if (!Array.isArray(ranked)) {
    throw new Error('Rerank JSON missing "ranked" array');
  }

  const used = new Set<string>();
  const out: PlaceRecommendation[] = [];

  for (const row of ranked) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    if (typeof id !== "string" || !valid.has(id) || used.has(id)) continue;
    used.add(id);
    out.push(mergeRow(valid.get(id)!, row as { matchScore?: unknown; matchReasons?: unknown }));
  }

  for (const r of recommendations) {
    if (!used.has(r.id)) out.push(r);
  }

  if (out.length !== valid.size) {
    throw new Error("Rerank lost place rows; rejecting response");
  }

  return out;
}
