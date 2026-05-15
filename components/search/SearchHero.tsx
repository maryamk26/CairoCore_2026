"use client";

import { RefObject } from "react";
import type { SearchType } from "./types";

interface SearchHeroProps {
  searchType: SearchType;
  onSearchTypeChange: (type: SearchType) => void;
  searchQuery: string;
  onSearchQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInputFocus: () => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
}

export default function SearchHero({
  searchType,
  onSearchTypeChange,
  searchQuery,
  onSearchQueryChange,
  onInputFocus,
  searchInputRef,
}: SearchHeroProps) {
  return (
    <>
      <div className="text-center mb-8 px-4">
        <p className="font-cinzel text-white text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold leading-relaxed">
          Find Places & Connect with People
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative inline-flex bg-white/80 backdrop-blur-sm rounded-full p-1 border border-white/30 shadow-md">
          <div
            className="absolute top-1 bottom-1 rounded-full bg-[#5d4e37] transition-transform duration-300 ease-in-out"
            style={{
              left: "4px",
              width: "calc(50% - 8px)",
              transform: searchType === "places" ? "translateX(0)" : "translateX(100%)",
            }}
          />
          <button
            onClick={() => onSearchTypeChange("places")}
            className={`relative z-10 px-6 py-2 rounded-full font-cinzel text-sm md:text-base transition-colors duration-300 ${
              searchType === "places" ? "text-white" : "text-[#5d4e37] hover:text-[#8b6f47]"
            }`}
          >
            Places
          </button>
          <button
            onClick={() => onSearchTypeChange("people")}
            className={`relative z-10 px-6 py-2 rounded-full font-cinzel text-sm md:text-base transition-colors duration-300 ${
              searchType === "people" ? "text-white" : "text-[#5d4e37] hover:text-[#8b6f47]"
            }`}
          >
            People
          </button>
        </div>
      </div>

      <div className="relative bg-white/95 backdrop-blur-sm rounded-full shadow-xl border border-white/30 overflow-hidden">
        <div className="flex items-center px-6 py-4 md:py-5">
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={onSearchQueryChange}
            onFocus={onInputFocus}
            placeholder={searchType === "places" ? "Search places in Cairo..." : "Search people..."}
            className="flex-1 bg-transparent outline-none text-[#3a3428] placeholder:text-[#8b6f47]/60 font-cinzel text-base md:text-lg"
          />
          <span className="ml-4 p-2 text-[#5d4e37]" aria-hidden="true">
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
        </div>
      </div>
    </>
  );
}
