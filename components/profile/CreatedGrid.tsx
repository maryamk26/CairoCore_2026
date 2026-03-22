"use client";

import Link from "next/link";
import { formatRelativeMonth } from "./formatRelativeMonth";

export interface PlaceItem {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
  createdAt: string;
  images?: string[];
}

interface CreatedGridProps {
  places: PlaceItem[];
  isOwnProfile?: boolean;
  ownerLabel?: string;
}

export default function CreatedGrid({
  places,
  isOwnProfile = false,
  ownerLabel = "Your",
}: CreatedGridProps) {
  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#5d4e37]">
          {ownerLabel} places
        </h2>
        {isOwnProfile && (
          <Link
            href="/create/place"
            className="px-4 py-2 rounded-full bg-[#8b6f47] text-white text-sm font-medium hover:bg-[#5d4e37]"
          >
            Create place
          </Link>
        )}
      </div>

      {places.length === 0 ? (
        <div className="text-center py-16 text-[#5d4e37]/80">
          <p className="font-medium">No places yet</p>
          <p className="text-sm mt-1">
            {isOwnProfile
              ? "Places you create will appear here."
              : "This user has not created any places yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {places.map((place) => {
            const image = place.images?.[0];

            return (
              <Link
                key={place.id}
                href={`/places/${place.id}?from=profile`}
                className="group overflow-hidden rounded-2xl bg-gray-100 transition-colors hover:bg-gray-200"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-200">
                  {image ? (
                    <img
                      src={image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{ backgroundImage: "url(/images/backgrounds/home1.jpg)" }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
                </div>
                <div className="p-3">
                  <h3 className="truncate font-semibold text-[#5d4e37]">{place.name}</h3>
                  <p className="mt-0.5 text-xs text-[#5d4e37]/70">
                    {place.category ?? "Place"} · {formatRelativeMonth(place.createdAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
