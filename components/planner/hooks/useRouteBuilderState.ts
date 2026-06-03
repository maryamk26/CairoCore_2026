import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { RouteMapPlace } from "@/utils/planner/routeMapPlace";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";
import { getPreferredWindow } from "@/utils/planner/routeConstants";
import { fetchOrsRouteGeometry } from "@/utils/planner/fetchOrsRoute";
import {
  type UserLocation,
  type RouteStopWhen,
  insertStopIntoRoute,
  getStopDisplayIndex,
  displayIndexToMainIndex,
  calculateTripStats,
} from "@/utils/planner/routeBuilderHelpers";

const DEFAULT_MINUTES_PER_PLACE = 90;

export interface UseRouteBuilderStateProps {
  places: PlaceRecommendation[];
  minutesPerPlaceProp?: number;
  timeOfDay?: string[];
  routeStop?: PlaceRecommendation | null;
  routeStopWhen: RouteStopWhen;
}

export interface TripStats {
  totalDistance: number;
  travelTime: number;
  totalTime: number;
}

export function useRouteBuilderState({
  places,
  minutesPerPlaceProp,
  timeOfDay,
  routeStop = null,
  routeStopWhen,
}: UseRouteBuilderStateProps) {
  const [orderedPlaces, setOrderedPlaces] = useState(places);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [transportMode, setTransportMode] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [liveRoute, setLiveRoute] = useState<{
    distanceKm: number;
    durationMinutes: number;
    forMode: string;
  } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const lastStartRef = useRef<{ lat: number; lng: number } | null>(null);

  const mins = Number(minutesPerPlaceProp);
  const minutesPerPlace =
    Number.isFinite(mins) && mins >= 15 && mins <= 480 ? mins : DEFAULT_MINUTES_PER_PLACE;

  const placesWithStop = useMemo(
    () =>
      routeStop ? insertStopIntoRoute(orderedPlaces, routeStop, routeStopWhen) : orderedPlaces,
    [orderedPlaces, routeStop, routeStopWhen]
  );

  const stopDisplayIndex = useMemo(
    () => getStopDisplayIndex(orderedPlaces.length, routeStopWhen),
    [orderedPlaces.length, routeStopWhen]
  );

  useEffect(() => {
    setOrderedPlaces(places);
    lastStartRef.current = null;
  }, [places]);

  useEffect(() => {
    if (!userLocation || orderedPlaces.length === 0) return;
    const startKey = `${userLocation.lat.toFixed(5)},${userLocation.lng.toFixed(5)}`;
    const lastKey = lastStartRef.current
      ? `${lastStartRef.current.lat.toFixed(5)},${lastStartRef.current.lng.toFixed(5)}`
      : null;
    if (lastKey === startKey) return;
    lastStartRef.current = { lat: userLocation.lat, lng: userLocation.lng };

    const snapshot = orderedPlaces;
    const ac = new AbortController();

    void (async () => {
      try {
        const res = await fetch("/api/planner/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userLocation: { lat: userLocation.lat, lng: userLocation.lng },
            stops: snapshot.map((p) => ({
              id: p.id,
              lat: p.latitude,
              lng: p.longitude,
            })),
          }),
          signal: ac.signal,
        });
        if (!res.ok || ac.signal.aborted) return;
        const data = (await res.json()) as { order?: number[] };
        if (
          !Array.isArray(data.order) ||
          data.order.length !== snapshot.length ||
          ac.signal.aborted
        )
          return;
        setOrderedPlaces(data.order.map((i) => snapshot[i]));
      } catch {}
    })();

    return () => ac.abort();
  }, [userLocation, orderedPlaces]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      () => setIsLoadingLocation(false)
    );
  }, []);

  useEffect(() => {
    if (!userLocation || !transportMode || placesWithStop.length === 0) {
      setLiveRoute(null);
      return;
    }
    let cancelled = false;
    const modeRequested = transportMode;
    setLoadingRoute(true);
    setLiveRoute(null);
    fetchOrsRouteGeometry({
      start: userLocation,
      stops: placesWithStop,
      transportMode,
    })
      .then((result) => {
        if (!cancelled && result)
          setLiveRoute({
            distanceKm: result.distanceKm,
            durationMinutes: result.durationMinutes,
            forMode: modeRequested,
          });
      })
      .finally(() => {
        if (!cancelled) setLoadingRoute(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userLocation, transportMode, placesWithStop]);

  const fallbackStats = useMemo(
    () => calculateTripStats(userLocation, placesWithStop, transportMode, minutesPerPlace),
    [userLocation, placesWithStop, transportMode, minutesPerPlace]
  );

  const visitTimeMinutes = placesWithStop.length * minutesPerPlace;
  const tripStats = useMemo((): TripStats => {
    if (liveRoute && liveRoute.forMode === transportMode)
      return {
        totalDistance: Math.round(liveRoute.distanceKm * 10) / 10,
        travelTime: liveRoute.durationMinutes,
        totalTime: liveRoute.durationMinutes + visitTimeMinutes,
      };
    return fallbackStats;
  }, [liveRoute, transportMode, fallbackStats, visitTimeMinutes]);

  const canCalculateWholeTrip = !!(userLocation && transportMode && placesWithStop.length > 0);
  const wholeTripMinutes = canCalculateWholeTrip ? tripStats.totalTime : 0;
  const fromLiveMap = !!(liveRoute && liveRoute.forMode === transportMode);
  const preferredWindow = getPreferredWindow(timeOfDay);
  const tripExceedsPreferredTime =
    preferredWindow != null && wholeTripMinutes > preferredWindow.minutes;
  const totalCostEgp = placesWithStop.reduce((sum, p) => sum + (p.entryFees || 0), 0);

  const movePlace = useCallback(
    (displayIndex: number, direction: "up" | "down") => {
      const mainIndex = displayIndexToMainIndex(
        displayIndex,
        routeStop,
        stopDisplayIndex,
        routeStopWhen
      );
      if (mainIndex === null) return;
      const newPlaces = [...orderedPlaces];
      const newDisplayIndex = direction === "up" ? displayIndex - 1 : displayIndex + 1;
      if (newDisplayIndex === stopDisplayIndex) return;
      const newMainIndex = displayIndexToMainIndex(
        newDisplayIndex,
        routeStop,
        stopDisplayIndex,
        routeStopWhen
      );
      if (newMainIndex === null || newMainIndex < 0 || newMainIndex >= newPlaces.length) return;
      if (mainIndex < 0 || mainIndex >= newPlaces.length) return;
      [newPlaces[mainIndex], newPlaces[newMainIndex]] = [
        newPlaces[newMainIndex],
        newPlaces[mainIndex],
      ];
      setOrderedPlaces(newPlaces);
    },
    [orderedPlaces, routeStop, stopDisplayIndex, routeStopWhen]
  );

  const removePlace = useCallback(
    (displayIndex: number) => {
      const mainIndex = displayIndexToMainIndex(
        displayIndex,
        routeStop,
        stopDisplayIndex,
        routeStopWhen
      );
      if (mainIndex === null) return;
      setOrderedPlaces(orderedPlaces.filter((_, i) => i !== mainIndex));
    },
    [orderedPlaces, routeStop, stopDisplayIndex, routeStopWhen]
  );

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) return;
    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsLoadingLocation(false);
      },
      () => {
        alert(
          "Please enable location access in your browser settings to see the route from your current location."
        );
        setIsLoadingLocation(false);
      }
    );
  }, []);

  const mapPlaces = useMemo((): RouteMapPlace[] => {
    const toMapPlace = (p: PlaceRecommendation): RouteMapPlace => ({
      id: p.id,
      title: p.title,
      lat: p.latitude,
      lng: p.longitude,
      address: p.address,
      category: p.category,
    });
    if (userLocation)
      return [
        {
          id: "user-location",
          title: userLocation.title ?? "Your Location",
          lat: userLocation.lat,
          lng: userLocation.lng,
          address: "Starting Point",
        },
        ...placesWithStop.map(toMapPlace),
      ];
    return placesWithStop.map(toMapPlace);
  }, [userLocation, placesWithStop]);

  return {
    orderedPlaces,
    userLocation,
    setUserLocation,
    transportMode,
    setTransportMode,
    isLoadingLocation,
    loadingRoute,
    isNavigationMode,
    setIsNavigationMode,
    placesWithStop,
    minutesPerPlace,
    tripStats,
    canCalculateWholeTrip,
    wholeTripMinutes,
    fromLiveMap,
    totalCostEgp,
    tripExceedsPreferredTime,
    preferredWindowLabel: preferredWindow?.label ?? null,
    movePlace,
    removePlace,
    requestLocation,
    mapPlaces,
  };
}
