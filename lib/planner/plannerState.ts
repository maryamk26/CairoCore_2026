import type { SurveyAnswers } from "@/lib/planner/survey";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";

export type PlannerStage = "survey" | "selection" | "stop" | "route";

export interface PlannerState {
  stage: PlannerStage;
  preferences: SurveyAnswers | null;
  recommendations: PlaceRecommendation[];
  selectedPlaces: PlaceRecommendation[];
  stopRecommendations: PlaceRecommendation[];
  selectedStop: PlaceRecommendation | null;
}

const STORAGE_KEY = "planner-state";

export function loadState(): Partial<PlannerState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<PlannerState>;
  } catch {
    return {};
  }
}

export function saveState(state: PlannerState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function clearPlannerState(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export type PlaceLike = {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  images?: string[];
  location?: { lat: number; lng: number };
  latitude?: number;
  longitude?: number;
  address?: string;
  vibe?: string[];
  entryFees?: number | null;
  cameraFees?: number | null;
  petsFriendly?: boolean;
  kidsFriendly?: boolean;
  category?: string;
};

export function placeToRecommendation(p: PlaceLike): PlaceRecommendation {
  const lat = p.location?.lat ?? p.latitude ?? 0;
  const lng = p.location?.lng ?? p.longitude ?? 0;
  return {
    id: p.id,
    title: p.title ?? p.name ?? "",
    description: p.description ?? "",
    images: p.images ?? [],
    latitude: lat,
    longitude: lng,
    address: p.address ?? "",
    vibe: Array.isArray(p.vibe) ? p.vibe : [],
    entryFees: p.entryFees ?? null,
    cameraFees: p.cameraFees ?? null,
    petsFriendly: p.petsFriendly ?? false,
    kidsFriendly: p.kidsFriendly ?? false,
    matchScore: 0,
    matchReasons: [],
    category: p.category,
  };
}
