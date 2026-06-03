import { parseJsonFromModelContent } from "@/lib/ai/parseJsonFromModelContent";
import { chatCompletionLmStudio } from "@/lib/ai/lmStudioChat";
import { getAiPlannerConfig } from "@/lib/ai/config";
import {
  sanitizeTripProfilePartial,
  type PlannerChatMessage,
  type TripProfile,
  VIBE_VALUES,
  BUDGET_VALUES,
  COMPANION_VALUES,
  VISIT_TIME_VALUES,
  STOP_TYPE_VALUES,
  STOP_WHEN_VALUES,
} from "@/lib/planner/tripProfile";

export type InterpreterResult = {
  profilePartial: Partial<TripProfile>;
  missingFields: string[];
  assistantMessage: string;
  quickReplies?: string[];
  confidence: TripProfile["confidence"];
};

type ModelPayload = {
  tripProfile?: unknown;
  missingFields?: unknown;
  assistantMessage?: unknown;
  quickReplies?: unknown;
  confidence?: unknown;
};

function sanitizeQuickReplies(raw: unknown, assistantMessage: string): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const assistantLower = assistantMessage.trim().toLowerCase();
  const out = raw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= 48)
    .filter((s) => {
      const t = s.toLowerCase();
      if (t === assistantLower) return false;
      if (assistantLower.includes(t) && t.length >= 18) return false;
      if (t.endsWith("?")) return false;
      return true;
    })
    .slice(0, 6);
  return out.length > 0 ? out : undefined;
}

function sanitizeMissingFields(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function parseInterpreterPayload(raw: unknown): InterpreterResult {
  if (!raw || typeof raw !== "object") {
    throw new Error("Interpreter returned non-object JSON");
  }
  const o = raw as ModelPayload;
  const assistantMessage =
    typeof o.assistantMessage === "string" ? o.assistantMessage.trim() : "";
  const safeAssistantMessage = assistantMessage || "Got it.";

  const confidence =
    o.confidence === "ready" || o.confidence === "refining" || o.confidence === "gathering"
      ? o.confidence
      : "gathering";

  return {
    profilePartial: sanitizeTripProfilePartial(o.tripProfile),
    missingFields: sanitizeMissingFields(o.missingFields),
    assistantMessage: safeAssistantMessage,
    quickReplies: sanitizeQuickReplies(o.quickReplies, safeAssistantMessage),
    confidence,
  };
}

function buildSystemPrompt(): string {
  return [
    "You are a Cairo trip planning assistant for CairoCore.",
    "Extract traveler preferences from the conversation and reply naturally.",
    'Reply with ONLY valid JSON: {"tripProfile":{...},"assistantMessage":"..."}',
    "tripProfile fields (all optional except summary when known):",
    `  summary: string — one-line trip intent`,
    `  vibes: string[] from ${JSON.stringify([...VIBE_VALUES])}`,
    `  budgetPerPlace: ${JSON.stringify(BUDGET_VALUES)}[]  (multi-select allowed)`,
    `  categories: string[] (optional; use for intents like museum/park/mall/market/etc.)`,
    `  companions: ${JSON.stringify(COMPANION_VALUES)}`,
    `  visitTimes: ${JSON.stringify(VISIT_TIME_VALUES)}`,
    `  pace: { minutesPerPlace?, totalHours?, dayCount? } — set minutesPerPlace ONLY when the user says how long they want at each place (e.g. 1 hour per place). Do NOT guess (no default 30/60/120).`,
    `  hardConstraints: string[]`,
    `  softPreferences: string[]`,
    `  wantsStop: { type: ${JSON.stringify(STOP_TYPE_VALUES)}, when?: ${JSON.stringify(STOP_WHEN_VALUES)} }`,
    "Do not guess budgetPerPlace, visitTimes, or minutesPerPlace. Never default budget to medium or minutes to 60/90/120. Omit those fields until the user states them or picks a chip.",
    "Infer visitTimes only from explicit time-of-day words (morning, afternoon, evening, night), not from vibe alone.",
    "Set companions only when the user says who is coming (or picks a companion chip). Welcome/theme chips like 'Historical tour' are trip ideas, not companions — do not set solo by default.",
    "Set categories for every main place type the user names (mall, historical_site, museum, park, …) in mention order. Put cafe/restaurant in wantsStop only, never in categories.",
    "Never infer cafe/restaurant from vibes alone (romantic evening, date night, dinner time, etc.). Only set wantsStop when the user explicitly asks for coffee, a cafe, or a restaurant/food stop.",
    "If the user wants mall + historical + restaurant: categories [mall, historical_site] (or museum), wantsStop { type: restaurant }. Main places are recommended first; the restaurant stop comes later.",
    "Coffee-shop-only or restaurant-only trips (no mall/museum/park): wantsStop only, categories empty.",
    "Multiple main types: list all in categories; the app browses one category at a time before stop options.",
    "Open budget → budgetPerPlace [\"high\"]. Ranges → array of tiers.",
    "assistantMessage: one short acknowledgment of what you understood (no questions).",
    "Be concise. Do not recommend specific place names yet.",
  ].join(" ");
}

function buildUserPayload(options: {
  messages: PlannerChatMessage[];
  tripProfile: TripProfile | null;
  userMessage: string;
  forceReady: boolean;
}): string {
  const history = options.messages
    .filter((m) => m.id !== "welcome")
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content }));

  return JSON.stringify({
    currentTripProfile: options.tripProfile,
    conversationHistory: history,
    latestUserMessage: options.userMessage,
    forceReady: options.forceReady,
    instruction: options.forceReady
      ? "User has answered enough follow-ups. Set confidence to ready, state any assumptions briefly, and do not ask another question."
      : undefined,
  });
}

export async function interpretTripProfileWithLmStudio(options: {
  messages: PlannerChatMessage[];
  tripProfile: TripProfile | null;
  userMessage: string;
  forceReady: boolean;
}): Promise<InterpreterResult> {
  const chatModel = getAiPlannerConfig().lmStudioChatModel.toLowerCase();
  let system = buildSystemPrompt();
  if (chatModel.includes("qwen")) {
    system += " /no_think";
  }

  const userContent = buildUserPayload(options);
  const userMessage =
    chatModel.includes("qwen") && !userContent.includes("/no_think")
      ? `${userContent}\n/no_think`
      : userContent;

  const preferJsonObjectFirst = !chatModel.includes("qwen");

  let raw: string;
  const call = (jsonMode: boolean) =>
    chatCompletionLmStudio({
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMessage },
      ],
      jsonMode,
      temperature: 0.2,
      maxTokens: 2048,
    });

  if (preferJsonObjectFirst) {
    try {
      raw = await call(true);
    } catch {
      raw = await call(false);
    }
  } else {
    raw = await call(false);
  }

  try {
    return parseInterpreterPayload(parseJsonFromModelContent(raw));
  } catch {
    raw = await call(false);
    return parseInterpreterPayload(parseJsonFromModelContent(raw));
  }
}
