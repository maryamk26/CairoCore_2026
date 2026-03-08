"use client";

import { useState, use, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getCategoryIcon } from "@/components/icons/categoryIcons";

const PlaceMap = dynamic(() => import("@/components/places/PlaceMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center rounded-lg">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

type PlaceData = {
  id: string;
  title: string;
  description: string;
  images: string[];
  location: { address: string; lat: number; lng: number };
  workingHours: string | Record<string, { open: string; close: string }> | null;
  entryFees: number | null;
  cameraFees: number | null;
  vibe: string[];
  petsFriendly: boolean;
  kidsFriendly: boolean;
  bestTimeToVisit: { season?: string[]; timeOfDay?: string[] } | null;
  category: string;
};

export default function PlaceProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [place, setPlace] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/places/${id}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) setPlace(data);
        else if (!cancelled) setPlace(null);
      })
      .catch(() => {
        if (!cancelled) setPlace(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3a3428]">
        <p className="font-cinzel text-white">
          Loading...
        </p>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3a3428]">
        <div className="text-center">
          <h1
            className="font-cinzel text-4xl text-white mb-4"
          >
            Place Not Found
          </h1>
          <Link
            href="/"
            className="font-cinzel text-white/80 hover:text-white transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    if (place.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % place.images.length);
  };

  const prevImage = () => {
    if (place.images.length === 0) return;
    setCurrentImageIndex(
      (prev) => (prev - 1 + place.images.length) % place.images.length
    );
  };

  const workingHoursStr =
    typeof place.workingHours === "string"
      ? place.workingHours
      : null;
  const workingHoursObj =
    place.workingHours && typeof place.workingHours === "object"
      ? place.workingHours
      : null;

  const PlaceIcon = getCategoryIcon(place.category ?? "other");

  return (
    <div className="min-h-screen bg-[#3a3428]">
      <section className="relative h-[60vh] md:h-[70vh] overflow-hidden">
        {place.images.length > 0 ? (
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
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all"
                  aria-label="Previous image"
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
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
              <div className="flex items-center gap-3 mb-2">
                <PlaceIcon size={32} className="text-amber-300 shrink-0" />
                <h1
                  className="font-cinzel text-4xl md:text-6xl font-bold text-white"
                >
                  {place.title}
                </h1>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-[#5d4e37] flex items-end p-6 md:p-12">
            <div className="flex items-center gap-3">
              <PlaceIcon size={32} className="text-amber-300 shrink-0" />
              <h1
                className="font-cinzel text-4xl md:text-6xl font-bold text-white"
              >
                {place.title}
              </h1>
            </div>
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#5d4e37] rounded-lg p-6 md:p-8">
              <h2
                className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-4"
              >
                About
              </h2>
              <p
                className="font-cinzel text-white/90 leading-relaxed text-lg"
              >
                {place.description || "No description available."}
              </p>
            </div>

            <div className="bg-[#5d4e37] rounded-lg p-6 md:p-8">
              <h2
                className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-6"
              >
                Location
              </h2>
              <div className="mb-6 space-y-4">
                <div className="bg-[#8b6f47]/30 rounded-lg p-4">
                  <p
                    className="font-cinzel text-white font-semibold text-lg mb-2"
                  >
                    Address
                  </p>
                  <p
                    className="font-cinzel text-white/90 text-base leading-relaxed"
                  >
                    {place.location.address || "—"}
                  </p>
                </div>
                <div className="bg-[#8b6f47]/30 rounded-lg p-4">
                  <p
                    className="font-cinzel text-white/70 text-sm font-mono"
                  >
                    {place.location.lat.toFixed(6)}°, {place.location.lng.toFixed(6)}°
                  </p>
                </div>
              </div>
              <PlaceMap
                lat={place.location.lat}
                lng={place.location.lng}
                title={place.title}
                address={place.location.address}
                height="400px"
                zoom={15}
              />
            </div>

            {place.vibe.length > 0 && (
              <div className="bg-[#5d4e37] rounded-lg p-6 md:p-8">
                <h2
                  className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-4"
                >
                  Vibe
                </h2>
                <div className="flex flex-wrap gap-3">
                  {place.vibe.map((tag) => (
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
              <h2
                className="font-cinzel text-2xl md:text-3xl font-bold text-white mb-6"
              >
                Reviews & Memories
              </h2>
              <p className="font-cinzel text-white/70 text-center py-8">
                No reviews yet.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#5d4e37] rounded-lg p-6 sticky top-4">
              <h3
                className="font-cinzel text-xl font-bold text-white mb-6"
              >
                Quick Info
              </h3>
              <div className="space-y-4">
                <div>
                  <p
                    className="font-cinzel text-white/70 text-sm mb-2"
                  >
                    Location
                  </p>
                  <p
                    className="font-cinzel text-white text-sm leading-relaxed"
                  >
                    {place.location.address || "—"}
                  </p>
                  <p
                    className="font-cinzel text-white/60 text-xs font-mono mt-2"
                  >
                    {place.location.lat.toFixed(4)}°, {place.location.lng.toFixed(4)}°
                  </p>
                </div>
                {place.entryFees != null && (
                  <div>
                    <p
                      className="font-cinzel text-white/70 text-sm mb-1"
                    >
                      Entry
                    </p>
                    <p className="font-cinzel text-white">
                      {place.entryFees} EGP
                    </p>
                  </div>
                )}
                {place.cameraFees != null && (
                  <div>
                    <p
                      className="font-cinzel text-white/70 text-sm mb-1"
                    >
                      Camera
                    </p>
                    <p className="font-cinzel text-white">
                      {place.cameraFees} EGP
                    </p>
                  </div>
                )}
                <div className="flex gap-4">
                  <div>
                    <p className="font-cinzel text-white/70 text-sm mb-1">Pets</p>
                    <p className="font-cinzel text-white/90">
                      {place.petsFriendly ? "Allowed" : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="font-cinzel text-white/70 text-sm mb-1">Kids</p>
                    <p className="font-cinzel text-white/90">
                      {place.kidsFriendly ? "Friendly" : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {(workingHoursStr || workingHoursObj) && (
              <div className="bg-[#5d4e37] rounded-lg p-6">
                <h3
                  className="font-cinzel text-xl font-bold text-white mb-4"
                >
                  Opening hours
                </h3>
                {workingHoursStr ? (
                  <p className="font-cinzel text-white/90">
                    {workingHoursStr}
                  </p>
                ) : workingHoursObj ? (
                  <div className="space-y-2">
                    {Object.entries(workingHoursObj).map(([day, hours]) => (
                      <div key={day} className="flex justify-between">
                        <span className="font-cinzel text-white/70 capitalize">
                          {day}
                        </span>
                        <span className="font-cinzel text-white">
                          {hours.open} – {hours.close}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {place.bestTimeToVisit?.timeOfDay?.length ? (
              <div className="bg-[#5d4e37] rounded-lg p-6">
                <h3
                  className="font-cinzel text-xl font-bold text-white mb-4"
                >
                  Best time to visit
                </h3>
                <p className="font-cinzel text-white/90">
                  {place.bestTimeToVisit.timeOfDay.join(", ")}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
