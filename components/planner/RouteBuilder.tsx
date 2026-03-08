"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { PlaceRecommendation } from "@/utils/planner/recommendation";
import { calculateDistance } from "@/utils/algorithms/distance";
import { optimizeRouteFromLocation } from "@/utils/algorithms/routeOptimization";
import LocationSelector from "./LocationSelector";
import { getCategoryIcon } from "@/components/icons/categoryIcons";

const RouteMap = dynamic(() => import("@/components/places/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-200 flex items-center justify-center rounded-lg">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

const NavigationMode = dynamic(() => import("./NavigationMode"), {
  ssr: false,
});

const SPEED_KMH: Record<string, number> = {
  walk: 5,
  car: 60,
  motorcycle: 78,
};

const ROAD_FACTOR: Record<string, number> = {
  walk: 1.2,
  car: 1.35,
  motorcycle: 1.3,
};

const TIME_OF_DAY_BOUNDS: Record<string, { start: number; end: number; label: string }> = {
  morning: { start: 6 * 60, end: 12 * 60, label: "Morning (6am–12pm)" },
  afternoon: { start: 12 * 60, end: 18 * 60, label: "Afternoon (12pm–6pm)" },
  evening: { start: 18 * 60, end: 22 * 60, label: "Evening (6pm–10pm)" },
  night: { start: 22 * 60, end: 24 * 60, label: "Night (10pm+)" },
};

function getPreferredWindow(timeOfDay: string[] | undefined): { minutes: number; label: string } | null {
  if (!timeOfDay || timeOfDay.length === 0) return null;
  let minStart = 24 * 60;
  let maxEnd = 0;
  const labels: string[] = [];
  for (const key of timeOfDay) {
    const b = TIME_OF_DAY_BOUNDS[key];
    if (!b) continue;
    if (b.start < minStart) minStart = b.start;
    if (b.end > maxEnd) maxEnd = b.end;
    if (!labels.includes(b.label)) labels.push(b.label);
  }
  if (maxEnd <= minStart) return null;
  return { minutes: maxEnd - minStart, label: labels.join(" / ") };
}

async function fetchOsrmRoute(
  start: { lat: number; lng: number },
  places: { latitude: number; longitude: number }[],
  transportMode: string
): Promise<{ distanceKm: number; durationMinutes: number; profileUsed: string } | null> {
  if (places.length === 0) return null;
  const waypoints = [start, ...places.map((p) => ({ lat: p.latitude, lng: p.longitude }))];
  const coordinates = waypoints.map((p) => `${p.lng},${p.lat}`).join(";");

  const profileForRequest = transportMode === "walk" ? "foot" : "car";
  const url = `https://router.project-osrm.org/route/v1/${profileForRequest}/${coordinates}?overview=simplified`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) {
      if (transportMode === "walk") {
        const carUrl = `https://router.project-osrm.org/route/v1/car/${coordinates}?overview=simplified`;
        const carRes = await fetch(carUrl);
        if (!carRes.ok) return null;
        const carData = await carRes.json();
        if (carData.code !== "Ok" || !carData.routes?.[0]) return null;
        const distanceKm = (carData.routes[0].distance as number) / 1000;
        const durationMinutes = Math.round((distanceKm / SPEED_KMH.walk) * 60);
        return { distanceKm, durationMinutes, profileUsed: "car" };
      }
      return null;
    }
    const route = data.routes[0];
    const distanceKm = (route.distance as number) / 1000;
    let durationMinutes: number;
    if (transportMode === "walk") {
      durationMinutes = Math.round((distanceKm / SPEED_KMH.walk) * 60);
    } else if (transportMode === "motorcycle") {
      durationMinutes = Math.round((distanceKm / SPEED_KMH.motorcycle) * 60);
    } else {
      durationMinutes = Math.round((route.duration as number) / 60);
    }
    return { distanceKm, durationMinutes, profileUsed: profileForRequest };
  } catch {
    return null;
  }
}

type RouteStopWhen = "beginning" | "middle" | "end";

interface RouteBuilderProps {
  places: PlaceRecommendation[];
  onBack: () => void;
  onSave?: () => void;
  minutesPerPlace?: number;
  timeOfDay?: string[];
  routeStop?: PlaceRecommendation | null;
  routeStopWhen?: RouteStopWhen;
}

interface UserLocation {
  lat: number;
  lng: number;
  title?: string;
  address?: string;
}

function insertStopIntoRoute(
  mainPlaces: PlaceRecommendation[],
  stop: PlaceRecommendation,
  when: RouteStopWhen
): PlaceRecommendation[] {
  if (mainPlaces.length === 0) return [stop];
  const n = mainPlaces.length;
  const insertIndex =
    when === "beginning" ? 0 : when === "middle" ? Math.floor(n / 2) : n;
  return [
    ...mainPlaces.slice(0, insertIndex),
    stop,
    ...mainPlaces.slice(insertIndex),
  ];
}

export default function RouteBuilder({
  places,
  onBack,
  onSave,
  minutesPerPlace: minutesPerPlaceProp,
  timeOfDay,
  routeStop = null,
  routeStopWhen = "middle",
}: RouteBuilderProps) {
  const [orderedPlaces, setOrderedPlaces] = useState(places);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [transportMode, setTransportMode] = useState<string>("");
  const mins = Number(minutesPerPlaceProp);
  const minutesPerPlace = Number.isFinite(mins) && mins >= 15 && mins <= 480 ? mins : 90;
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [liveRoute, setLiveRoute] = useState<{
    distanceKm: number;
    durationMinutes: number;
    forMode: string;
  } | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const lastStartRef = useRef<{ lat: number; lng: number } | null>(null);

  const placesWithStop = useMemo(() => {
    if (!routeStop) return orderedPlaces;
    return insertStopIntoRoute(orderedPlaces, routeStop, routeStopWhen);
  }, [orderedPlaces, routeStop, routeStopWhen]);

  const stopDisplayIndex = useMemo(() => {
    if (!routeStop) return -1;
    const n = orderedPlaces.length;
    return routeStopWhen === "beginning"
      ? 0
      : routeStopWhen === "middle"
        ? Math.floor(n / 2)
        : n;
  }, [orderedPlaces.length, routeStop, routeStopWhen]);

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
    const withLoc = orderedPlaces.map((p) => ({
      id: p.id,
      lat: p.latitude,
      lng: p.longitude,
    }));
    const result = optimizeRouteFromLocation(withLoc, {
      lat: userLocation.lat,
      lng: userLocation.lng,
    });
    const reordered = result.order.map((i) => orderedPlaces[i]);
    setOrderedPlaces(reordered);
  }, [userLocation, orderedPlaces]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationPermission('granted');
          setIsLoadingLocation(false);
        },
        () => {
          setLocationPermission('denied');
          setIsLoadingLocation(false);
        }
      );
    }
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
    fetchOsrmRoute(userLocation, placesWithStop, transportMode)
      .then((result) => {
        if (!cancelled && result) {
          setLiveRoute({
            distanceKm: result.distanceKm,
            durationMinutes: result.durationMinutes,
            forMode: modeRequested,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingRoute(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userLocation, transportMode, placesWithStop]);

  const calculateTripStats = () => {
    if (!userLocation || placesWithStop.length === 0 || !transportMode) {
      return { totalDistance: 0, totalTime: 0, travelTime: 0 };
    }

    let totalDistance = 0;
    let previousLocation = userLocation;

    placesWithStop.forEach((place) => {
      const distance = calculateDistance(
        { lat: previousLocation.lat, lng: previousLocation.lng },
        { lat: place.latitude, lng: place.longitude }
      );
      totalDistance += Number.isFinite(distance) ? distance : 0;
      previousLocation = { lat: place.latitude, lng: place.longitude };
    });

    const factor = ROAD_FACTOR[transportMode] ?? 1.35;
    const roadDistanceKm = totalDistance * factor;
    const speed = SPEED_KMH[transportMode] ?? 60;
    const travelTimeHours = roadDistanceKm / speed;
    const travelTimeMinutes = Math.round(travelTimeHours * 60);
    const visitTimeMinutes = placesWithStop.length * minutesPerPlace;
    const totalTimeMinutes = travelTimeMinutes + visitTimeMinutes;

    const safe = (n: number) => (Number.isFinite(n) ? n : 0);
    return {
      totalDistance: safe(Math.round(roadDistanceKm * 10) / 10),
      travelTime: safe(travelTimeMinutes),
      totalTime: safe(totalTimeMinutes),
    };
  };

  const fallbackStats = useMemo(
    () => calculateTripStats(),
    [userLocation, placesWithStop, transportMode, minutesPerPlace]
  );
  const visitTimeMinutes = placesWithStop.length * minutesPerPlace;
  const tripStats = useMemo(() => {
    if (liveRoute && liveRoute.forMode === transportMode) {
      const totalTime = liveRoute.durationMinutes + visitTimeMinutes;
      return {
        totalDistance: Math.round(liveRoute.distanceKm * 10) / 10,
        travelTime: liveRoute.durationMinutes,
        totalTime,
      };
    }
    return fallbackStats;
  }, [liveRoute, transportMode, fallbackStats, visitTimeMinutes]);
  const canCalculateWholeTrip = !!(userLocation && transportMode && placesWithStop.length > 0);
  const wholeTripMinutes = canCalculateWholeTrip ? tripStats.totalTime : 0;
  const fromLiveMap = !!(liveRoute && liveRoute.forMode === transportMode);
  const preferredWindow = getPreferredWindow(timeOfDay);
  const tripExceedsPreferredTime = preferredWindow != null && wholeTripMinutes > preferredWindow.minutes;

  const displayIndexToMainIndex = (displayIndex: number): number | null => {
    if (!routeStop || stopDisplayIndex < 0) return displayIndex;
    if (displayIndex === stopDisplayIndex) return null;
    if (routeStopWhen === "beginning") return displayIndex - 1;
    if (routeStopWhen === "end") return displayIndex;
    return displayIndex < stopDisplayIndex ? displayIndex : displayIndex - 1;
  };

  const movePlace = (displayIndex: number, direction: "up" | "down") => {
    const mainIndex = displayIndexToMainIndex(displayIndex);
    if (mainIndex === null) return;
    const newPlaces = [...orderedPlaces];
    const newDisplayIndex = direction === "up" ? displayIndex - 1 : displayIndex + 1;
    if (newDisplayIndex === stopDisplayIndex) return;
    const newMainIndex = displayIndexToMainIndex(newDisplayIndex);
    if (newMainIndex === null || newMainIndex < 0 || newMainIndex >= newPlaces.length) return;
    if (mainIndex < 0 || mainIndex >= newPlaces.length) return;
    [newPlaces[mainIndex], newPlaces[newMainIndex]] = [newPlaces[newMainIndex], newPlaces[mainIndex]];
    setOrderedPlaces(newPlaces);
  };

  const removePlace = (displayIndex: number) => {
    const mainIndex = displayIndexToMainIndex(displayIndex);
    if (mainIndex === null) return;
    const newPlaces = orderedPlaces.filter((_, i) => i !== mainIndex);
    setOrderedPlaces(newPlaces);
  };

  const handleSave = () => {
    onSave?.();
    alert("Route saved.");
  };

  const toMapPlace = (place: PlaceRecommendation) => ({
    id: place.id,
    title: place.title,
    lat: place.latitude,
    lng: place.longitude,
    address: place.address,
    category: place.category,
  });
  const mapPlaces = userLocation
    ? [{ id: "user-location", title: userLocation.title ?? "Your Location", lat: userLocation.lat, lng: userLocation.lng, address: "Starting Point" }, ...placesWithStop.map(toMapPlace)]
    : placesWithStop.map(toMapPlace);

  const requestLocation = () => {
    if ('geolocation' in navigator) {
      setIsLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationPermission('granted');
          setIsLoadingLocation(false);
        },
        (error) => {
          alert('Please enable location access in your browser settings to see the route from your current location.');
          setLocationPermission('denied');
          setIsLoadingLocation(false);
        }
      );
    }
  };

  const handleYallaClick = () => {
    if (!userLocation) {
      alert("Please set your starting location first!");
      return;
    }
    setIsNavigationMode(true);
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
            backgroundImage: 'url(/images/backgrounds/survey.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#5d4e37',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#5d4e37]/40 via-[#8b6f47]/30 to-[#5d4e37]/40" />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-32 pb-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-2 text-white/70 hover:text-white transition-colors font-cinzel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Selection
          </button>
          <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-white mb-4">
            {placesWithStop.length === 1 ? "Your Selected Location" : "Your Optimized Route"}
          </h1>
          <p className="font-cinzel text-white/80 text-lg">
            {placesWithStop.length === 1
              ? "View your selected location on the map and add more places if you'd like."
              : "Review and adjust your trip route. Drag to reorder stops."}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-[#5d4e37] rounded-lg p-6">
              {placesWithStop.length >= 1 ? (
                <RouteMap places={mapPlaces} height="600px" />
              ) : null}
            </div>
          </div>

      <div className="space-y-6">
        <div className="bg-[#5d4e37] rounded-lg p-6">
          <h3 className="font-cinzel text-xl font-bold text-white mb-1">
            Starting point
          </h3>
          <p className="font-cinzel text-white/70 text-sm mb-4">
            Choose your starting point so we can calculate travel time and total trip duration. We’re waiting for your choice.
          </p>
          <LocationSelector
            onLocationSelect={setUserLocation}
            currentLocation={userLocation}
          />
          {!userLocation && !isLoadingLocation && (
            <p className="font-cinzel text-white/50 text-xs mt-3">
              Use “Share my location” or search for an address below.
            </p>
          )}
          {userLocation && (
            <div className="mt-3 p-3 bg-[#8b6f47] rounded">
              <p className="font-cinzel text-white font-semibold text-sm">
                {userLocation.title || "Your location"}
              </p>
              {userLocation.address && (
                <p className="font-cinzel text-white/70 text-xs mt-1">
                  {userLocation.address}
                </p>
              )}
              <p className="font-cinzel text-white/50 text-xs mt-1">
                {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
              </p>
            </div>
          )}
        </div>

        <div className="bg-[#5d4e37] rounded-lg p-6">
          <h3 className="font-cinzel text-xl font-bold text-white mb-1">
            How you get around
          </h3>
          <p className="font-cinzel text-white/70 text-sm mb-4">
            Choose how you’ll travel between stops. We need this to calculate travel time and total trip duration. We’re waiting for your choice.
          </p>
          <div className="flex flex-wrap gap-2">
            {(["walk", "car", "motorcycle"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTransportMode(mode)}
                className={`px-4 py-2 rounded-lg font-cinzel font-semibold capitalize transition-colors ${
                  transportMode === mode
                    ? "bg-[#d4af37] text-[#3a3428]"
                    : "bg-[#8b6f47] text-white hover:bg-[#9d7f57]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          {!transportMode && (
            <p className="font-cinzel text-white/50 text-xs mt-3">
              Choose Walk, Car, or Motorcycle above.
            </p>
          )}
        </div>

        <div className="bg-[#5d4e37] rounded-lg p-6">
              <h3 className="font-cinzel text-xl font-bold text-white mb-4">
                Route Summary
              </h3>

              {!userLocation && !isLoadingLocation && (
                <div className="mb-4 p-3 bg-[#d4af37]/20 border border-[#d4af37] rounded-lg">
                  <p className="font-cinzel text-white text-sm mb-2">
                    Set your starting point and choose how you get around (above) to see travel time and total trip duration.
                  </p>
                  <button
                    onClick={requestLocation}
                    className="w-full px-4 py-2 bg-[#d4af37] text-[#3a3428] rounded font-cinzel font-semibold hover:bg-[#e5bf47] transition-colors text-sm"
                  >
                    Share my location
                  </button>
                </div>
              )}

              {isLoadingLocation && (
                <div className="mb-4 p-3 bg-[#8b6f47] rounded-lg text-center">
                  <p className="font-cinzel text-white text-sm">
                    Getting your location...
                  </p>
                </div>
              )}

              {tripExceedsPreferredTime && (
                <div className="mb-4 rounded-lg border-2 border-amber-400 bg-amber-500/20 p-4 flex items-start gap-3">
                  <span className="text-amber-200 shrink-0 mt-0.5" aria-hidden>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div className="font-cinzel text-amber-100 text-sm">
                    <p className="font-semibold mb-1">Trip longer than your preferred time</p>
                    <p>
                      Your trip (~{Math.floor(wholeTripMinutes / 60)}h {wholeTripMinutes % 60}m) is longer than your {preferredWindow?.label} window. You might not finish in time, and some places may close earlier—check opening hours before you go.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {userLocation && (tripStats.totalDistance > 0 || loadingRoute) && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-cinzel text-white/70">Total Distance</span>
                      {loadingRoute ? (
                        <span className="font-cinzel text-white/70 text-sm">Loading route…</span>
                      ) : (
                        <span className="font-cinzel text-white font-semibold">
                          {tripStats.totalDistance} km
                        </span>
                      )}
                    </div>
                <div className="flex justify-between">
                  <span className="font-cinzel text-white/70">Travel time (whole route)</span>
                  {loadingRoute ? (
                    <span className="font-cinzel text-white/70 text-sm">Loading route…</span>
                  ) : (
                    <span className="font-cinzel text-white font-semibold">
                      ~{Math.floor(tripStats.travelTime / 60)}h {tripStats.travelTime % 60}m
                    </span>
                  )}
                </div>
                <p className="font-cinzel text-white/50 text-xs">
                  {fromLiveMap ? "From live route (OSRM)." : "Estimate (straight-line × road factor); live route unavailable."}
                </p>
                <div className="flex justify-between">
                  <span className="font-cinzel text-white/70">Time at places</span>
                  <span className="font-cinzel text-white font-semibold">
                    ~{Math.floor((placesWithStop.length * minutesPerPlace) / 60)}h {(placesWithStop.length * minutesPerPlace) % 60}m
                  </span>
                </div>
                    <div className="h-px bg-white/20 my-2"></div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="font-cinzel text-white/70">Total Stops</span>
                  <span className="font-cinzel text-white font-semibold">
                    {placesWithStop.length}
                  </span>
                </div>
                {placesWithStop.length > 0 && (
                  <div className="flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-cinzel text-white/70">
                        Whole trip (travel + time at places)
                      </span>
                      {canCalculateWholeTrip && Number.isFinite(wholeTripMinutes) ? (
                        <span className="font-cinzel text-white font-semibold">
                          ~{Math.floor(wholeTripMinutes / 60)}h {wholeTripMinutes % 60}m
                        </span>
                      ) : (
                        <span className="font-cinzel text-white/50 text-sm">
                          —
                        </span>
                      )}
                    </div>
                    {!canCalculateWholeTrip && (
                      <p className="font-cinzel text-white/50 text-xs">
                        Set starting point and choose transport above to calculate.
                      </p>
                    )}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-cinzel text-white/70">Total Cost</span>
                  <span className="font-cinzel text-white font-semibold">
                    {placesWithStop.reduce((sum, place) => sum + (place.entryFees || 0), 0)} EGP
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#5d4e37] rounded-lg p-6">
              <h3 className="font-cinzel text-xl font-bold text-white mb-4">
                Your Route
              </h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {placesWithStop.map((place, index) => {
                  const isStop = !!routeStop && place.id === routeStop.id;
                  const RouteIcon = getCategoryIcon(place.category ?? "other");
                  return (
                    <div
                      key={place.id}
                      className={`rounded-lg p-4 ${isStop ? "bg-[#8b6f47] ring-2 ring-[#d4af37]" : "bg-[#8b6f47]"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4af37] flex items-center justify-center text-[#3a3428] font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          {isStop && (
                            <span className="font-cinzel text-[#d4af37] text-xs font-semibold block mb-1">
                              Stop — {routeStopWhen === "beginning" ? "Start" : routeStopWhen === "middle" ? "Mid-route" : "End"}
                            </span>
                          )}
                          <div className="flex items-center gap-2 mb-1">
                            <RouteIcon size={18} className="text-[#d4af37] shrink-0" />
                            <h4 className="font-cinzel text-white font-semibold text-sm">
                              {place.title}
                            </h4>
                          </div>
                        <p className="font-cinzel text-white/60 text-xs mb-2">
                          {place.address}
                        </p>
                        <div className="flex items-center gap-2 text-white/70 text-xs">
                          {place.entryFees !== null && place.entryFees > 0 ? (
                            <span className="font-cinzel">
                              {place.entryFees} EGP
                            </span>
                          ) : (
                            <span className="font-cinzel text-[#d4af37]">
                              Free
                            </span>
                          )}
                          {place.kidsFriendly && <span title="Kid-friendly">👶</span>}
                          {place.petsFriendly && <span title="Pet-friendly">🐕</span>}
                        </div>
                        </div>

                        {!isStop && (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => movePlace(index, "up")}
                                disabled={index === 0}
                                className="p-1 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Move up"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => movePlace(index, "down")}
                                disabled={index === placesWithStop.length - 1}
                                className="p-1 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label="Move down"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => removePlace(index)}
                                className="p-1 text-red-400 hover:text-red-300"
                                aria-label="Remove"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {userLocation && placesWithStop.length >= 1 && (
                <button
                  type="button"
                  onClick={handleYallaClick}
                  className="w-full px-6 py-4 bg-gradient-to-r from-[#d4af37] to-[#e5bf47] text-[#3a3428] rounded-lg font-cinzel font-bold hover:from-[#e5bf47] hover:to-[#f5cf57] transition-all transform hover:scale-105 shadow-lg text-lg"
                >
                  Yalla! Let's Go
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={placesWithStop.length < 1}
                className="w-full px-6 py-3 bg-[#d4af37] text-[#3a3428] rounded-lg font-cinzel font-bold hover:bg-[#e5bf47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placesWithStop.length === 1 ? "Save Location" : "Save Route"}
              </button>
              <button
                onClick={onBack}
                className="w-full px-6 py-3 bg-[#8b6f47] text-white rounded-lg font-cinzel font-semibold hover:bg-[#9d7f57] transition-colors"
              >
                Add More Places
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

