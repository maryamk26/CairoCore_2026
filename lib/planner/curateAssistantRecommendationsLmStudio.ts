import { getAiPlannerConfig } from "@/lib/ai/config";
import { parseJsonFromModelContent } from "@/lib/ai/parseJsonFromModelContent";
import { chatCompletionLmStudio } from "@/lib/ai/lmStudioChat";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";

const DESC_PREVIEW = 280;
const MAX_REASONS = 4;
const REASON_MAX_LEN = 180;

function compactPlace(r: PlaceRecommendation) {
  return {
    id: r.id,
    title: r.title,
    description: r.description.slice(0, DESC_PREVIEW),
    category: r.category ?? "",
    vibe: r.vibe,
    entryFees: r.entryFees,
    kidsFriendly: r.kidsFriendly,
    petsFriendly: r.petsFriendly,
  };
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

type CurateRow = { id?: unknown; matchScore?: unknown; matchReasons?: unknown };
type CuratePayload = { ranked?: unknown };

function defaultScoreForIndex(i: number): number {
  const top = 95;
  const bottom = 55;
  const t = Math.max(0, Math.min(11, i)) / 11;
  return clampScore(top + (bottom - top) * t);
}

function mergeRow(base: PlaceRecommendation, row: CurateRow): PlaceRecommendation {
  const out: PlaceRecommendation = { ...base };
  if (typeof row.matchScore === "number" && Number.isFinite(row.matchScore)) {
    out.matchScore = clampScore(row.matchScore);
  }
  const reasons = sanitizeReasons(row.matchReasons);
  if (reasons) out.matchReasons = reasons;
  return out;
}

export async function curateAssistantRecommendationsWithLmStudio(options: {
  retrievalText: string;
  candidates: PlaceRecommendation[];
}): Promise<PlaceRecommendation[]> {
  const { retrievalText, candidates } = options;
  if (candidates.length === 0) return candidates;

  const valid = new Map(candidates.map((r) => [r.id, r]));
  const chatModel = getAiPlannerConfig().lmStudioChatModel.toLowerCase();

  let system = [
    "You are CairoCore's trip assistant.",
    "Pick the best places for the traveler from a provided list of candidates.",
    'Reply with ONLY valid JSON: {"ranked":[{"id":"<uuid>","matchScore":0-100,"matchReasons":["reason"]}]}',
    "Rules:",
    "- Use only ids from the candidate list. Do not invent places.",
    "- Return a ranked list (best match first).",
    "- Include each selected id at most once.",
    "- Provide 1–3 short matchReasons per place.",
    "- matchScore must reflect vibe fit: places whose vibe list includes the traveler's requested vibes (e.g. romantic) should score highest.",
    "- Rank best vibe matches first; lower scores for places missing the requested vibe.",
    "- Do not include cafe or restaurant unless the traveler explicitly asked for a coffee shop or restaurant stop.",
  ].join(" ");
  if (chatModel.includes("qwen")) system += " /no_think";

  const userPayload = JSON.stringify({
    travelerProfile: retrievalText,
    candidates: candidates.map(compactPlace),
    instruction:
      "Return the best 24 items ranked by match (highest matchScore first). If fewer are strong matches, still return up to 24 but lower matchScore for weaker fits.",
  });
  const userContent =
    chatModel.includes("qwen") && !userPayload.includes("/no_think")
      ? `${userPayload}\n/no_think`
      : userPayload;

  const preferJsonObjectFirst = !chatModel.includes("qwen");

  const call = (jsonMode: boolean) =>
    chatCompletionLmStudio({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      jsonMode,
      temperature: 0.15,
      maxTokens: 4096,
    });

  let raw: string;
  if (preferJsonObjectFirst) {
    try {
      raw = await call(true);
    } catch {
      raw = await call(false);
    }
  } else {
    raw = await call(false);
  }

  let parsed: unknown;
  try {
    parsed = parseJsonFromModelContent(raw);
  } catch {
    raw = await call(false);
    parsed = parseJsonFromModelContent(raw);
  }

  const ranked = (parsed as CuratePayload).ranked;
  if (!Array.isArray(ranked)) throw new Error('Curator JSON missing "ranked" array');

  const used = new Set<string>();
  const out: PlaceRecommendation[] = [];

  for (const row of ranked) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    if (typeof id !== "string" || !valid.has(id) || used.has(id)) continue;
    used.add(id);
    out.push(mergeRow(valid.get(id)!, row as CurateRow));
    if (out.length >= 24) break;
  }

  for (const r of candidates) {
    if (out.length >= 24) break;
    if (!used.has(r.id)) out.push(r);
  }

  const normalized = out.map((r, i) => {
    const matchScore = r.matchScore > 0 ? r.matchScore : defaultScoreForIndex(i);
    const matchReasons =
      Array.isArray(r.matchReasons) && r.matchReasons.length > 0
        ? r.matchReasons
        : ["Matches your trip profile"];
    return { row: { ...r, matchScore, matchReasons }, i };
  });

  normalized.sort((a, b) => {
    const d = b.row.matchScore - a.row.matchScore;
    return d !== 0 ? d : a.i - b.i;
  });

  return normalized.map((x) => x.row);
}

