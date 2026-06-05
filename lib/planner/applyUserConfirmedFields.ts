import {
  visitTimesMentionedInText,
  collectUserMessageText,
  companionsMentionedInText,
  mainCategoriesFromUserText,
  vibesMentionedInText,
} from "@/lib/planner/detectSignalsFromText";
import {
  budgetTiersFromQuickReplyChip,
  parseBudgetTiersFromText,
} from "@/lib/planner/parseBudgetFromText";
import {
  minutesPerPlaceFromQuickReplyChip,
  parseMinutesPerPlaceFromText,
} from "@/lib/planner/parseMinutesPerPlace";
import {
  COMPANION_VALUES,
  VIBE_VALUES,
  VISIT_TIME_VALUES,
  type BudgetPerPlace,
  type Companion,
  type PlannerChatMessage,
  type TripProfile,
  type VisitTime,
} from "@/lib/planner/tripProfile";

const COMPANION_CHIPS: Record<string, Companion> = {
  solo: "solo",
  partner: "partner",
  kids: "kids",
  "group/friends": "group",
  pets: "pets",
};

function lastUserMessageValue<T>(
  messages: PlannerChatMessage[],
  latest: string,
  read: (text: string) => T | undefined
): T | undefined {
  const fromLatest = read(latest);
  if (fromLatest !== undefined) return fromLatest;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role !== "user") continue;
    const v = read(m.content);
    if (v !== undefined) return v;
  }
  const thread = collectUserMessageText(messages, latest);
  return read(thread);
}

function readBudget(text: string): BudgetPerPlace[] | undefined {
  const chip = budgetTiersFromQuickReplyChip(text);
  if (chip?.length) return chip;
  const tiers = parseBudgetTiersFromText(text);
  return tiers.length > 0 ? tiers : undefined;
}

function readMinutes(text: string): number | undefined {
  return minutesPerPlaceFromQuickReplyChip(text) ?? parseMinutesPerPlaceFromText(text);
}

function readVisitTimes(text: string): VisitTime[] | undefined {
  const t = text.trim().toLowerCase();
  for (const v of VISIT_TIME_VALUES) {
    if (t === v) return [v];
  }
  const times = visitTimesMentionedInText(text);
  return times.length > 0 ? times : undefined;
}

function readCompanions(text: string): Companion[] | undefined {
  const key = text.trim().toLowerCase();
  if (key in COMPANION_CHIPS) return [COMPANION_CHIPS[key]!];
  for (const c of COMPANION_VALUES) {
    if (key === c) return [c];
  }
  const list = companionsMentionedInText(text);
  return list.length > 0 ? list : undefined;
}

function readVibes(text: string): string[] | undefined {
  const key = text.trim().toLowerCase();
  for (const vibe of VIBE_VALUES) {
    if (key === vibe) return [vibe];
    if (key === vibe[0]!.toUpperCase() + vibe.slice(1)) return [vibe];
  }
  const vibes = vibesMentionedInText(text);
  return vibes.length > 0 ? vibes : undefined;
}

export function applyUserConfirmedFields(
  profile: TripProfile,
  messages: PlannerChatMessage[],
  latestUserMessage: string
): TripProfile {
  const out: TripProfile = { ...profile };

  const budget = lastUserMessageValue(messages, latestUserMessage, readBudget);
  if (budget?.length) out.budgetPerPlace = budget;
  else delete out.budgetPerPlace;

  const minutes = lastUserMessageValue(messages, latestUserMessage, readMinutes);
  if (minutes) out.pace = { ...out.pace, minutesPerPlace: minutes };
  else if (out.pace) {
    const { minutesPerPlace: _m, ...rest } = out.pace;
    out.pace = Object.keys(rest).length > 0 ? rest : undefined;
  }

  const visitTimes = lastUserMessageValue(messages, latestUserMessage, readVisitTimes);
  if (visitTimes?.length) out.visitTimes = visitTimes;
  else delete out.visitTimes;

  const companions = lastUserMessageValue(messages, latestUserMessage, readCompanions);
  if (companions?.length) out.companions = companions;
  else delete out.companions;

  const vibes = lastUserMessageValue(messages, latestUserMessage, readVibes);
  if (vibes?.length) out.vibes = vibes;
  else delete out.vibes;

  const thread = collectUserMessageText(messages, latestUserMessage);
  const userCategories = mainCategoriesFromUserText(thread);
  if (userCategories.length > 0) out.categories = userCategories;
  else delete out.categories;

  return out;
}
