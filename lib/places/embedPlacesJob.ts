import { prisma } from "@/lib/prisma";
import { embedSingleText } from "@/lib/ai/lmStudioEmbeddings";
import { buildPlaceEmbeddingSource } from "@/lib/places/buildPlaceEmbeddingSource";
import { hasPlaceEmbedding, upsertPlaceEmbedding } from "@/lib/places/placeEmbeddingDb";

export type EmbedPlacesJobResult = {
  processed: number;
  updated: number;
  skipped: number;
  errors: { placeId: string; message: string }[];
};

export type EmbedPlacesJobOptions = {
  placeIds?: string[];
  limit?: number;
  skipExisting?: boolean;
};

export async function runEmbedPlacesJob(
  opts: EmbedPlacesJobOptions = {}
): Promise<EmbedPlacesJobResult> {
  const where = opts.placeIds && opts.placeIds.length > 0 ? { id: { in: opts.placeIds } } : {};

  const places = await prisma.place.findMany({
    where,
    take: opts.limit,
    orderBy: { name: "asc" },
  });

  const errors: EmbedPlacesJobResult["errors"] = [];
  let updated = 0;
  let skipped = 0;

  for (const place of places) {
    try {
      if (opts.skipExisting && (await hasPlaceEmbedding(place.id))) {
        skipped += 1;
        continue;
      }
      const sourceText = buildPlaceEmbeddingSource(place);
      const embedding = await embedSingleText(sourceText);
      await upsertPlaceEmbedding({ placeId: place.id, embedding, sourceText });
      updated += 1;
    } catch (e) {
      errors.push({
        placeId: place.id,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return {
    processed: places.length,
    updated,
    skipped,
    errors,
  };
}
