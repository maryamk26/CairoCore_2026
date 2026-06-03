"use client";

import { useMemo, useState } from "react";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";
import {
  RECOMMENDATIONS_PAGE_SIZE,
  sortRecommendationsByMatchScore,
} from "@/lib/planner/recommendationLimits";
import ChatPlaceCard from "@/components/planner/ChatPlaceCard";

interface ChatRecommendationsListProps {
  recommendations: PlaceRecommendation[];
  selectedPlaceIds: string[];
  onTogglePlace: (place: PlaceRecommendation) => void;
  highlightVibes?: string[];
}

export default function ChatRecommendationsList({
  recommendations,
  selectedPlaceIds,
  onTogglePlace,
  highlightVibes,
}: ChatRecommendationsListProps) {
  const [visibleCount, setVisibleCount] = useState(RECOMMENDATIONS_PAGE_SIZE);

  const sorted = useMemo(() => sortRecommendationsByMatchScore(recommendations), [recommendations]);
  const visible = sorted.slice(0, visibleCount);
  const canShowMore = visibleCount < sorted.length;

  if (sorted.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[#d4af37]/80">
        Suggested places · {sorted.length}
      </p>
      <div className="space-y-2">
        {visible.map((place) => (
          <ChatPlaceCard
            key={place.id}
            place={place}
            selected={selectedPlaceIds.includes(place.id)}
            onToggle={onTogglePlace}
            highlightVibes={highlightVibes}
          />
        ))}
      </div>
      {canShowMore && (
        <button
          type="button"
          onClick={() =>
            setVisibleCount((n) => Math.min(n + RECOMMENDATIONS_PAGE_SIZE, sorted.length))
          }
          className="w-full px-4 py-2 rounded-xl border border-white/25 text-white text-sm font-semibold hover:bg-white/10 transition-colors"
        >
          Show more ({Math.min(RECOMMENDATIONS_PAGE_SIZE, sorted.length - visibleCount)} more)
        </button>
      )}
    </div>
  );
}
