"use client";

import { useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AccordionSurvey from "@/components/planner/AccordionSurvey";
import { SurveyAnswers } from "@/lib/planner/survey";
import {
  loadState as loadPlannerState,
  saveState as savePlannerState,
  clearPlannerState,
  placeToRecommendation,
  type PlannerStage,
  type PlaceLike,
} from "@/lib/planner/plannerState";
import PlaceSelection from "@/components/planner/PlaceSelection";
import RouteBuilder from "@/components/planner/RouteBuilder";
import StopSelection from "@/components/planner/StopSelection";
import { PlaceRecommendation } from "@/utils/planner/recommendation";

type SavedRoutePayload = {
  route?: {
    id: string;
  };
  places?: PlaceLike[];
};

function resetPlannerFlow(
  setPreferences: Dispatch<SetStateAction<SurveyAnswers | null>>,
  setRecommendations: Dispatch<SetStateAction<PlaceRecommendation[]>>,
  setSelectedPlaces: Dispatch<SetStateAction<PlaceRecommendation[]>>,
  setStopRecommendations: Dispatch<SetStateAction<PlaceRecommendation[]>>,
  setSelectedStop: Dispatch<SetStateAction<PlaceRecommendation | null>>,
  setError: Dispatch<SetStateAction<string | null>>
) {
  setPreferences(null);
  setRecommendations([]);
  setSelectedPlaces([]);
  setStopRecommendations([]);
  setSelectedStop(null);
  setError(null);
}

export default function PlannerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeIdsParam = searchParams.get("placeIds")?.trim() ?? "";
  const savedRouteIdParam = searchParams.get("savedRouteId")?.trim() ?? "";
  const isDirectPlaceRoute = placeIdsParam.length > 0 || savedRouteIdParam.length > 0;
  const [stage, setStage] = useState<PlannerStage>("survey");
  const [preferences, setPreferences] = useState<SurveyAnswers | null>(null);
  const [recommendations, setRecommendations] = useState<PlaceRecommendation[]>([]);
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceRecommendation[]>([]);
  const [stopRecommendations, setStopRecommendations] = useState<PlaceRecommendation[]>([]);
  const [selectedStop, setSelectedStop] = useState<PlaceRecommendation | null>(null);
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
    if (saved.stage && saved.stage !== "survey") {
      setStage(saved.stage);
      if (saved.preferences != null) setPreferences(saved.preferences);
      if (Array.isArray(saved.recommendations)) setRecommendations(saved.recommendations);
      if (Array.isArray(saved.selectedPlaces)) setSelectedPlaces(saved.selectedPlaces);
      if (Array.isArray(saved.stopRecommendations))
        setStopRecommendations(saved.stopRecommendations);
      if (saved.selectedStop != null) setSelectedStop(saved.selectedStop);
    }
    setHasRestored(true);
  }, [isDirectPlaceRoute]);

  useEffect(() => {
    if (!hasRestored || placeIdsLoaded || (!placeIdsParam && !savedRouteIdParam)) return;

    setPlaceIdsLoaded(true);
    setIsLoading(true);
    resetPlannerFlow(
      setPreferences,
      setRecommendations,
      setSelectedPlaces,
      setStopRecommendations,
      setSelectedStop,
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
      preferences,
      recommendations,
      selectedPlaces,
      stopRecommendations,
      selectedStop,
    });
  }, [
    hasRestored,
    stage,
    preferences,
    recommendations,
    selectedPlaces,
    stopRecommendations,
    selectedStop,
  ]);

  const routeStopType = preferences?.routeStopType as string | undefined;
  const needsStopStep = routeStopType === "coffee_shop" || routeStopType === "restaurant";
  const stopPageTitle = routeStopType === "coffee_shop" ? "Coffee shops" : "Restaurants";

  const handleSurveyComplete = async (answers: SurveyAnswers) => {
    setPreferences(answers);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/planner/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ preferences: answers }),
      });

      if (!response.ok) {
        throw new Error("Failed to get recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
      setStage("selection");
    } catch {
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePlace = (place: PlaceRecommendation) => {
    if (selectedPlaces.some((p) => p.id === place.id)) {
      setSelectedPlaces(selectedPlaces.filter((p) => p.id !== place.id));
    } else {
      setSelectedPlaces([...selectedPlaces, place]);
    }
  };

  const handleContinueToRoute = async () => {
    if (selectedPlaces.length < 1) return;
    if (needsStopStep) {
      setIsLoading(true);
      setError(null);
      try {
        const res =
          preferences != null
            ? await fetch("/api/planner/stops", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  type: routeStopType,
                  preferences,
                }),
              })
            : await fetch(`/api/planner/stops?type=${encodeURIComponent(routeStopType)}`);
        const data = res.ok ? await res.json() : {};
        setStopRecommendations(Array.isArray(data.recommendations) ? data.recommendations : []);
        setSelectedStop(null);
        setStage("stop");
      } catch {
        setStopRecommendations([]);
        setSelectedStop(null);
        setStage("stop");
      } finally {
        setIsLoading(false);
      }
    } else {
      setStage("route");
    }
  };

  const handleContinueFromStop = () => {
    setStage("route");
  };

  const handleBackFromRoute = () => {
    if (isDirectPlaceRoute) {
      router.back();
      return;
    }

    if (needsStopStep && selectedStop) {
      setStage("stop");
    } else {
      setStage("selection");
    }
  };

  const handleStartOver = () => {
    setStage("survey");
    resetPlannerFlow(
      setPreferences,
      setRecommendations,
      setSelectedPlaces,
      setStopRecommendations,
      setSelectedStop,
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
          <p className="font-cinzel text-white text-xl">Finding the perfect places for you...</p>
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
    case "survey":
      return (
        <AccordionSurvey
          onComplete={handleSurveyComplete}
          initialAnswers={preferences ?? undefined}
        />
      );

    case "selection":
      return (
        <PlaceSelection
          recommendations={recommendations}
          selectedPlaces={selectedPlaces}
          onTogglePlace={handleTogglePlace}
          onContinue={handleContinueToRoute}
          onBackToSurvey={() => setStage("survey")}
          budget={preferences?.budget as string | undefined}
        />
      );

    case "stop":
      return (
        <StopSelection
          title={stopPageTitle}
          recommendations={stopRecommendations}
          selectedStop={selectedStop}
          onSelectStop={setSelectedStop}
          onContinue={handleContinueFromStop}
          onBack={() => setStage("selection")}
        />
      );

    case "route": {
      const routeStopWhen = preferences?.routeStopWhen as
        | "beginning"
        | "middle"
        | "end"
        | "doesnt_matter"
        | undefined;
      const treatStopAsPlace = routeStopWhen === "doesnt_matter" && selectedStop;
      const placesForRoute = treatStopAsPlace ? [...selectedPlaces, selectedStop] : selectedPlaces;
      const fixedPositionWhen =
        routeStopWhen === "beginning" || routeStopWhen === "middle" || routeStopWhen === "end"
          ? routeStopWhen
          : "middle";
      return (
        <RouteBuilder
          places={placesForRoute}
          onBack={handleBackFromRoute}
          onSave={handleSaveRoute}
          minutesPerPlace={preferences?.timePerPlace as number | undefined}
          timeOfDay={preferences?.timeOfDay as string[] | undefined}
          routeStop={treatStopAsPlace ? null : selectedStop}
          routeStopWhen={treatStopAsPlace ? undefined : fixedPositionWhen}
        />
      );
    }

    default:
      return null;
  }
}
