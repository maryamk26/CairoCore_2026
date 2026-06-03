"use client";

import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";
import { getCategoryIcon } from "@/components/icons/categoryIcons";
import { formatDistance, formatDuration, formatTime } from "@/utils/planner/navigationHelpers";

const NavigationMap = dynamic(() => import("@/components/planner/NavigationMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-white">Loading...</p>
    </div>
  ),
});

interface NavigationStep {
  distance: number;
  duration: number;
  instruction: string;
  location: [number, number];
  maneuver: { type: string; modifier?: string };
}

interface NavigationModeOverlayProps {
  startLocation: { lat: number; lng: number };
  places: PlaceRecommendation[];
  steps: NavigationStep[];
  currentStep: number;
  currentDestinationIndex: number;
  routeGeometry: [number, number][];
  legs: { distance: number; duration: number }[];
  rideStartTime: Date | null;
  isRiding: boolean;
  onExit: () => void;
  onStartEnd: () => void;
}

export default function NavigationModeOverlay({
  startLocation,
  places,
  steps,
  currentStep,
  currentDestinationIndex,
  routeGeometry,
  legs,
  rideStartTime,
  isRiding,
  onExit,
  onStartEnd,
}: NavigationModeOverlayProps) {
  const currentPlace = places[currentDestinationIndex];
  const currentStepData = steps[currentStep];
  const cumulativeToStop = legs.slice(0, currentDestinationIndex + 1).reduce(
    (acc, leg) => ({
      distance: acc.distance + leg.distance,
      duration: acc.duration + leg.duration,
    }),
    { distance: 0, duration: 0 }
  );
  const eta =
    rideStartTime && isRiding
      ? new Date(rideStartTime.getTime() + cumulativeToStop.duration * 1000)
      : null;
  const DestIcon = getCategoryIcon(currentPlace?.category ?? "other");

  const overlay = (
    <div className="fixed inset-0 bg-gray-900 flex flex-col" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 z-0">
        <NavigationMap
          userLocation={[startLocation.lat, startLocation.lng]}
          steps={steps}
          currentStep={currentStep}
          places={places}
          routeGeometry={routeGeometry}
        />
      </div>
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-4 pt-6 z-10">
        <div className="container mx-auto">
          <div className="flex items-start justify-end mb-4">
            <button onClick={onExit} className="text-white/70 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mt-6 bg-gray-900 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="text-white">
                {currentStepData.maneuver.type === "arrive" ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ) : currentStepData.maneuver.modifier?.includes("left") ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                ) : currentStepData.maneuver.modifier?.includes("right") ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 10l7-7m0 0l7 7m-7-7v18"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-cinzel text-xl font-bold text-white">
                  {formatDistance(currentStepData.distance)}
                </p>
                <p className="font-cinzel text-sm text-white/90">{currentStepData.instruction}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-[60] flex items-center justify-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
        <div className="w-16 h-16 rounded-full border-2 border-white flex items-center justify-center shrink-0 bg-[#c4b5fd]">
          <span className="font-cinzel text-lg font-bold text-gray-900">60</span>
        </div>
      </div>
      <div className="absolute left-4 bottom-8 z-[60] w-[calc(100%-2rem)] max-w-sm flex flex-col pointer-events-auto">
        <div className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-gray-200 p-5 min-h-[320px] max-h-[50vh] overflow-y-auto">
          <div className="flex justify-center pt-5 pb-1">
            <DestIcon className="w-10 h-10 text-gray-800" />
          </div>
          <h2 className="font-cinzel text-xl font-bold text-gray-900 text-center px-2 mb-5 leading-tight">
            {currentPlace?.title ?? "—"}
          </h2>
          <div className="flex gap-2 px-3 mb-3">
            <div className="flex-1 bg-black text-white rounded-xl py-3 text-center min-w-0">
              <p className="font-cinzel text-sm font-bold truncate">
                {formatDuration(cumulativeToStop.duration)}
              </p>
            </div>
            <div className="flex-1 rounded-xl py-3 text-center min-w-0 bg-[#c4b5fd]">
              <p className="font-cinzel text-sm font-bold text-gray-900 truncate">
                {(cumulativeToStop.distance / 1000).toFixed(1)} km
              </p>
            </div>
            <div className="flex-1 rounded-xl py-3 text-center min-w-0 bg-[#ddd6fe]">
              <p className="font-cinzel text-sm font-bold text-gray-900 truncate">
                {eta ? formatTime(eta) : "—"}
              </p>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-700 px-4 mb-5">
            <span className="font-cinzel uppercase">
              distance {(cumulativeToStop.distance / 1000).toFixed(1)} km
            </span>
            <span className="font-cinzel uppercase">finish {eta ? formatTime(eta) : "—"}</span>
          </div>
          <button
            type="button"
            onClick={onStartEnd}
            className="mx-4 mt-auto mb-1 py-4 bg-black text-white font-cinzel text-base font-bold rounded-2xl hover:bg-gray-800 transition-colors"
          >
            {isRiding ? "End" : "Start"}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="py-2 text-gray-500 font-cinzel text-sm hover:text-gray-900 transition-colors"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") return createPortal(overlay, document.body);
  return overlay;
}
