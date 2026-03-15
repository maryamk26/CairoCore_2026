"use client";

import { RefObject } from "react";

const TAGS = ["Pyramids", "Museums", "Mosques", "Markets", "Cafes"];

interface PopularSearchesProps {
  visible: boolean;
  onTagClick: (tag: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export default function PopularSearches({ visible, onTagClick, inputRef }: PopularSearchesProps) {
  return (
    <div
      className={`mt-8 text-center transition-opacity duration-300 ${
        visible ? "opacity-0 invisible pointer-events-none" : "opacity-100 visible pointer-events-auto"
      }`}
    >
      <p className="font-cinzel text-white text-base md:text-lg lg:text-xl mb-4 font-semibold">
        Popular searches:
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => {
              onTagClick(tag);
              inputRef.current?.focus();
            }}
            className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-[#5d4e37] font-cinzel text-sm hover:bg-white hover:shadow-md transition-all border border-white/30"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
