"use client";

import Link from "next/link";

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
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const months = Math.floor((now.getTime() - d.getTime()) / (30 * 24 * 60 * 60 * 1000));
  if (months < 1) return "Just now";
  if (months === 1) return "1mo";
  return `${months}mo`;
}

export default function CreatedGrid({ places }: CreatedGridProps) {
  return (
    <div className="pt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[#5d4e37]">
          Your places
        </h2>
        <Link
          href="/create/place"
          className="px-4 py-2 rounded-full bg-[#8b6f47] text-white text-sm font-medium hover:bg-[#5d4e37]"
        >
          Create place
        </Link>
      </div>

      {places.length === 0 ? (
        <div className="text-center py-16 text-[#5d4e37]/80">
          <p className="font-medium">No places yet</p>
          <p className="text-sm mt-1">Places you create will appear here.</p>
        </div>
      ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {places.map((place) => {
        const image = place.images?.[0];
        return (
        <Link
          key={place.id}
          href={`/places/${place.id}?from=profile`}
          className="group rounded-2xl overflow-hidden bg-gray-100 hover:bg-gray-200 transition-colors"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60" />
          </div>
          <div className="p-3">
            <h3 className="font-semibold text-[#5d4e37] truncate">
              {place.name}
            </h3>
            <p className="text-xs text-[#5d4e37]/70 mt-0.5">
              {place.category ?? "Place"} · {formatDate(place.createdAt)}
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
