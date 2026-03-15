"use client";

import Link from "next/link";

export type BoardPlace = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  images: string[];
};

interface BoardPlaceGridProps {
  places: BoardPlace[];
  boardId: string;
  boardName: string;
  selectMode: boolean;
  selectedIds: Set<string>;
  removingIds: Set<string>;
  onToggleSelect: (placeId: string) => void;
}

function placeImage(images: string[] | null | undefined): string | null {
  const raw = images?.[0];
  if (!raw) return null;
  return raw.includes("w=") ? raw.replace(/w=\d+/, "w=400") : raw;
}

export default function BoardPlaceGrid({
  places,
  boardId,
  boardName,
  selectMode,
  selectedIds,
  removingIds,
  onToggleSelect,
}: BoardPlaceGridProps) {
  if (places.length === 0) {
    return <p className="text-[#5d4e37]/80">No places saved to this board yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {places.map((place) => {
        const image = placeImage(place.images);
        const placeHref = `/places/${place.id}?from=board&boardId=${boardId}&boardName=${encodeURIComponent(boardName)}`;
        const isSelected = selectedIds.has(place.id);
        const isRemoving = removingIds.has(place.id);

        if (selectMode) {
          return (
            <button
              key={place.id}
              type="button"
              onClick={() => onToggleSelect(place.id)}
              disabled={isRemoving}
              className={`group rounded-2xl overflow-hidden bg-gray-100 border-2 transition-colors text-left ${
                isSelected ? "border-[#8b6f47] ring-2 ring-[#8b6f47]/50" : "border-gray-200 hover:border-gray-300"
              } ${isRemoving ? "opacity-50" : ""}`}
            >
              <div className="aspect-[3/4] relative bg-gray-200 overflow-hidden">
                {image ? (
                  <img
                    src={image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: "url(/images/backgrounds/home1.jpg)" }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute top-2 right-2">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                      isSelected ? "bg-[#8b6f47] border-white" : "bg-white/80 border-gray-300"
                    }`}
                  >
                    {isSelected && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-cinzel text-white text-sm md:text-base font-semibold line-clamp-2">
                    {place.name}
                  </h3>
                </div>
              </div>
            </button>
          );
        }

        return (
          <Link
            key={place.id}
            href={placeHref}
            className="group rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="aspect-[3/4] relative bg-gray-200 overflow-hidden">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                  style={{ backgroundImage: "url(/images/backgrounds/home1.jpg)" }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <h3 className="font-cinzel text-white text-sm md:text-base font-semibold line-clamp-2">
                  {place.name}
                </h3>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
