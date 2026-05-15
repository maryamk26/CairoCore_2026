"use client";

interface RouteBuilderSummaryProps {
  userLocation: { lat: number; lng: number } | null;
  isLoadingLocation: boolean;
  onRequestLocation: () => void;
  tripStats: { totalDistance: number; travelTime: number; totalTime: number };
  loadingRoute: boolean;
  fromLiveMap: boolean;
  placesCount: number;
  minutesPerPlace: number;
  canCalculateWholeTrip: boolean;
  wholeTripMinutes: number;
  totalCostEgp: number;
  tripExceedsPreferredTime: boolean;
  preferredWindowLabel: string | null;
}

export default function RouteBuilderSummary({
  userLocation,
  isLoadingLocation,
  onRequestLocation,
  tripStats,
  loadingRoute,
  fromLiveMap,
  placesCount,
  minutesPerPlace,
  canCalculateWholeTrip,
  wholeTripMinutes,
  totalCostEgp,
  tripExceedsPreferredTime,
  preferredWindowLabel,
}: RouteBuilderSummaryProps) {
  const visitTimeMinutes = placesCount * minutesPerPlace;

  return (
    <div className="bg-[#5d4e37] rounded-lg p-6">
      <h3 className="font-cinzel text-xl font-bold text-white mb-4">Route Summary</h3>

      {!userLocation && !isLoadingLocation && (
        <div className="mb-4 p-3 bg-[#d4af37]/20 border border-[#d4af37] rounded-lg">
          <p className="font-cinzel text-white text-sm mb-2">
            Set your starting point and choose how you get around (above) to see travel time and
            total trip duration.
          </p>
          <button
            onClick={onRequestLocation}
            className="w-full px-4 py-2 bg-[#d4af37] text-[#3a3428] rounded font-cinzel font-semibold hover:bg-[#e5bf47] transition-colors text-sm"
          >
            Share my location
          </button>
        </div>
      )}

      {isLoadingLocation && (
        <div className="mb-4 p-3 bg-[#8b6f47] rounded-lg text-center">
          <p className="font-cinzel text-white text-sm">Getting your location...</p>
        </div>
      )}

      {tripExceedsPreferredTime && preferredWindowLabel && (
        <div className="mb-4 rounded-lg border-2 border-amber-400 bg-amber-500/20 p-4 flex items-start gap-3">
          <span className="text-amber-200 shrink-0 mt-0.5" aria-hidden>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
          <div className="font-cinzel text-amber-100 text-sm">
            <p className="font-semibold mb-1">Trip longer than your preferred time</p>
            <p>
              Your trip (~{Math.floor(wholeTripMinutes / 60)}h {wholeTripMinutes % 60}m) is longer
              than your {preferredWindowLabel} window. Check opening hours before you go.
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
              {fromLiveMap
                ? "From live route (OSRM)."
                : "Estimate (straight-line × road factor); live route unavailable."}
            </p>
            <div className="flex justify-between">
              <span className="font-cinzel text-white/70">Time at places</span>
              <span className="font-cinzel text-white font-semibold">
                ~{Math.floor(visitTimeMinutes / 60)}h {visitTimeMinutes % 60}m
              </span>
            </div>
            <div className="h-px bg-white/20 my-2" />
          </>
        )}
        <div className="flex justify-between">
          <span className="font-cinzel text-white/70">Total Stops</span>
          <span className="font-cinzel text-white font-semibold">{placesCount}</span>
        </div>
        {placesCount > 0 && (
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
                <span className="font-cinzel text-white/50 text-sm">—</span>
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
          <span className="font-cinzel text-white font-semibold">{totalCostEgp} EGP</span>
        </div>
      </div>
    </div>
  );
}
