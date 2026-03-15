"use client";

import { RefObject } from "react";
import { getCategoryIcon } from "@/components/icons/categoryIcons";

export type Suggestion = {
  id: string;
  title: string;
  subtitle: string;
  type: "place" | "person";
  category?: string;
};

type SearchType = "places" | "people";

interface SearchSuggestionsProps {
  suggestionsRef: RefObject<HTMLDivElement | null>;
  show: boolean;
  loading: boolean;
  searchType: SearchType;
  searchQuery: string;
  suggestions: Suggestion[];
  onSuggestionClick: (s: Suggestion) => void;
  emptyMessage?: React.ReactNode;
}

export default function SearchSuggestions({
  suggestionsRef,
  show,
  loading,
  searchType,
  searchQuery,
  suggestions,
  onSuggestionClick,
  emptyMessage,
}: SearchSuggestionsProps) {
  if (!show) return null;

  const typeLabel = searchType === "places" ? "places" : "people";

  return (
    <div
      ref={suggestionsRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30 overflow-hidden z-20"
    >
      <div
        className="overflow-y-auto"
        style={{
          maxHeight: "264px",
          scrollbarWidth: "thin",
          scrollbarColor: "#8b6f47 #e8ddd4",
        }}
      >
        {loading && searchType === "places" ? (
          <div className="px-6 py-4 text-[#8b6f47] font-cinzel text-center">Loading...</div>
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestion) => {
            const PlaceIcon =
              suggestion.type === "place" ? getCategoryIcon(suggestion.category ?? "other") : null;
            return (
              <button
                key={suggestion.id}
                onClick={() => onSuggestionClick(suggestion)}
                className="w-full flex items-start gap-4 px-6 py-4 hover:bg-[#e8ddd4]/50 transition-colors text-left border-b border-[#d4c4b0]/30 last:border-b-0"
              >
                <div className="flex-shrink-0 mt-1">
                  {suggestion.type === "place" && PlaceIcon ? (
                    <PlaceIcon size={20} className="text-[#8b6f47]" />
                  ) : (
                    <svg
                      className="w-5 h-5 text-[#8b6f47]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-cinzel text-[#3a3428] font-medium text-base md:text-lg mb-1">
                    {suggestion.title}
                  </p>
                  <p className="font-cinzel text-[#8b6f47] text-sm md:text-base font-light">
                    {suggestion.subtitle}
                  </p>
                </div>
              </button>
            );
          })
        ) : (
          <div className="px-6 py-4 text-center">
            {emptyMessage ?? (
              <p className="font-cinzel text-[#8b6f47]">
                {searchQuery.trim()
                  ? `No ${typeLabel} found for "${searchQuery}"`
                  : searchType === "people"
                    ? "People search coming soon."
                    : "No places in database yet."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
