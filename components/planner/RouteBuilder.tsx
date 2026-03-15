"use client";

import dynamic from "next/dynamic";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";
import type { RouteStopWhen } from "@/utils/planner/routeBuilderHelpers";
import { useRouteBuilderState } from "./hooks/useRouteBuilderState";
import RouteBuilderHeader from "./RouteBuilderHeader";
import RouteBuilderMapSection from "./RouteBuilderMapSection";
import RouteBuilderStartingPoint from "./RouteBuilderStartingPoint";
import RouteBuilderTransport from "./RouteBuilderTransport";
import RouteBuilderSummary from "./RouteBuilderSummary";
import RouteBuilderPlaceList from "./RouteBuilderPlaceList";
import RouteBuilderActions from "./RouteBuilderActions";

const NavigationMode = dynamic(() => import("./NavigationMode"), { ssr: false });

interface RouteBuilderProps {
  places: PlaceRecommendation[];
  onBack: () => void;
  onSave?: () => void;
  minutesPerPlace?: number;
  timeOfDay?: string[];
  routeStop?: PlaceRecommendation | null;
  routeStopWhen?: RouteStopWhen;
}

export default function RouteBuilder({
  places,
  onBack,
  onSave,
  minutesPerPlace,
  timeOfDay,
  routeStop = null,
  routeStopWhen = "middle",
}: RouteBuilderProps) {
  const {
    userLocation,
    setUserLocation,
    transportMode,
    setTransportMode,
    isLoadingLocation,
    loadingRoute,
    isNavigationMode,
    setIsNavigationMode,
    placesWithStop,
    minutesPerPlace: minsPerPlace,
    tripStats,
    canCalculateWholeTrip,
    wholeTripMinutes,
    fromLiveMap,
    totalCostEgp,
    tripExceedsPreferredTime,
    preferredWindowLabel,
    movePlace,
    removePlace,
    requestLocation,
    mapPlaces,
  } = useRouteBuilderState({
    places,
    minutesPerPlaceProp: minutesPerPlace,
    timeOfDay,
    routeStop,
    routeStopWhen,
  });

  const handleSave = () => {
    onSave?.();
    alert("Route saved.");
  };

  if (isNavigationMode && userLocation) {
    return (
      <NavigationMode
        startLocation={userLocation}
        places={placesWithStop}
        onExit={() => setIsNavigationMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/images/backgrounds/survey.jpg)",
            backgroundColor: "#5d4e37",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#5d4e37]/40 via-[#8b6f47]/30 to-[#5d4e37]/40" />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-32 pb-8">
          <RouteBuilderHeader
            onBack={onBack}
            isSinglePlace={placesWithStop.length === 1}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <RouteBuilderMapSection places={mapPlaces} />
            </div>

            <div className="space-y-6">
              <RouteBuilderStartingPoint
                userLocation={userLocation}
                onLocationSelect={setUserLocation}
                isLoadingLocation={isLoadingLocation}
              />
              <RouteBuilderTransport
                transportMode={transportMode}
                onTransportModeChange={setTransportMode}
              />
              <RouteBuilderSummary
                userLocation={userLocation}
                isLoadingLocation={isLoadingLocation}
                onRequestLocation={requestLocation}
                tripStats={tripStats}
                loadingRoute={loadingRoute}
                fromLiveMap={fromLiveMap}
                placesCount={placesWithStop.length}
                minutesPerPlace={minsPerPlace}
                canCalculateWholeTrip={canCalculateWholeTrip}
                wholeTripMinutes={wholeTripMinutes}
                totalCostEgp={totalCostEgp}
                tripExceedsPreferredTime={tripExceedsPreferredTime}
                preferredWindowLabel={preferredWindowLabel}
              />
              <RouteBuilderPlaceList
                places={placesWithStop}
                routeStop={routeStop}
                routeStopWhen={routeStopWhen}
                onMovePlace={movePlace}
                onRemovePlace={removePlace}
              />
              <RouteBuilderActions
                hasUserLocation={!!userLocation}
                placesCount={placesWithStop.length}
                onYallaClick={() => userLocation && setIsNavigationMode(true)}
                onSave={handleSave}
                onBack={onBack}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
