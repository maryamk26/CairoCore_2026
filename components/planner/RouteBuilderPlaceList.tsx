"use client";

import type { PlaceRecommendation } from "@/utils/planner/recommendation";
import { getCategoryIcon } from "@/components/icons/categoryIcons";
import type { RouteStopWhen } from "@/utils/planner/routeBuilderHelpers";

interface RouteBuilderPlaceListProps {
  places: PlaceRecommendation[];
  routeStop: PlaceRecommendation | null;
  routeStopWhen: RouteStopWhen;
  onMovePlace: (displayIndex: number, direction: "up" | "down") => void;
  onRemovePlace: (displayIndex: number) => void;
}

export default function RouteBuilderPlaceList({
  places,
  routeStop,
  routeStopWhen,
  onMovePlace,
  onRemovePlace,
}: RouteBuilderPlaceListProps) {
  const stopLabel =
    routeStopWhen === "beginning" ? "Start" : routeStopWhen === "middle" ? "Mid-route" : "End";

  return (
    <div className="bg-[#5d4e37] rounded-lg p-6">
      <h3 className="font-cinzel text-xl font-bold text-white mb-4">Your Route</h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {places.map((place, index) => {
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
                      Stop — {stopLabel}
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <RouteIcon size={18} className="text-[#d4af37] shrink-0" />
                    <h4 className="font-cinzel text-white font-semibold text-sm">{place.title}</h4>
                  </div>
                  <p className="font-cinzel text-white/60 text-xs mb-2">{place.address}</p>
                  <div className="flex items-center gap-2 text-white/70 text-xs">
                    {place.entryFees !== null && place.entryFees > 0 ? (
                      <span className="font-cinzel">{place.entryFees} EGP</span>
                    ) : (
                      <span className="font-cinzel text-[#d4af37]">Free</span>
                    )}
                    {place.kidsFriendly && <span title="Kid-friendly">👶</span>}
                    {place.petsFriendly && <span title="Pet-friendly">🐕</span>}
                  </div>
                </div>
                {!isStop && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => onMovePlace(index, "up")}
                      disabled={index === 0}
                      className="p-1 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onMovePlace(index, "down")}
                      disabled={index === places.length - 1}
                      className="p-1 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onRemovePlace(index)}
                      className="p-1 text-red-400 hover:text-red-300"
                      aria-label="Remove"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
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
  );
}
