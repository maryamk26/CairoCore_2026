"use client";

import Image from "next/image";
import type { PlaceRecommendation } from "@/utils/planner/recommendation";
import { getCategoryIcon } from "@/components/icons/categoryIcons";
import { orderPlaceVibesForDisplay } from "@/lib/planner/scoreCandidatesForTrip";

interface ChatPlaceCardProps {
  place: PlaceRecommendation;
  selected?: boolean;
  onToggle?: (place: PlaceRecommendation) => void;
  highlightVibes?: string[];
}

export default function ChatPlaceCard({
  place,
  selected,
  onToggle,
  highlightVibes,
}: ChatPlaceCardProps) {
  const image = place.images?.[0];
  const reason = place.matchReasons?.[0];
  const PlaceIcon = getCategoryIcon(place.category ?? "other");
  const isSelectable = typeof onToggle === "function";

  return (
    <button
      type="button"
      onClick={isSelectable ? () => onToggle(place) : undefined}
      className={`w-full text-left flex gap-3 rounded-xl border p-2.5 transition-all ${
        selected
          ? "bg-[#d4af37]/15 border-[#d4af37] ring-1 ring-[#d4af37]/40"
          : "bg-[#3a3428]/60 border-white/10 hover:border-white/25 hover:bg-[#3a3428]/80"
      } ${isSelectable ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-[#5d4e37]">
        {image ? (
          <Image src={image} alt={place.title} fill className="object-cover" sizes="64px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#d4af37]">
            <PlaceIcon className="w-7 h-7" aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-white text-sm truncate">{place.title}</h3>
          <div className="shrink-0 flex items-center gap-2">
            {selected && (
              <span className="text-xs font-cinzel font-bold text-[#d4af37]">Selected</span>
            )}
            {place.matchScore > 0 && (
              <span className="text-xs font-cinzel font-bold text-[#d4af37]">
                {place.matchScore}%
              </span>
            )}
          </div>
        </div>
        {reason && (
          <p className="font-cinzel text-white/75 text-xs md:text-sm mt-1 line-clamp-2">{reason}</p>
        )}
        {!reason && place.description && (
          <p className="font-cinzel text-white/65 text-xs md:text-sm mt-1 line-clamp-2">
            {place.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-cinzel text-white/60">
          {place.entryFees != null && (
            <span>{place.entryFees === 0 ? "Free entry" : `${place.entryFees} EGP entry`}</span>
          )}
          {place.vibe?.length > 0 && (
            <span>
              {orderPlaceVibesForDisplay(place.vibe, highlightVibes).join(" · ")}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
