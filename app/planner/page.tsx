"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PlannerChat from "@/components/planner/PlannerChat";
import {
  loadState as loadPlannerState,
  saveState as savePlannerState,
  clearPlannerState,
  placeToRecommendation,
  type PlannerStage,
  type PlaceLike,
} from "@/lib/planner/plannerState";
import {
  WELCOME_MESSAGE,
  type PlannerChatMessage,
  type TripProfile,
} from "@/lib/planner/tripProfile";
import RouteBuilder from "@/components/planner/RouteBuilder";
import { PlaceRecommendation } from "@/utils/planner/recommendation";

type SavedRoutePayload = {
  route?: {
    id: string;
  };
  places?: PlaceLike[];
};

function resetPlannerFlow(
  setMessages: (v: PlannerChatMessage[]) => void,
  setTripProfile: (v: TripProfile | null) => void,
  setRecommendations: (v: PlaceRecommendation[]) => void,
  setSelectedPlaces: (v: PlaceRecommendation[]) => void,
  setError: (v: string | null) => void
) {
  setMessages([WELCOME_MESSAGE]);
  setTripProfile(null);
  setRecommendations([]);
  setSelectedPlaces([]);
  setError(null);
}

export default function PlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeIdsParam = searchParams.get("placeIds")?.trim() ?? "";
  const savedRouteIdParam = searchParams.get("savedRouteId")?.trim() ?? "";
  const isDirectPlaceRoute = placeIdsParam.length > 0 || savedRouteIdParam.length > 0;
  const [stage, setStage] = useState<PlannerStage>("chat");
  const [messages, setMessages] = useState<PlannerChatMessage[]>([WELCOME_MESSAGE]);
  const [tripProfile, setTripProfile] = useState<TripProfile | null>(null);
  const [recommendations, setRecommendations] = useState<PlaceRecommendation[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRestored, setHasRestored] = useState(false);
  const [placeIdsLoaded, setPlaceIdsLoaded] = useState(false);

  useEffect(() => {
    if (isDirectPlaceRoute) {
      clearPlannerState();
      setHasRestored(true);
      return;
    }

    const saved = loadPlannerState();
    if (saved.stage && saved.stage !== "chat") {
      setStage(saved.stage);
    }
    if (Array.isArray(saved.messages) && saved.messages.length > 0) {
      setMessages(saved.messages);
    }
    if (saved.tripProfile != null) setTripProfile(saved.tripProfile);
    if (Array.isArray(saved.recommendations)) setRecommendations(saved.recommendations);
    if (Array.isArray(saved.selectedPlaces)) setSelectedPlaces(saved.selectedPlaces);
    setHasRestored(true);
  }, [isDirectPlaceRoute]);

  useEffect(() => {
    if (!hasRestored || placeIdsLoaded || (!placeIdsParam && !savedRouteIdParam)) return;

    setPlaceIdsLoaded(true);
    setIsLoading(true);
    resetPlannerFlow(
      setMessages,
      setTripProfile,
      setRecommendations,
      setSelectedPlaces,
      setError
    );

    const loadDirectRoute = async () => {
      try {
        if (savedRouteIdParam) {
          const response = await fetch(`/api/profile/routes/${savedRouteIdParam}`);
          const data = (response.ok ? await response.json() : {}) as SavedRoutePayload;
          const places = Array.isArray(data.places)
            ? data.places.map((place: unknown) => placeToRecommendation(place as PlaceLike))
            : [];

          if (places.length === 0) {
            throw new Error("Failed to load route");
          }

          setSelectedPlaces(places);
          setStage("route");
          return;
        }

        const ids = placeIdsParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        if (ids.length === 0) {
          throw new Error("Failed to load places");
        }

        const results = await Promise.all(
          ids.map((id) => fetch(`/api/places/${id}`).then((r) => (r.ok ? r.json() : null)))
        );
        const places = results
          .filter(Boolean)
          .map((place: unknown) => placeToRecommendation(place as PlaceLike));

        if (places.length === 0) {
          throw new Error("Failed to load places");
        }

        setSelectedPlaces(places);
        setStage("route");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to load route");
      } finally {
        setIsLoading(false);
      }
    };

    void loadDirectRoute();
  }, [hasRestored, placeIdsLoaded, placeIdsParam, savedRouteIdParam]);

  useEffect(() => {
    if (!hasRestored) return;
    savePlannerState({
      stage,
      messages,
      tripProfile,
      recommendations,
      selectedPlaces,
    });
  }, [
    hasRestored,
    stage,
    messages,
    tripProfile,
    recommendations,
    selectedPlaces,
  ]);

  const handleChatStateChange = useCallback(
    (state: {
      messages: PlannerChatMessage[];
      tripProfile: TripProfile | null;
      recommendations?: PlaceRecommendation[];
    }) => {
      setMessages(state.messages);
      setTripProfile(state.tripProfile);
      if (state.recommendations) setRecommendations(state.recommendations);
    },
    []
  );

  const handleTogglePlace = (place: PlaceRecommendation) => {
    if (selectedPlaces.some((p) => p.id === place.id)) {
      setSelectedPlaces(selectedPlaces.filter((p) => p.id !== place.id));
    } else {
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };

  const handleBackFromRoute = () => {
    if (isDirectPlaceRoute) {
      router.back();
      return;
    }
    setStage("chat");
  };

  const handleStartOver = () => {
    setStage("chat");
    resetPlannerFlow(
      setMessages,
      setTripProfile,
      setRecommendations,
      setSelectedPlaces,
      setError
    );
    clearPlannerState();
  };

  const handleSaveRoute = async ({
    placeIds,
    transportMode,
  }: {
    placeIds: string[];
    transportMode: string | null;
  }) => {
    const response = await fetch("/api/profile/routes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        placeIds,
        transportMode,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Failed to save route");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#3a3428] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-[#d4af37] mb-4"></div>
          <p className="font-cinzel text-white text-xl">Loading your route...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#3a3428] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-[#5d4e37] rounded-lg p-8 text-center">
          <div className="text-red-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-white mb-4">
            Oops! Something went wrong
          </h2>
          <p className="font-cinzel text-white/70 mb-6">{error}</p>
          <button
            onClick={handleStartOver}
            className="px-6 py-3 bg-[#d4af37] text-[#3a3428] rounded-lg font-cinzel font-bold hover:bg-[#e5bf47] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  switch (stage) {
    case "chat":
      return (
        <PlannerChat
          initialMessages={messages}
          initialTripProfile={tripProfile}
          selectedPlaces={selectedPlaces}
          onTogglePlace={handleTogglePlace}
          onBuildRoute={() => setStage("route")}
          onStartOver={handleStartOver}
          onStateChange={handleChatStateChange}
        />
      );

    case "route": {
      const minutesPerPlace = tripProfile?.pace?.minutesPerPlace;
      const timeOfDay = tripProfile?.visitTimes;
      return (
        <RouteBuilder
          places={selectedPlaces}
          onBack={handleBackFromRoute}
          onSave={handleSaveRoute}
          minutesPerPlace={minutesPerPlace}
          timeOfDay={timeOfDay}
          routeStop={null}
          routeStopWhen={undefined}
        />
      );
    }

    default:
      return null;
  }
}
