import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache/tags";
import type { Suggestion } from "@/components/search/types";

type PlaceSuggestionRecord = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  address: string | null;
};

function toSuggestion(place: PlaceSuggestionRecord): Suggestion {
  return {
    id: place.id,
    title: place.name,
    subtitle: place.description?.slice(0, 80) ?? place.address ?? place.category ?? "",
    type: "place",
    category: place.category ?? "other",
  };
}

const getAllPlaceSuggestionsCached = unstable_cache(
  async () => {
    const places = await prisma.place.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        address: true,
      },
      orderBy: { name: "asc" },
    });
    return places.map(toSuggestion);
  },
  ["places-search-all"],
  {
    revalidate: 300,
    tags: [CACHE_TAGS.placesList],
  }
);

export async function getPlaceSuggestions(q?: string | null): Promise<Suggestion[]> {
  const query = q?.trim();
  if (!query) return getAllPlaceSuggestionsCached();

  const places = await prisma.place.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      address: true,
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return places.map(toSuggestion);
}
