import type { PlaceRecommendation } from "@/utils/planner/recommendation";

import {
  HISTORICAL_TOUR_CATEGORIES,
  PARK_OUTING_CATEGORIES,
  type TripProfile,
} from "@/lib/planner/tripProfile";

export type CategoryBrowseState = {
  queue: string[];
  activeIndex: number;
};

const STOP_CATEGORIES = new Set(["cafe", "restaurant"]);

const CATEGORY_LABELS: Record<string, string> = {
  museum: "Museums",
  park: "Parks",
  mall: "Malls",
  market: "Markets",
  mosque: "Mosques",
  church: "Churches",
  palace: "Palaces",
  citadel: "Citadels",
  pyramids: "Pyramids",
  amusement_park: "Amusement parks",
  adventure: "Adventure spots",
  historical_site: "Historical sites",
  viewpoint: "Viewpoints",
};

export function categoryDisplayLabel(category: string): string {
  const key = category.trim().toLowerCase();
  return CATEGORY_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
}

export function categoryBrowseChipLabel(category: string): string {
  return `Show ${categoryDisplayLabel(category)}`;
}

export function getUserRequestedBrowseQueue(profile: TripProfile): string[] {
  const raw = profile.categories ?? [];
  const out: string[] = [];
  for (const c of raw) {
    const t = c.trim().toLowerCase();
    if (!t || STOP_CATEGORIES.has(t)) continue;
    if (t === "amusement_park" || t === "adventure") {
      if (!out.includes("park")) out.push("park");
      continue;
    }
    if (!out.includes(t)) out.push(t);
  }
  return out;
}

export function initCategoryBrowse(profile: TripProfile): CategoryBrowseState | undefined {
  const queue = getUserRequestedBrowseQueue(profile);
  if (queue.length < 2) return undefined;
  return { queue, activeIndex: 0 };
}

export function isCategoryBrowseComplete(profile: TripProfile): boolean {
  const browse = profile.categoryBrowse;
  if (!browse || browse.queue.length < 2) return true;
  return browse.activeIndex >= browse.queue.length - 1;
}

export function getPendingBrowseCategory(profile: TripProfile): string | undefined {
  const browse = profile.categoryBrowse;
  if (!browse || browse.queue.length < 2) return undefined;
  if (browse.activeIndex >= browse.queue.length - 1) return undefined;
  return browse.queue[browse.activeIndex + 1];
}

export function retrievalCategoriesForBrowseStep(category: string): string[] {
  if (category === "park") return [...PARK_OUTING_CATEGORIES];
  if (category === "historical_site") return [...HISTORICAL_TOUR_CATEGORIES];
  return [category];
}

export function placeMatchesBrowseCategory(
  place: PlaceRecommendation,
  browseCategory: string
): boolean {
  const c = String(place.category ?? "").toLowerCase();
  if (!c) return false;
  if (browseCategory === "park") {
    return (PARK_OUTING_CATEGORIES as readonly string[]).includes(c);
  }
  if (browseCategory === "historical_site") {
    return (HISTORICAL_TOUR_CATEGORIES as readonly string[]).includes(c);
  }
  return c === browseCategory;
}

export function isShowMoreSameCategoryMessage(message: string): boolean {
  return /show\s+(me\s+)?more(\s+options)?/i.test(message.trim());
}

function messageMatchesCategory(message: string, category: string): boolean {
  const t = message.trim().toLowerCase();
  const label = categoryDisplayLabel(category).toLowerCase();
  const singular = label.replace(/s$/, "");
  if (t === categoryBrowseChipLabel(category).toLowerCase()) return true;
  if (new RegExp(`\\bshow\\s+${label}\\b`).test(t)) return true;
  if (new RegExp(`\\bshow\\s+${singular}\\b`).test(t)) return true;
  if (new RegExp(`\\b${singular}s?\\b`).test(t) && /\bshow\b|\bnext\b|\blist\b/.test(t)) return true;
  return false;
}

export function resolveCategoryBrowseAdvance(
  message: string,
  state: CategoryBrowseState
): CategoryBrowseState | null {
  const t = message.trim();
  if (!t || isShowMoreSameCategoryMessage(t)) return null;

  for (let i = state.activeIndex + 1; i < state.queue.length; i++) {
    const cat = state.queue[i]!;
    if (messageMatchesCategory(t, cat)) {
      return { ...state, activeIndex: i };
    }
  }
  return null;
}

export function buildCategoryBrowseQuickReplies(
  state: CategoryBrowseState,
  options?: { includeShowMore?: boolean }
): string[] {
  const current = state.queue[state.activeIndex]!;
  const replies: string[] = [];
  const next = state.queue[state.activeIndex + 1];
  if (next) replies.push(categoryBrowseChipLabel(next));
  if (options?.includeShowMore) {
    replies.push(`Show more ${categoryDisplayLabel(current)}`);
  }
  return replies;
}

export function profileForCategoryBrowseStep(
  profile: TripProfile,
  browseCategory: string
): TripProfile {
  return {
    ...profile,
    categories: retrievalCategoriesForBrowseStep(browseCategory),
    vibes: undefined,
    visitTimes: undefined,
  };
}
