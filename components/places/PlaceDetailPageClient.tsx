"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PlaceDetailHero from "@/components/places/PlaceDetailHero";
import PlaceDetailContent from "@/components/places/PlaceDetailContent";
import PlaceDetailSidebar from "@/components/places/PlaceDetailSidebar";
import PlaceDeleteConfirmModal from "@/components/places/PlaceDeleteConfirmModal";
import { useAuth } from "@/lib/hooks/useAuth";
import type { PlaceDetailData } from "@/lib/places/detail";

type Props = {
  place: PlaceDetailData;
};

export default function PlaceDetailPageClient({ place }: Props) {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCreator = !!user && !!place.createdBy && place.createdBy === user.id;

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
    typeof place.workingHours === "string" ? place.workingHours : null;
  const workingHoursObj =
    place.workingHours && typeof place.workingHours === "object"
      ? place.workingHours
      : null;

  return (
    <div className="min-h-screen bg-[#3a3428]">
      <PlaceDetailHero
        place={{
          id: place.id,
          title: place.title,
          images: place.images,
          category: place.category,
        }}
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
