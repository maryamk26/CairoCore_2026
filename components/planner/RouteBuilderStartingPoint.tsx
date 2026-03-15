"use client";

import LocationSelector from "./LocationSelector";
import type { UserLocation } from "@/utils/planner/routeBuilderHelpers";

interface RouteBuilderStartingPointProps {
  userLocation: UserLocation | null;
  onLocationSelect: (loc: UserLocation | null) => void;
  isLoadingLocation: boolean;
}

export default function RouteBuilderStartingPoint({
  userLocation,
  onLocationSelect,
  isLoadingLocation,
}: RouteBuilderStartingPointProps) {
  return (
    <div className="bg-[#5d4e37] rounded-lg p-6">
      <h3 className="font-cinzel text-xl font-bold text-white mb-1">Starting point</h3>
      <p className="font-cinzel text-white/70 text-sm mb-4">
        Choose your starting point so we can calculate travel time and total trip duration.
      </p>
      <LocationSelector onLocationSelect={onLocationSelect} currentLocation={userLocation} />
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
            <p className="font-cinzel text-white/70 text-xs mt-1">{userLocation.address}</p>
          )}
          <p className="font-cinzel text-white/50 text-xs mt-1">
            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </p>
        </div>
      )}
    </div>
  );
}
