"use client";

import { useState, useEffect, useRef } from "react";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";
import { orsTypeToManeuver, haversineDistanceKm } from "@/utils/planner/navigationHelpers";
import NavigationModeOverlay from "./NavigationModeOverlay";

type TransportMode = "driving" | "walking" | "cycling";

interface NavigationStep {
  distance: number;
  duration: number;
  instruction: string;
  location: [number, number];
  maneuver: { type: string; modifier?: string };
}

interface NavigationModeProps {
  startLocation: { lat: number; lng: number; title?: string };
  places: PlaceRecommendation[];
  onExit: () => void;
}

const DEFAULT_TRANSPORT: TransportMode = "driving";

export default function NavigationMode({ startLocation, places, onExit }: NavigationModeProps) {
  const [transportMode] = useState<TransportMode | null>(DEFAULT_TRANSPORT);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentDestinationIndex, setCurrentDestinationIndex] = useState(0);
  const [steps, setSteps] = useState<NavigationStep[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [legs, setLegs] = useState<{ distance: number; duration: number }[]>([]);
  const [isRiding, setIsRiding] = useState(false);
  const [rideStartTime, setRideStartTime] = useState<Date | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const fetchNavigationRoute = async (mode: TransportMode) => {
    setIsLoadingRoute(true);
    try {
      const allPoints = [
        [startLocation.lng, startLocation.lat],
        ...places.map((p) => [p.longitude, p.latitude] as [number, number]),
      ];
      const res = await fetch("/api/routing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: allPoints, profile: mode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Routing failed");
      }
      const data = await res.json();
      const allSteps: NavigationStep[] = (data.steps ?? []).map(
        (s: {
          instruction: string;
          distance: number;
          duration: number;
          location: [number, number];
          type?: number;
        }) => ({
          instruction: s.instruction,
          distance: s.distance,
          duration: s.duration,
          location: s.location,
          maneuver: orsTypeToManeuver(s.type),
        })
      );
      setSteps(allSteps);
      setRouteGeometry(Array.isArray(data.coordinates) ? data.coordinates : []);
      setLegs(Array.isArray(data.legs) ? data.legs : []);
      setCurrentDestinationIndex(0);
      setIsRiding(false);
      setRideStartTime(null);
      startLocationTracking();
    } catch {
      alert("Failed to load navigation route. Please try again.");
    } finally {
      setIsLoadingRoute(false);
    }
  };

  useEffect(() => {
    fetchNavigationRoute(DEFAULT_TRANSPORT);
  }, []);

  const startLocationTracking = () => {
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          if (steps[currentStep]) {
            const [stepLat, stepLng] = steps[currentStep].location;
            const distance = haversineDistanceKm(
              position.coords.latitude,
              position.coords.longitude,
              stepLat,
              stepLng
            );
            if (distance < 0.02 && currentStep < steps.length - 1) {
              setCurrentStep((s) => s + 1);
            }
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isRiding || steps.length === 0) return;
    const step = steps[currentStep];
    if (!step || step.maneuver.type !== "arrive") return;
    if (currentDestinationIndex < places.length - 1) {
      setCurrentDestinationIndex((i) => Math.min(i + 1, places.length - 1));
    }
  }, [currentStep, steps, isRiding, currentDestinationIndex, places.length]);

  const handleStartEnd = () => {
    if (!isRiding) {
      setIsRiding(true);
      setRideStartTime(new Date());
    } else {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
      onExit();
    }
  };

  const handleExit = () => {
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    onExit();
  };

  if (isLoadingRoute) {
    return (
      <div className="fixed inset-0 bg-[#3a3428] z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <p className="font-cinzel text-white text-xl">Calculating route...</p>
        </div>
      </div>
    );
  }

  if (transportMode && steps.length > 0) {
    return (
      <NavigationModeOverlay
        startLocation={startLocation}
        places={places}
        steps={steps}
        currentStep={currentStep}
        currentDestinationIndex={currentDestinationIndex}
        routeGeometry={routeGeometry}
        legs={legs}
        rideStartTime={rideStartTime}
        isRiding={isRiding}
        onExit={handleExit}
        onStartEnd={handleStartEnd}
      />
    );
  }

  return null;
}
