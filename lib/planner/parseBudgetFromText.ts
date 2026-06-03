import type { BudgetPerPlace } from "@/lib/planner/tripProfile";

export const BUDGET_TIER_MAX_EGP: Record<BudgetPerPlace, number> = {
  low: 50,
  medium: 200,
  high: Number.POSITIVE_INFINITY,
};

const TIER_ORDER: BudgetPerPlace[] = ["low", "medium", "high"];

function tierForAmount(egp: number): BudgetPerPlace {
  if (egp <= BUDGET_TIER_MAX_EGP.low) return "low";
  if (egp <= BUDGET_TIER_MAX_EGP.medium) return "medium";
  return "high";
}

export function budgetTiersForAmountRange(minEgp: number, maxEgp: number): BudgetPerPlace[] {
  const lo = Math.min(minEgp, maxEgp);
  const hi = Math.max(minEgp, maxEgp);
  const tiers = new Set<BudgetPerPlace>();
  if (lo <= BUDGET_TIER_MAX_EGP.low) tiers.add("low");
  if (hi > BUDGET_TIER_MAX_EGP.low && lo <= BUDGET_TIER_MAX_EGP.medium) tiers.add("medium");
  if (hi > BUDGET_TIER_MAX_EGP.medium) tiers.add("high");
  return tiers.size > 0 ? TIER_ORDER.filter((t) => tiers.has(t)) : [tierForAmount(hi)];
}

export function budgetTiersForMinAmount(egp: number): BudgetPerPlace[] {
  return budgetTiersForAmountRange(egp, Number.POSITIVE_INFINITY);
}

export function parseBudgetTiersFromText(text: string): BudgetPerPlace[] {
  const lower = text.toLowerCase().trim();
  const tiers = new Set<BudgetPerPlace>();

  if (/\bfree\b|no cost|no fee/.test(lower)) tiers.add("low");
  if (/\b(low|cheap|affordable|budget-friendly|inexpensive)\b/.test(lower)) tiers.add("low");
  if (/\b(medium|moderate|mid-range|mid range|middle)\b/.test(lower)) tiers.add("medium");
  if (/\b(high|premium|luxury|expensive|splurge|no limit|unlimited)\b/.test(lower)) tiers.add("high");

  const rangeMatch = lower.match(/(\d{1,6})\s*(?:-|–|—|to)\s*(\d{1,6})/);
  if (rangeMatch) {
    for (const t of budgetTiersForAmountRange(Number(rangeMatch[1]), Number(rangeMatch[2]))) {
      tiers.add(t);
    }
    return [...tiers];
  }

  const plusMatch = lower.match(/(\d{1,6})\s*\+/);
  if (plusMatch) {
    for (const t of budgetTiersForMinAmount(Number(plusMatch[1]))) tiers.add(t);
    return [...tiers];
  }

  const nums = [...lower.matchAll(/\b(\d{1,6})\b/g)]
    .map((m) => Number(m[1]))
    .filter((n) => Number.isFinite(n) && n >= 0);
  if (nums.length > 0) {
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    if (nums.length === 1) {
      tiers.add(tierForAmount(max));
    } else {
      for (const t of budgetTiersForAmountRange(min, max)) tiers.add(t);
    }
  }

  return TIER_ORDER.filter((t) => tiers.has(t));
}

export function budgetTiersFromQuickReplyChip(message: string): BudgetPerPlace[] | undefined {
  const t = message.trim();
  if (!t) return undefined;

  const range = t.match(/(\d{1,6})\s*[–-]\s*(\d{1,6})/i);
  if (range) return budgetTiersForAmountRange(Number(range[1]), Number(range[2]));

  const plus = t.match(/(\d{1,6})\s*\+/i);
  if (plus) return budgetTiersForMinAmount(Number(plus[1]));

  if (/^free\b/i.test(t)) return ["low"];

  const wordTiers = parseBudgetTiersFromText(t);
  return wordTiers.length > 0 ? wordTiers : undefined;
}
