import { sanitizePlaceCategories, VIBE_VALUES } from "@/lib/planner/tripProfile";
import type { Companion, TripProfile, VisitTime } from "@/lib/planner/tripProfile";
import { parseBudgetTiersFromText } from "@/lib/planner/parseBudgetFromText";
import { parseMinutesPerPlaceFromText } from "@/lib/planner/parseMinutesPerPlace";

export function visitTimesMentionedInText(text: string): VisitTime[] {
  const lower = text.toLowerCase();
  const visitTimes = new Set<VisitTime>();
  if (/\b(morning|sunrise|breakfast)\b/.test(lower)) visitTimes.add("morning");
  if (/\b(afternoon|lunch|noon)\b/.test(lower)) visitTimes.add("afternoon");
  if (/\b(evening|sunset|dinner)\b/.test(lower)) visitTimes.add("evening");
  if (/\b(night|late night|midnight)\b/.test(lower)) visitTimes.add("night");
  return [...visitTimes];
}

export function companionsMentionedInText(text: string): Companion[] {
  const lower = text.toLowerCase();
  const companions = new Set<Companion>();
  if (/\b(pet|pets|dog|dogs|cat|cats)\b/.test(lower)) companions.add("pets");
  if (/\b(kid|kids|child|children|toddler|baby|babies)\b/.test(lower)) companions.add("kids");
  if (
    /\b(elderly|senior|grandparent|grandma|grandmother|grandpa|grandfather|parent|parents)\b/.test(
      lower
    )
  ) {
    companions.add("elderly");
  }
  if (/\b(solo|alone|by myself|just me)\b/.test(lower)) companions.add("solo");
  if (/\b(partner|couple|girlfriend|boyfriend|wife|husband|spouse)\b/.test(lower)) {
    companions.add("partner");
  }
  if (/\b(friend|friends|buddy|buddies|group)\b/.test(lower)) companions.add("group");
  return [...companions];
}

const THEME_CHIP_VIBES: Record<string, string[]> = {
  "romantic evening": ["romantic"],
  "historical tour": ["historical", "cultural"],
};

export function vibesMentionedInText(text: string): string[] {
  const lower = text.toLowerCase().trim();
  const themed = THEME_CHIP_VIBES[lower];
  if (themed?.length) return [...themed];

  const vibes = new Set<string>();
  for (const vibe of VIBE_VALUES) {
    const re = new RegExp(`\\b${vibe.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(lower)) vibes.add(vibe);
  }
  return [...vibes];
}

export function mainCategoriesFromUserText(text: string): string[] {
  const lower = text.toLowerCase();
  const raw: string[] = [];
  if (/\b(historical|heritage|old cairo|islamic cairo|sightseeing)\b/.test(lower)) {
    raw.push("historical_site");
  }
  if (/\bmuseums?\b/.test(lower)) raw.push("museum");
  if (/\b(mall|shopping centre|shopping center)\b/.test(lower)) raw.push("mall");
  if (/\b(parks?|garden)\b/.test(lower)) raw.push("park");
  if (/\b(mosque|mosques)\b/.test(lower)) raw.push("mosque");
  if (/\b(markets?|souq|souk|bazaar)\b/.test(lower)) raw.push("market");
  if (/\b(pyramids?|giza)\b/.test(lower)) raw.push("pyramids");
  return sanitizePlaceCategories(raw) ?? [];
}

export function mainVisitTypesMentionedInText(text: string): boolean {
  const lower = text.toLowerCase();
  return /\b(museum|park|mall|mosque|market|pyramid|palace|citadel|historical|sightseeing)\b/.test(
    lower
  );
}

export function detectSignalsFromText(text: string): Partial<TripProfile> {
  const partial: Partial<TripProfile> = {};

  const budgets = parseBudgetTiersFromText(text);
  if (budgets.length > 0) partial.budgetPerPlace = budgets;

  const companions = companionsMentionedInText(text);
  if (companions.length > 0) partial.companions = companions;

  const visitTimes = visitTimesMentionedInText(text);
  if (visitTimes.length > 0) partial.visitTimes = visitTimes;

  const minutesPerPlace = parseMinutesPerPlaceFromText(text);
  if (minutesPerPlace) {
    partial.pace = { ...(partial.pace ?? {}), minutesPerPlace };
  }

  const categories = mainCategoriesFromUserText(text);
  if (categories.length > 0) partial.categories = categories;

  const vibes = vibesMentionedInText(text);
  if (vibes.length > 0) partial.vibes = vibes;

  return partial;
}

export function collectUserMessageText(
  messages: { role: string; content: string }[],
  latestUserMessage: string
): string {
  const parts = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim())
    .filter(Boolean);
  const latest = latestUserMessage.trim();
  if (latest && parts[parts.length - 1] !== latest) parts.push(latest);
  return parts.join("\n");
}
