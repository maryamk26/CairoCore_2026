"use client";

import Link from "next/link";
import { getCategoryIcon } from "@/components/icons/categoryIcons";
import SaveToBoard from "./SaveToBoard";

export type PlaceDetailHeroPlace = {
  id: string;
  title: string;
  images: string[];
  category: string;
};

interface PlaceDetailHeroProps {
  place: PlaceDetailHeroPlace;
  currentImageIndex: number;
  onPrevImage: () => void;
  onNextImage: () => void;
  backHref: string;
  isCreator: boolean;
  onDeleteClick: () => void;
}

export default function PlaceDetailHero({
  place,
  currentImageIndex,
  onPrevImage,
  onNextImage,
  backHref,
  isCreator,
  onDeleteClick,
}: PlaceDetailHeroProps) {
  const PlaceIcon = getCategoryIcon(place.category ?? "other");
  const hasImages = place.images.length > 0;

  return (
    <section className="relative h-[60vh] md:h-[70vh] overflow-visible">
      {hasImages ? (
        <>
          <img
            src={place.images[currentImageIndex]}
            alt={place.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60" />
          {place.images.length > 1 && (
            <>
              <button
                onClick={onPrevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={onNextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all"
                aria-label="Next image"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 mb-2">
                <PlaceIcon size={32} className="text-amber-300 shrink-0" />
                <h1 className="font-cinzel text-4xl md:text-6xl font-bold text-white">{place.title}</h1>
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <Link
                  href={backHref}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#8b6f47] text-white text-sm md:text-base font-cinzel shadow-lg hover:bg-[#a68454] transition-colors"
                >
                  Back
                </Link>
                {isCreator ? (
                  <>
                    <Link
                      href={`/places/${place.id}/edit`}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#8b6f47] text-white text-sm md:text-base font-cinzel shadow-lg hover:bg-[#a68454] transition-colors"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={onDeleteClick}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-red-600/90 text-white text-sm md:text-base font-cinzel shadow-lg hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <SaveToBoard placeId={place.id} />
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="w-full h-full bg-[#5d4e37] flex flex-col items-end justify-end p-6 md:p-12 gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={backHref}
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#8b6f47] text-white text-sm md:text-base font-cinzel shadow-lg hover:bg-[#a68454] transition-colors"
            >
              Back
            </Link>
            {isCreator ? (
              <>
                <Link
                  href={`/places/${place.id}/edit`}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#8b6f47] text-white text-sm md:text-base font-cinzel shadow-lg hover:bg-[#a68454] transition-colors"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={onDeleteClick}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-red-600/90 text-white text-sm md:text-base font-cinzel shadow-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </>
            ) : (
              <SaveToBoard placeId={place.id} />
            )}
          </div>
          <div className="flex items-center gap-3">
            <PlaceIcon size={32} className="text-amber-300 shrink-0" />
            <h1 className="font-cinzel text-4xl md:text-6xl font-bold text-white">{place.title}</h1>
          </div>
        </div>
      )}
    </section>
  );
}
