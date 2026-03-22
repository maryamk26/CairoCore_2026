"use client";

import dynamic from "next/dynamic";
import PlaceFeedbackSection from "@/components/places/PlaceFeedbackSection";

const PlaceMap = dynamic(() => import("@/components/places/PlaceMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center rounded-lg">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

interface PlaceDetailContentProps {
  placeId: string;
  description: string;
  location: { address: string; lat: number; lng: number };
  vibe: string[];
}

export default function PlaceDetailContent({
  placeId,
  description,
  location,
  vibe,
}: PlaceDetailContentProps) {
  return (
    <div className="lg:col-span-2 space-y-8">
      <div className="bg-[#5d4e37] rounded-lg p-6 md:p-8">
        <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-4">About</h2>
        <p className="font-cinzel text-white/90 leading-relaxed text-lg">
          {description || "No description available."}
        </p>
      </div>

      <div className="bg-[#5d4e37] rounded-lg p-6 md:p-8">
        <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-6">Location</h2>
        <div className="mb-6 space-y-4">
          <div className="bg-[#8b6f47]/30 rounded-lg p-4">
            <p className="font-cinzel text-white font-semibold text-lg mb-2">Address</p>
            <p className="font-cinzel text-white/90 text-base leading-relaxed">{location.address || "—"}</p>
          </div>
          <div className="bg-[#8b6f47]/30 rounded-lg p-4">
            <p className="font-cinzel text-white/70 text-sm font-mono">
              {location.lat.toFixed(6)}°, {location.lng.toFixed(6)}°
            </p>
          </div>
        </div>
        <PlaceMap
          lat={location.lat}
          lng={location.lng}
          title=""
          address={location.address}
          height="400px"
          zoom={15}
        />
      </div>

      {vibe.length > 0 && (
        <div className="bg-[#5d4e37] rounded-lg p-6 md:p-8">
          <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-4">Vibe</h2>
          <div className="flex flex-wrap gap-3">
            {vibe.map((tag) => (
              <span
                key={tag}
                className="px-4 py-2 bg-[#8b6f47] text-white rounded-full font-cinzel text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-[#5d4e37] rounded-lg p-6 md:p-8">
        <h2 className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-6">Reviews & Memories</h2>
        <PlaceFeedbackSection placeId={placeId} />
      </div>
    </div>
  );
}
