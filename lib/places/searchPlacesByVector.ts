import { PlaceType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { embeddingToPgVectorSql } from "@/lib/places/placeEmbeddingDb";

export type VectorSimilarityRow = { placeId: string; distance: number };

export async function searchPlaceIdsBySimilarity(options: {
  embedding: number[];
  placeType: PlaceType;
  limit: number;
}): Promise<VectorSimilarityRow[]> {
  const vec = embeddingToPgVectorSql(options.embedding);
  return prisma.$queryRaw<VectorSimilarityRow[]>`
    SELECT pe.place_id AS "placeId",
           (pe.embedding <=> ${vec})::double precision AS distance
    FROM place_embeddings pe
    INNER JOIN places p ON p.id = pe.place_id
    WHERE p.type::text = ${String(options.placeType)}
    ORDER BY distance ASC
    LIMIT ${options.limit}
  `;
}
