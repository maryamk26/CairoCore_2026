"use client";

import Link from "next/link";

interface BoardHeaderProps {
  name: string;
  pinCount: number;
  hasPlaces: boolean;
  selectMode: boolean;
  onToggleSelectMode: () => void;
  onDeleteBoardClick: () => void;
}

export default function BoardHeader({
  name,
  pinCount,
  hasPlaces,
  selectMode,
  onToggleSelectMode,
  onDeleteBoardClick,
}: BoardHeaderProps) {
  return (
    <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="font-cinzel text-3xl md:text-5xl font-bold text-[#5d4e37] mb-2">{name}</h1>
        <p className="text-sm text-[#5d4e37]/80">
          {pinCount} {pinCount === 1 ? "Place" : "Places"}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {hasPlaces && (
          <button
            type="button"
            onClick={onToggleSelectMode}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              selectMode ? "bg-[#5d4e37] text-white" : "bg-[#8b6f47] text-white hover:bg-[#5d4e37]"
            }`}
          >
            {selectMode ? "Cancel" : "Select"}
          </button>
        )}
        <button
          type="button"
          onClick={onDeleteBoardClick}
          className="px-4 py-2 rounded-full bg-red-600/90 text-white text-sm font-medium hover:bg-red-700"
        >
          Delete board
        </button>
        <Link
          href="/profile"
          className="px-4 py-2 rounded-full bg-[#8b6f47] text-white text-sm font-medium hover:bg-[#5d4e37]"
        >
          Back
        </Link>
      </div>
    </header>
  );
}
