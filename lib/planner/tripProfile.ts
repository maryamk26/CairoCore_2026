import type { PlaceCategory } from "@prisma/client";

import { PLACE_CATEGORY_VALUES } from "@/lib/constants/places";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";

export type TripProfileConfidence = "gathering" | "ready" | "refining";

export type BudgetPerPlace = "low" | "medium" | "high";

export type Companion = "kids" | "pets" | "elderly" | "solo" | "partner" | "group";

export type VisitTime = "morning" | "afternoon" | "evening" | "night";

export type StopType = "cafe" | "restaurant" | "none";

export type StopWhen = "start" | "middle" | "end";

export type TripProfile = {
  summary: string;
  vibes?: string[];
  budgetPerPlace?: BudgetPerPlace[];
  categories?: string[];
  companions?: Companion[];
  visitTimes?: VisitTime[];
  pace?: {
    minutesPerPlace?: number;
    totalHours?: number;
    dayCount?: number;
  };
  hardConstraints?: string[];
  softPreferences?: string[];
  wantsStop?: {
    type: StopType;
    when?: StopWhen;
  };
  categoryBrowse?: {
    queue: string[];
    activeIndex: number;
  };
  confidence: TripProfileConfidence;
};

export type PlannerChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
  recommendations?: PlaceRecommendation[];
  createdAt?: number;
};

export type AssistantPhase = "gathering" | "recommendations";

export const MAX_FOLLOW_UP_QUESTIONS = 3;

export const BUDGET_VALUES: BudgetPerPlace[] = ["low", "medium", "high"];

export const COMPANION_VALUES: Companion[] = [
  "kids",
  "pets",
  "elderly",
  "solo",
  "partner",
  "group",
];

export const VISIT_TIME_VALUES: VisitTime[] = ["morning", "afternoon", "evening", "night"];

export const STOP_TYPE_VALUES: StopType[] = ["cafe", "restaurant", "none"];

export const STOP_WHEN_VALUES: StopWhen[] = ["start", "middle", "end"];

export const VIBE_VALUES = [
  "historical",
  "cultural",
  "modern",
  "nature",
  "shopping",
  "romantic",
  "photography",
  "adventure",
  "ancient",
  "traditional",
  "outdoors",
] as const;

export function createEmptyTripProfile(): TripProfile {
  return { summary: "", confidence: "gathering" };
}

export function mergeTripProfile(
  base: TripProfile | null,
  partial: Partial<TripProfile>
): TripProfile {
  const prev = base ?? createEmptyTripProfile();
  return {
    ...prev,
    ...partial,
    pace: partial.pace ? { ...prev.pace, ...partial.pace } : prev.pace,
    wantsStop: partial.wantsStop ? { ...prev.wantsStop, ...partial.wantsStop } : prev.wantsStop,
    categoryBrowse: partial.categoryBrowse ?? prev.categoryBrowse,
    summary: partial.summary?.trim() ? partial.summary.trim() : prev.summary,
    confidence: partial.confidence ?? prev.confidence,
  };
}

export function countUserMessages(messages: PlannerChatMessage[]): number {
  return messages.filter((m) => m.role === "user" && m.content.trim()).length;
}

export function shouldForceReady(messages: PlannerChatMessage[]): boolean {
  return countUserMessages(messages) >= MAX_FOLLOW_UP_QUESTIONS;
}

function isBudget(value: unknown): value is BudgetPerPlace {
  return typeof value === "string" && BUDGET_VALUES.includes(value as BudgetPerPlace);
}

function isCompanion(value: unknown): value is Companion {
  return typeof value === "string" && COMPANION_VALUES.includes(value as Companion);
}

function isVisitTime(value: unknown): value is VisitTime {
  return typeof value === "string" && VISIT_TIME_VALUES.includes(value as VisitTime);
}

function isStopType(value: unknown): value is StopType {
  return typeof value === "string" && STOP_TYPE_VALUES.includes(value as StopType);
}

function isStopWhen(value: unknown): value is StopWhen {
  return typeof value === "string" && STOP_WHEN_VALUES.includes(value as StopWhen);
}

function sanitizeStringArray(raw: unknown, allowed?: readonly string[]): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw
    .filter((x): x is string => typeof x === "string")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowed) {
    const set = new Set(allowed.map((v) => v.toLowerCase()));
    return [...new Set(out.filter((v) => set.has(v)))];
  }
  return [...new Set(out)];
}

function sanitizePace(raw: unknown): TripProfile["pace"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  const pace: NonNullable<TripProfile["pace"]> = {};
  if (typeof o.minutesPerPlace === "number" && Number.isFinite(o.minutesPerPlace)) {
    pace.minutesPerPlace = Math.round(o.minutesPerPlace);
  }
  if (typeof o.totalHours === "number" && Number.isFinite(o.totalHours)) {
    pace.totalHours = o.totalHours;
  }
  if (typeof o.dayCount === "number" && Number.isFinite(o.dayCount)) {
    pace.dayCount = Math.round(o.dayCount);
  }
  return Object.keys(pace).length > 0 ? pace : undefined;
}

function sanitizeWantsStop(raw: unknown): TripProfile["wantsStop"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;
  if (!isStopType(o.type)) return undefined;
  const when = isStopWhen(o.when) ? o.when : undefined;
  return when ? { type: o.type, when } : { type: o.type };
}

export function sanitizeTripProfilePartial(raw: unknown): Partial<TripProfile> {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const out: Partial<TripProfile> = {};

  if (typeof o.summary === "string" && o.summary.trim()) {
    out.summary = o.summary.trim();
  }
  const vibes = sanitizeStringArray(o.vibes, VIBE_VALUES);
  if (vibes?.length) out.vibes = vibes;
  const categories = sanitizePlaceCategories(
    sanitizeStringArray(o.categories) ?? undefined
  );
  if (categories?.length) out.categories = categories;
  const budgets = Array.isArray(o.budgetPerPlace)
    ? o.budgetPerPlace.filter(isBudget)
    : isBudget(o.budgetPerPlace)
      ? [o.budgetPerPlace]
      : undefined;
  if (budgets?.length) out.budgetPerPlace = [...new Set(budgets)];
  const companions = Array.isArray(o.companions)
    ? o.companions.filter(isCompanion)
    : undefined;
  if (companions?.length) out.companions = [...new Set(companions)];
  const visitTimes = Array.isArray(o.visitTimes) ? o.visitTimes.filter(isVisitTime) : undefined;
  if (visitTimes?.length) out.visitTimes = [...new Set(visitTimes)];
  const pace = sanitizePace(o.pace);
  if (pace) out.pace = pace;
  const hardConstraints = sanitizeStringArray(o.hardConstraints);
  if (hardConstraints?.length) out.hardConstraints = hardConstraints;
  const softPreferences = sanitizeStringArray(o.softPreferences);
  if (softPreferences?.length) out.softPreferences = softPreferences;
  const wantsStop = sanitizeWantsStop(o.wantsStop);
  if (wantsStop) out.wantsStop = wantsStop;
  if (o.confidence === "gathering" || o.confidence === "ready" || o.confidence === "refining") {
    out.confidence = o.confidence;
  }

  return out;
}

export function getMissingCriticalFields(profile: TripProfile): string[] {
  const missing: string[] = [];
  if (!profile.summary.trim()) missing.push("summary");
  if (!profile.budgetPerPlace?.length) missing.push("budgetPerPlace");
  if (!profile.companions?.length) missing.push("companions");
  if (!(profile.vibes?.length)) missing.push("vibes");
  if (!profile.visitTimes?.length) missing.push("visitTimes");
  const mins = profile.pace?.minutesPerPlace;
  if (typeof mins !== "number" || !Number.isFinite(mins) || mins < 15 || mins > 480) {
    missing.push("minutesPerPlace");
  }
  return missing;
}

export function isProfileReady(profile: TripProfile): boolean {
  if (!profile.summary.trim()) return false;
  return getMissingCriticalFields(profile).length === 0;
}

const PLACE_CATEGORY_SET = new Set<string>(PLACE_CATEGORY_VALUES);

const CATEGORY_ALIAS_TO_ENUM: Record<string, PlaceCategory | null> = {
  "coffee shop": null,
  coffee_shop: null,
  coffeeshop: null,
  "theme park": "amusement_park",
  themepark: "amusement_park",
};

const STOP_PLACE_CATEGORIES = new Set(["cafe", "restaurant"]);

export function sanitizePlaceCategories(raw: string[] | undefined): string[] | undefined {
  if (!raw?.length) return undefined;
  const out: string[] = [];
  for (const c of raw) {
    const t = c.trim().toLowerCase().replace(/\s+/g, " ");
    if (!t) continue;
    const alias = CATEGORY_ALIAS_TO_ENUM[t];
    if (alias === null) continue;
    const normalized = (alias ?? t.replace(/\s+/g, "_")) as string;
    if (PLACE_CATEGORY_SET.has(normalized)) out.push(normalized);
  }
  return out.length > 0 ? [...new Set(out)] : undefined;
}

export const FOOD_STOP_CATEGORIES = ["cafe", "restaurant"] as const;

export const HISTORICAL_TOUR_CATEGORIES = [
  "historical_site",
  "museum",
  "mosque",
  "citadel",
  "palace",
  "pyramids",
  "church",
  "viewpoint",
] as const;

export function isFoodStopCategory(category: string | undefined | null): boolean {
  const c = String(category ?? "").toLowerCase();
  return c === "cafe" || c === "restaurant";
}

function stopTypeFromTripText(text: string): StopType | undefined {
  const blob = text.toLowerCase();
  const hasRestaurant =
    /\brestaurants?\b|\blunch stop\b|\bdinner stop\b|\bfood stop\b|\bgrab (lunch|dinner|a bite)\b/.test(
      blob
    );
  const hasCafe = /\bcoffee shops?\b|\bcoffee\b|\bcafe\b|\bcafé\b/.test(blob);
  if (hasRestaurant && !hasCafe) return "restaurant";
  if (hasCafe && !hasRestaurant) return "cafe";
  if (hasRestaurant) return "restaurant";
  if (hasCafe) return "cafe";
  return undefined;
}

export function userExplicitlyWantsFoodStop(userMessageText: string): boolean {
  return stopTypeFromTripText(userMessageText) !== undefined;
}

export function resolveEffectiveWantsStop(
  profile: TripProfile,
  options?: { userMessageText?: string }
): StopType | undefined {
  const userBlob = options?.userMessageText?.trim();
  if (userBlob) {
    const fromUser = stopTypeFromTripText(userBlob);
    if (fromUser) return fromUser;
  }

  const blob = [
    profile.summary,
    ...(profile.hardConstraints ?? []),
    ...(profile.categories ?? []),
  ].join(" ");

  const fromText = stopTypeFromTripText(blob);
  if (fromText) return fromText;

  const explicit = profile.wantsStop?.type;
  if (explicit === "cafe" || explicit === "restaurant") return explicit;
  return undefined;
}

export function applyFoodStopPolicy(
  profile: TripProfile,
  userMessageText: string
): TripProfile {
  if (userExplicitlyWantsFoodStop(userMessageText)) return profile;
  const next = { ...profile };
  delete next.wantsStop;
  return next;
}

export function normalizeTripProfile(profile: TripProfile): TripProfile {
  const p: TripProfile = { ...profile };
  let cats = sanitizePlaceCategories(p.categories) ?? [];
  if (cats.includes("restaurant")) {
    cats = cats.filter((c) => c !== "restaurant");
  }
  if (cats.includes("cafe")) {
    cats = cats.filter((c) => c !== "cafe");
  }
  p.categories = cats.length > 0 ? cats : undefined;

  const blob = [p.summary, ...(p.softPreferences ?? []), ...(p.categories ?? [])]
    .join(" ")
    .toLowerCase();

  const effectiveStop = resolveEffectiveWantsStop(p);
  const cafeOnly =
    effectiveStop === "cafe" &&
    /\b(coffee shop|coffee shops?|café|cafes?|cafe)\b/i.test(blob) &&
    !/\b(museum|park|parks|mall|malls|mosque|market|pyramid)\b/i.test(blob);
  const restaurantOnlyTrip =
    effectiveStop === "restaurant" &&
    /\brestaurants?\b/i.test(blob) &&
    !/\b(coffee shop|coffee)\b/i.test(blob) &&
    !/\b(museum|park|parks|mall|malls|mosque|market)\b/i.test(blob);

  if (cafeOnly || restaurantOnlyTrip) {
    p.wantsStop = { type: effectiveStop!, when: p.wantsStop?.when ?? "middle" };
    p.categories = undefined;
    p.vibes = undefined;
  } else if (effectiveStop) {
    p.wantsStop = { type: effectiveStop, when: p.wantsStop?.when ?? "middle" };
  } else if (p.wantsStop?.type === "none") {
    delete p.wantsStop;
  }

  return p;
}

export const PARK_OUTING_CATEGORIES = ["park", "amusement_park", "adventure"] as const;

function expandMainVisitCategorySet(main: string[]): string[] {
  const out = new Set(main);
  if (out.has("park")) {
    for (const c of PARK_OUTING_CATEGORIES) out.add(c);
  }
  if (out.has("historical_site")) {
    for (const c of HISTORICAL_TOUR_CATEGORIES) out.add(c);
  }
  return [...out];
}

export function getMainVisitCategories(profile: TripProfile): string[] | undefined {
  const cats = sanitizePlaceCategories(profile.categories) ?? [];
  if (cats.length === 0) return undefined;
  const main = cats.filter((c) => !STOP_PLACE_CATEGORIES.has(c));
  if (main.length === 0) return undefined;
  return expandMainVisitCategorySet(main);
}

export function profileForMainPlaceRetrieval(profile: TripProfile): TripProfile {
  const mainCats = getMainVisitCategories(profile);
  const hasExplicitPlaceType = Boolean(mainCats?.length);
  return {
    ...profile,
    categories: mainCats,
    ...(hasExplicitPlaceType ? { vibes: undefined, visitTimes: undefined } : {}),
  };
}

export const WELCOME_MESSAGE: PlannerChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm your Cairo trip assistant. Tell me about the day you'd like to plan — who's coming, the vibe you're after, budget, timing, anything you have in mind.",
  quickReplies: [
    "Romantic evening",
    "Family day with kids",
    "Historical tour",
    "Budget-friendly outing",
  ],
};
