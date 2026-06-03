import { VIBE_VALUES } from "@/lib/planner/tripProfile";

export type GatheringFieldId =
  | "budgetPerPlace"
  | "companions"
  | "vibes"
  | "visitTimes"
  | "minutesPerPlace";

const GATHERING_ORDER: GatheringFieldId[] = [
  "budgetPerPlace",
  "companions",
  "vibes",
  "visitTimes",
  "minutesPerPlace",
];

const PROMPTS: Record<GatheringFieldId, { message: string; chips: string[] }> = {
  budgetPerPlace: {
    message: "What’s your budget per place?",
    chips: ["Free – 50 EGP", "50 – 200 EGP", "200+ EGP"],
  },
  companions: {
    message: "Who are you traveling with?",
    chips: ["Solo", "Partner", "Kids", "Group/Friends", "Pets"],
  },
  vibes: {
    message: "What kind of vibe are you looking for?",
    chips: [...VIBE_VALUES].map((v) => v[0].toUpperCase() + v.slice(1)),
  },
  visitTimes: {
    message: "What time of day do you prefer to go out?",
    chips: ["Morning", "Afternoon", "Evening", "Night"],
  },
  minutesPerPlace: {
    message: "About how long do you want to spend at each place?",
    chips: ["30 min / place", "1 hour / place", "1.5 hours / place", "2 hours / place"],
  },
};

export function nextGatheringField(missing: string[]): GatheringFieldId | undefined {
  return GATHERING_ORDER.find((f) => missing.includes(f));
}

export function gatheringTurn(missing: string[]): { message: string; chips: string[] } | null {
  const field = nextGatheringField(missing);
  if (!field) return null;
  return PROMPTS[field];
}
