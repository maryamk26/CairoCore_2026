"use client";

import { useState } from "react";
import { PlaceRecommendation } from "@/utils/planner/recommendation";
import Image from "next/image";
import FixedPhotoBackdrop from "@/components/layout/FixedPhotoBackdrop";
import { getCategoryIcon } from "@/components/icons/categoryIcons";

const INITIAL_VISIBLE = 6;
const SHOW_MORE_STEP = 6;

const BUDGET_MAX_PER_PLACE: Record<string, number> = {
  low: 50,
  medium: 200,
  high: Infinity,
};

interface PlaceSelectionProps {
  recommendations: PlaceRecommendation[];
  selectedPlaces: PlaceRecommendation[];
  onTogglePlace: (place: PlaceRecommendation) => void;
  onContinue: () => void;
  onBackToSurvey: () => void;
  budget?: string;
}

export default function PlaceSelection({
  recommendations,
  selectedPlaces,
  onTogglePlace,
  onContinue,
  onBackToSurvey,
  budget,
}: PlaceSelectionProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const visible = recommendations.slice(0, visibleCount);
  const hasMore = visibleCount < recommendations.length;
  const isSelected = (placeId: string) => selectedPlaces.some((p) => p.id === placeId);

  const budgetMaxPerPlace = budget ? BUDGET_MAX_PER_PLACE[budget] : Infinity;
  const placesOverBudget = selectedPlaces.filter((p) => (p.entryFees ?? 0) > budgetMaxPerPlace);
  const overBudget = placesOverBudget.length > 0;

  return (
    <div className="min-h-screen relative">
      <FixedPhotoBackdrop
        src="/images/backgrounds/survey.jpg"
        overlayClassName="bg-gradient-to-br from-[#5d4e37]/40 via-[#8b6f47]/30 to-[#5d4e37]/40"
      />

      <div className="relative z-10 px-4 pt-32 pb-8">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-cinzel text-4xl md:text-5xl font-bold text-white mb-4">
                Your Personalized Recommendations
              </h1>
              <p className="font-cinzel text-white/80 text-lg">
                Based on your preferences, we've selected the best places for you. Choose the ones
                you'd like to visit!
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToSurvey}
              className="shrink-0 px-5 py-2.5 rounded-lg border-2 border-white/60 text-white font-cinzel font-semibold hover:bg-white/10 transition-colors"
            >
              Edit my answers
            </button>
          </div>

          {overBudget && (
            <div className="mb-6 rounded-lg border-2 border-amber-400 bg-amber-500/20 p-4 flex items-center gap-3">
              <span className="text-amber-200 shrink-0" aria-hidden>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </span>
              <p className="font-cinzel text-amber-100 text-sm sm:text-base">
                {placesOverBudget.length} place{placesOverBudget.length !== 1 ? "s" : ""} exceed
                your per-place budget (max{" "}
                {budget === "low" ? "50" : budget === "medium" ? "200" : "—"} EGP per place):{" "}
                {placesOverBudget.map((p) => p.title).join(", ")}.
              </p>
            </div>
          )}

          {selectedPlaces.length > 0 && (
            <div className="bg-[#d4af37] text-[#3a3428] rounded-lg p-4 mb-6 flex items-center justify-between">
              <span className="font-cinzel font-semibold">
                {selectedPlaces.length} place{selectedPlaces.length !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={onContinue}
                disabled={selectedPlaces.length < 1}
                className="px-6 py-2 bg-[#3a3428] text-[#d4af37] rounded-lg font-cinzel font-semibold hover:bg-[#4a4438] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedPlaces.length === 1 ? "View Location →" : "Build My Route →"}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((place) => {
              const selected = isSelected(place.id);
              const PlaceIcon = getCategoryIcon(place.category ?? "other");
              return (
                <div
                  key={place.id}
                  className={`bg-[#5d4e37] rounded-lg overflow-hidden shadow-lg transition-all cursor-pointer ${
                    selected ? "ring-4 ring-[#d4af37]" : "hover:ring-2 hover:ring-white/30"
                  }`}
                  onClick={() => onTogglePlace(place)}
                >
                  <div className="relative h-48 bg-gray-800">
                    {place.images?.length ? (
                      <Image
                        src={place.images[0]}
                        alt={place.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/50">
                        <svg
                          className="w-16 h-16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-[#d4af37] text-[#3a3428] px-3 py-1 rounded-full font-cinzel font-bold text-sm">
                      {Math.round(place.matchScore)}% Match
                    </div>
                    {selected && (
                      <div className="absolute top-3 left-3 bg-[#d4af37] text-[#3a3428] w-8 h-8 rounded-full flex items-center justify-center">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <PlaceIcon size={20} className="text-[#d4af37] shrink-0" />
                      <h3 className="font-cinzel text-xl font-bold text-white">{place.title}</h3>
                    </div>

                    <p className="font-cinzel text-white/70 text-sm mb-3 line-clamp-2">
                      {place.description}
                    </p>

                    {place.matchReasons && place.matchReasons.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {place.matchReasons.slice(0, 2).map((reason, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#d4af37] flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="font-cinzel text-white/80 text-xs">{reason}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mb-3">
                      {place.vibe.slice(0, 3).map((vibe) => (
                        <span
                          key={vibe}
                          className="px-2 py-1 bg-[#8b6f47] text-white text-xs rounded font-cinzel"
                        >
                          {vibe}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-white/70 text-sm">
                      <div className="flex items-center gap-2">
                        {place.entryFees !== null && place.entryFees > 0 ? (
                          <span className="font-cinzel">{place.entryFees} EGP</span>
                        ) : (
                          <span className="font-cinzel text-[#d4af37]">Free</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {place.kidsFriendly && <span title="Kid-friendly">👶</span>}
                        {place.petsFriendly && <span title="Pet-friendly">🐕</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((c) => c + SHOW_MORE_STEP)}
                className="px-8 py-3 rounded-lg border-2 border-[#d4af37] text-[#d4af37] font-cinzel font-semibold hover:bg-[#d4af37]/10 transition-colors"
              >
                Show more
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
