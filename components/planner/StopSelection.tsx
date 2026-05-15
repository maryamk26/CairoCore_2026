"use client";

import { useState } from "react";
import { PlaceRecommendation } from "@/utils/planner/recommendation";
import Image from "next/image";
import FixedPhotoBackdrop from "@/components/layout/FixedPhotoBackdrop";
import { getCategoryIcon } from "@/components/icons/categoryIcons";

const INITIAL_VISIBLE = 6;
const SHOW_MORE_STEP = 6;

interface StopSelectionProps {
  title: string;
  recommendations: PlaceRecommendation[];
  selectedStop: PlaceRecommendation | null;
  onSelectStop: (place: PlaceRecommendation | null) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function StopSelection({
  title,
  recommendations,
  selectedStop,
  onSelectStop,
  onContinue,
  onBack,
}: StopSelectionProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const visible = recommendations.slice(0, visibleCount);
  const hasMore = visibleCount < recommendations.length;

  const handleCardClick = (place: PlaceRecommendation) => {
    if (selectedStop?.id === place.id) {
      onSelectStop(null);
    } else {
      onSelectStop(place);
    }
  };

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
                {title}
              </h1>
              <p className="font-cinzel text-white/80 text-lg">
                Choose one stop to add to your route. We&apos;ll place it at the right moment based
                on your preference.
              </p>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 px-5 py-2.5 rounded-lg border-2 border-white/60 text-white font-cinzel font-semibold hover:bg-white/10 transition-colors"
            >
              Back to places
            </button>
          </div>

          {selectedStop && (
            <div className="bg-[#d4af37] text-[#3a3428] rounded-lg p-4 mb-6 flex items-center justify-between">
              <span className="font-cinzel font-semibold">Selected: {selectedStop.title}</span>
            </div>
          )}

          {recommendations.length === 0 && (
            <p className="font-cinzel text-white/80 mb-6">
              No {title.toLowerCase()} in the dataset yet. You can continue without a stop.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((place) => {
              const selected = selectedStop?.id === place.id;
              const PlaceIcon = getCategoryIcon(place.category ?? "other");
              return (
                <div
                  key={place.id}
                  className={`bg-[#5d4e37] rounded-lg overflow-hidden shadow-lg transition-all cursor-pointer ${
                    selected ? "ring-4 ring-[#d4af37]" : "hover:ring-2 hover:ring-white/30"
                  }`}
                  onClick={() => handleCardClick(place)}
                >
                  <div className="relative h-48 bg-gray-800">
                    {place.images && place.images.length > 0 ? (
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

                    {place.matchScore > 0 && (
                      <div className="absolute top-3 right-3 bg-[#d4af37] text-[#3a3428] px-3 py-1 rounded-full font-cinzel font-bold text-sm">
                        {Math.round(place.matchScore)}% Match
                      </div>
                    )}

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

                    {place.vibe && place.vibe.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {place.vibe.slice(0, 3).map((v) => (
                          <span
                            key={v}
                            className="px-2 py-1 bg-[#8b6f47] text-white text-xs rounded font-cinzel"
                          >
                            {v}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-white/70 text-sm">
                      {place.entryFees !== null && place.entryFees > 0 ? (
                        <span className="font-cinzel">{place.entryFees} EGP</span>
                      ) : (
                        <span className="font-cinzel text-[#d4af37]">Free entry</span>
                      )}
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
                onClick={() =>
                  setVisibleCount((c) => Math.min(c + SHOW_MORE_STEP, recommendations.length))
                }
                className="px-8 py-3 rounded-lg border-2 border-[#d4af37] text-[#d4af37] font-cinzel font-semibold hover:bg-[#d4af37]/10 transition-colors"
              >
                Show more
              </button>
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={onContinue}
              className="px-8 py-3 bg-[#d4af37] text-[#3a3428] rounded-lg font-cinzel font-bold hover:bg-[#e5bf47] transition-colors"
            >
              Build My Route →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
