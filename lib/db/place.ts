import { prisma } from "@/lib/prisma";
import type { PlaceType, PlaceCategory, PlaceVibe } from "@prisma/client";

export type CreatePlaceInput = {
  type?: PlaceType;
  name: string;
  latitude: number;
  longitude: number;
  category?: PlaceCategory | null;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  openingHours?: string | null;
  entranceFee?: number | null;
  cameraFee?: number | null;
  vibe?: PlaceVibe | null;
  bestVisitTime?: string | null;
  images?: string[];
  kidsFriendly?: boolean | null;
  elderlyFriendly?: boolean | null;
  petsFriendly?: boolean | null;
};

export async function createPlace(data: CreatePlaceInput, createdById: string) {
  return prisma.place.create({
    data: {
      type: data.type ?? "place_to_visit",
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      category: data.category ?? null,
      description: data.description ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      openingHours: data.openingHours ?? null,
      entranceFee: data.entranceFee ?? null,
      cameraFee: data.cameraFee ?? null,
      vibe: data.vibe ?? null,
      bestVisitTime: data.bestVisitTime ?? null,
      images: data.images ?? [],
      kidsFriendly: data.kidsFriendly ?? null,
      elderlyFriendly: data.elderlyFriendly ?? null,
      petsFriendly: data.petsFriendly ?? null,
      createdBy: createdById,
    },
  });
}
