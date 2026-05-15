"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRelativeDate } from "@/components/profile/formatRelativeDate";
import { getCategoryIcon } from "@/components/icons/categoryIcons";

type RouteMeta = {
  id: string;
  name: string;
  createdAt: string;
  transportMode: string | null;
  stopCount: number;
};

type RoutePlace = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  address: string | null;
  category: string | null;
  position: number;
};

export default function SavedRoutePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [route, setRoute] = useState<RouteMeta | null>(null);
  const [places, setPlaces] = useState<RoutePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetch(`/api/profile/routes/${id}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (!res.ok || !data.route) {
          setError(data.error || "Failed to load route");
          setRoute(null);
          setPlaces([]);
          return;
        }

        setError(null);
        setRoute(data.route);
        setPlaces(Array.isArray(data.places) ? data.places : []);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Failed to load route");
          setRoute(null);
          setPlaces([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="animate-pulse text-[#5d4e37]/70">Loading route...</div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fafafa] px-4">
        <p className="text-center text-[#5d4e37]">{error || "Route not found."}</p>
        <Link
          href="/profile"
          className="rounded-full bg-[#8b6f47] px-4 py-2 text-sm font-medium text-white hover:bg-[#5d4e37]"
        >
          Back to profile
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <div className="mx-auto max-w-5xl px-4 pt-28 pb-12">
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1 text-[#5d4e37] hover:text-[#8b6f47]"
          >
            <span className="text-xl">←</span>
            <span className="font-cinzel text-sm">Back</span>
          </Link>
        </div>

        <div className="mb-8 rounded-3xl border border-[#e6ddd2] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm text-[#8b6f47]">Saved {formatRelativeDate(route.createdAt)}</p>
              <h1 className="mt-2 font-cinzel text-3xl font-bold text-[#2f2b25]">{route.name}</h1>
              <p className="mt-2 text-sm text-[#5d4e37]/80">
                {route.stopCount} stop{route.stopCount === 1 ? "" : "s"}
                {route.transportMode ? ` · ${route.transportMode}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/planner?savedRouteId=${route.id}`)}
              className="rounded-full bg-[#8b6f47] px-5 py-3 text-sm font-medium text-white hover:bg-[#5d4e37]"
            >
              Open in planner
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {places.map((place, index) => {
            const PlaceIcon = getCategoryIcon(place.category ?? "other");
            return (
              <div
                key={`${place.id}-${index}`}
                className="flex items-start gap-4 rounded-3xl border border-[#e6ddd2] bg-white p-5 shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8b6f47] font-semibold text-white">
                  {index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <PlaceIcon size={18} className="text-[#8b6f47]" />
                    <h2 className="font-cinzel text-xl font-semibold text-[#2f2b25]">
                      {place.name}
                    </h2>
                  </div>
                  <p className="mt-2 text-sm text-[#5d4e37]/75">
                    {place.description?.trim() ||
                      place.address?.trim() ||
                      place.category ||
                      "Saved stop"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
