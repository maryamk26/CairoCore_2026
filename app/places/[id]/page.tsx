"use client";

import { useState, use, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PlaceDetailHero from "@/components/places/PlaceDetailHero";
import PlaceDetailContent from "@/components/places/PlaceDetailContent";
import PlaceDetailSidebar from "@/components/places/PlaceDetailSidebar";
import PlaceDeleteConfirmModal from "@/components/places/PlaceDeleteConfirmModal";
import { useAuth } from "@/lib/hooks/useAuth";

type PlaceData = {
  id: string;
  title: string;
  description: string;
  images: string[];
  location: { address: string; lat: number; lng: number };
  workingHours: string | Record<string, { open: string; close: string } | "closed"> | null;
  entryFees: number | null;
  cameraFees: number | null;
  vibe: string[];
  createdBy: string | null;
  petsFriendly: boolean;
  kidsFriendly: boolean;
  bestTimeToVisit: { timeOfDay?: string[] } | null;
  category: string;
};

export default function PlaceProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [place, setPlace] = useState<PlaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCreator = !!user && !!place?.createdBy && place.createdBy === user.id;

  const backHref = useMemo(() => {
    const from = searchParams.get("from");
    const boardId = searchParams.get("boardId");
    const boardName = searchParams.get("boardName");
    const searchQ = searchParams.get("q");

    if (from === "board" && boardId) {
      return boardName
        ? `/profile/boards/${boardId}?name=${encodeURIComponent(boardName)}`
        : `/profile/boards/${boardId}`;
    }
    if (from === "profile" || from === "created") return "/profile";
    if (from === "search") {
      return searchQ?.trim()
        ? `/search?q=${encodeURIComponent(searchQ.trim())}`
        : "/search";
    }
    return "/";
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/places/${id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setPlace(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setPlace(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  const handleDelete = async () => {
    if (!place || !user) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/places/${place.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete place");
      }
      setShowDeleteConfirm(false);
      window.location.href = "/profile";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete place");
    } finally {
      setDeleting(false);
    }
  };

  const nextImage = () => {
    if (!place || place.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % place.images.length);
  };

  const prevImage = () => {
    if (!place || place.images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + place.images.length) % place.images.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3a3428]">
        <p className="font-cinzel text-white">Loading...</p>
      </div>
    );
  }

  if (!place) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#3a3428]">
        <div className="text-center">
          <h1 className="font-cinzel text-4xl text-white mb-4">Place Not Found</h1>
          <Link href="/" className="font-cinzel text-white/80 hover:text-white transition-colors">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const workingHoursStr = typeof place.workingHours === "string" ? place.workingHours : null;
  const workingHoursObj =
    place.workingHours && typeof place.workingHours === "object" ? place.workingHours : null;

  return (
    <div className="min-h-screen bg-[#3a3428]">
      <PlaceDetailHero
        place={{ id: place.id, title: place.title, images: place.images, category: place.category }}
        currentImageIndex={currentImageIndex}
        onPrevImage={prevImage}
        onNextImage={nextImage}
        backHref={backHref}
        isCreator={isCreator}
        onDeleteClick={() => setShowDeleteConfirm(true)}
      />

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <PlaceDetailContent
            placeId={place.id}
            description={place.description}
            location={place.location}
            vibe={place.vibe}
          />
          <PlaceDetailSidebar
            location={place.location}
            entryFees={place.entryFees}
            cameraFees={place.cameraFees}
            petsFriendly={place.petsFriendly}
            kidsFriendly={place.kidsFriendly}
            workingHoursStr={workingHoursStr}
            workingHoursObj={workingHoursObj}
            bestTimeToVisit={place.bestTimeToVisit?.timeOfDay ?? null}
          />
        </div>

      </section>

      {showDeleteConfirm && (
        <PlaceDeleteConfirmModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
