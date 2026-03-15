import type { PlaceType, PlaceCategory, PlaceVibe } from "@prisma/client";

export const PLACE_TYPES = [
  { value: "place_to_visit", label: "Place to visit" },
  { value: "cafe", label: "Cafe" },
  { value: "restaurant", label: "Restaurant" },
] as const;

export const PLACE_CATEGORIES = [
  { value: "museum", label: "Museum" },
  { value: "historical_site", label: "Historical site" },
  { value: "pyramids", label: "Pyramids" },
  { value: "mosque", label: "Mosque" },
  { value: "church", label: "Church" },
  { value: "palace", label: "Palace" },
  { value: "citadel", label: "Citadel" },
  { value: "park", label: "Park" },
  { value: "mall", label: "Mall" },
  { value: "amusement_park", label: "Amusement park" },
  { value: "activity", label: "Activity" },
  { value: "famous_street", label: "Famous street" },
  { value: "market", label: "Market" },
  { value: "viewpoint", label: "Viewpoint" },
  { value: "romantic_spot", label: "Romantic spot" },
  { value: "adventure", label: "Adventure" },
  { value: "cafe", label: "Cafe" },
  { value: "restaurant", label: "Restaurant" },
] as const;

export const PLACE_VIBES = [
  { value: "ancient", label: "Ancient" },
  { value: "historical", label: "Historical" },
  { value: "traditional", label: "Traditional" },
  { value: "modern", label: "Modern" },
  { value: "nature", label: "Nature" },
  { value: "outdoors", label: "Outdoors" },
  { value: "romantic", label: "Romantic" },
  { value: "photography", label: "Photography" },
  { value: "adventure", label: "Adventure" },
  { value: "shopping", label: "Shopping" },
] as const;

export const PLACE_TAGS = [
  { value: "shopping", label: "Shopping" },
  { value: "entertainment", label: "Entertainment" },
  { value: "modern", label: "Modern" },
  { value: "dining", label: "Dining" },
  { value: "nature", label: "Nature" },
  { value: "history", label: "History" },
  { value: "culture", label: "Culture" },
  { value: "family", label: "Family" },
  { value: "romantic", label: "Romantic" },
  { value: "photography", label: "Photography" },
  { value: "adventure", label: "Adventure" },
  { value: "food", label: "Food" },
  { value: "cafe", label: "Cafe" },
  { value: "nightlife", label: "Nightlife" },
  { value: "art", label: "Art" },
  { value: "music", label: "Music" },
  { value: "outdoor", label: "Outdoor" },
  { value: "indoor", label: "Indoor" },
] as const;

export const CITIES = [
  { value: "", label: "Choose a city" },
  { value: "Cairo", label: "Cairo" },
  { value: "Giza", label: "Giza" },
  { value: "Sheikh Zayed City", label: "Sheikh Zayed City" },
] as const;

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const TIME_OPTIONS_BUILDER: string[] = (() => {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of ["00", "30"]) {
      const am = h < 12;
      const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      opts.push(`${h12}:${m} ${am ? "AM" : "PM"}`);
    }
  }
  return opts;
})();

export const TIME_OPTIONS: readonly string[] = TIME_OPTIONS_BUILDER;

export const ALLOWED_CITIES = ["Cairo", "Giza", "Sheikh Zayed City"] as const;

export const PLACE_TYPE_VALUES: PlaceType[] = ["place_to_visit", "cafe", "restaurant"];

export const PLACE_CATEGORY_VALUES: PlaceCategory[] = [
  "museum",
  "historical_site",
  "pyramids",
  "mosque",
  "church",
  "palace",
  "citadel",
  "park",
  "mall",
  "amusement_park",
  "activity",
  "famous_street",
  "market",
  "viewpoint",
  "romantic_spot",
  "adventure",
  "cafe",
  "restaurant",
];

export const PLACE_VIBE_VALUES: PlaceVibe[] = [
  "ancient",
  "historical",
  "traditional",
  "modern",
  "nature",
  "outdoors",
  "romantic",
  "photography",
  "adventure",
  "shopping",
];

export const PLACE_TAG_VALUES: readonly string[] = PLACE_TAGS.map((t) => t.value);
