import type { PlannerChatMessage, TripProfile } from "@/lib/planner/tripProfile";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";

export type PlannerStage = "chat" | "route";

export interface PlannerState {
  stage: PlannerStage;
  messages: PlannerChatMessage[];
  tripProfile: TripProfile | null;
  recommendations: PlaceRecommendation[];
  selectedPlaces: PlaceRecommendation[];
}

const STORAGE_KEY = "planner-state";
const STORAGE_VERSION = 2;

export function loadState(): Partial<PlannerState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as
      | { v?: unknown; state?: unknown }
      | Partial<PlannerState>;

    if (
      parsed &&
      typeof parsed === "object" &&
      "v" in parsed &&
      "state" in parsed &&
      typeof (parsed as any).v === "number"
    ) {
      if ((parsed as any).v !== STORAGE_VERSION) {
        sessionStorage.removeItem(STORAGE_KEY);
        return {};
      }
      const st = (parsed as any).state as Partial<PlannerState>;
      if (st?.stage && st.stage !== "chat" && st.stage !== "route") st.stage = "chat";
      return st;
    }

    const state = parsed as Partial<PlannerState>;
    if (state.stage && state.stage !== "chat" && state.stage !== "route") state.stage = "chat";
    return state;
  } catch {
    return {};
  }
}

export function saveState(state: PlannerState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, state }));
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
