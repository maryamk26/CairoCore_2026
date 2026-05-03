import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS, placeTag } from "@/lib/cache/tags";

export type PlaceDetailData = {
  id: string;
  type: string;
  title: string;
  description: string;
  images: string[];
  location: { address: string; lat: number; lng: number };
  city: string | null;
  workingHours:
    | string
    | Record<string, { open: string; close: string } | "closed">
    | null;
  entryFees: number | null;
  cameraFees: number | null;
  vibe: string[];
  tags: string[];
  createdBy: string | null;
  petsFriendly: boolean;
  kidsFriendly: boolean;
  elderlyFriendly: boolean | null;
  bestTimeToVisit: { timeOfDay: string[] } | null;
  category: string;
};

export async function getPlaceDetailById(
  id: string
): Promise<PlaceDetailData | null> {
  const getCached = unstable_cache(
    async () => {
      const place = await prisma.place.findUnique({ where: { id } });
      if (!place) return null;

      const vibeArr = place.vibes?.length
        ? place.vibes
        : place.vibe
          ? [place.vibe]
          : [];
      let workingHours: PlaceDetailData["workingHours"] =
        place.openingHours ?? null;

      if (
        typeof place.openingHours === "string" &&
        place.openingHours.trim().startsWith("{")
      ) {
        try {
          workingHours = JSON.parse(place.openingHours) as Record<
            string,
            { open: string; close: string } | "closed"
          >;
        } catch {
          workingHours = place.openingHours;
        }
      }

      return {
        id: place.id,
        type: place.type,
        title: place.name,
        description: place.description ?? "",
        images: place.images ?? [],
        location: {
          address: place.address ?? "",
          lat: place.latitude,
          lng: place.longitude,
        },
        city: place.city ?? null,
        workingHours,
        entryFees: place.entranceFee,
        cameraFees: place.cameraFee,
        vibe: vibeArr,
        tags: place.tags ?? [],
        createdBy: place.createdBy ?? null,
        petsFriendly: place.petsFriendly ?? false,
        kidsFriendly: place.kidsFriendly ?? true,
        elderlyFriendly: place.elderlyFriendly ?? null,
        bestTimeToVisit: place.bestVisitTime
          ? { timeOfDay: [place.bestVisitTime] }
          : null,
        category: place.category ?? "other",
      } satisfies PlaceDetailData;
    },
    ["place-detail", id],
    {
      revalidate: 300,
      tags: [CACHE_TAGS.placesList, placeTag(id)],
    }
  );

  return getCached();
}
