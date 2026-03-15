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
  vibes?: string[];
  tags?: string[];
  bestVisitTime?: string | null;
  images?: string[];
  kidsFriendly?: boolean | null;
  elderlyFriendly?: boolean | null;
  petsFriendly?: boolean | null;
};

export type UpdatePlaceInput = Partial<
  Omit<CreatePlaceInput, "latitude" | "longitude"> & { latitude?: number; longitude?: number }
>;

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
      vibes: data.vibes ?? [],
      tags: data.tags ?? [],
      bestVisitTime: data.bestVisitTime ?? null,
      images: data.images ?? [],
      kidsFriendly: data.kidsFriendly ?? null,
      elderlyFriendly: data.elderlyFriendly ?? null,
      petsFriendly: data.petsFriendly ?? null,
      createdBy: createdById,
    },
  });
}

export async function updatePlace(
  placeId: string,
  data: UpdatePlaceInput,
  userId: string
) {
  const place = await prisma.place.findUnique({ where: { id: placeId } });
  if (!place || place.createdBy !== userId) return null;
  const updateData: Parameters<typeof prisma.place.update>[0]["data"] = {
    ...(data.name != null && data.name !== "" && { name: data.name }),
    ...(data.type != null && { type: data.type }),
    ...(data.description !== undefined && { description: data.description }),
    ...(data.category !== undefined && { category: data.category }),
    ...(data.address !== undefined && { address: data.address }),
    ...(data.city !== undefined && { city: data.city }),
    ...(data.openingHours !== undefined && { openingHours: data.openingHours }),
    ...(data.entranceFee !== undefined && { entranceFee: data.entranceFee }),
    ...(data.cameraFee !== undefined && { cameraFee: data.cameraFee }),
    ...(data.vibe != null && { vibe: data.vibe }),
    ...(data.vibes != null && { vibes: data.vibes }),
    ...(data.tags != null && { tags: data.tags }),
    ...(data.bestVisitTime !== undefined && { bestVisitTime: data.bestVisitTime }),
    ...(data.images != null && { images: data.images }),
    ...(data.kidsFriendly !== undefined && { kidsFriendly: data.kidsFriendly }),
    ...(data.elderlyFriendly !== undefined && { elderlyFriendly: data.elderlyFriendly }),
    ...(data.petsFriendly !== undefined && { petsFriendly: data.petsFriendly }),
    ...(data.latitude != null && { latitude: data.latitude }),
    ...(data.longitude != null && { longitude: data.longitude }),
  };

  if (Object.keys(updateData).length === 0) {
    return place;
  }

  return prisma.place.update({
    where: { id: placeId },
    data: updateData,
  });
}
