import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getAiPlannerConfig } from "@/lib/ai/config";

const PLACE_EMBEDDING_VECTOR_DIM = 768;

function embeddingDimensions(): number {
  const d = getAiPlannerConfig().embeddingDimensions;
  if (d !== PLACE_EMBEDDING_VECTOR_DIM) {
    throw new Error(
      `AI_PLANNER_EMBEDDING_DIMENSIONS must be ${PLACE_EMBEDDING_VECTOR_DIM} to match the place_embeddings column type`
    );
  }
  return d;
}

export function embeddingToPgVectorSql(embedding: number[]): Prisma.Sql {
  const dim = embeddingDimensions();
  if (embedding.length !== dim) {
    throw new Error(
      `Embedding length ${embedding.length} does not match AI_PLANNER_EMBEDDING_DIMENSIONS (${dim})`
    );
  }
  const elems = embedding.map((v) => {
    if (!Number.isFinite(v)) {
      throw new Error("Embedding values must be finite numbers");
    }
    return Prisma.sql`${v}::double precision`;
  });
  return Prisma.sql`CAST(ARRAY[${Prisma.join(elems, ", ")}] AS vector(768))`;
}

export async function upsertPlaceEmbedding(input: {
  placeId: string;
  embedding: number[];
  sourceText: string;
}): Promise<void> {
  const vec = embeddingToPgVectorSql(input.embedding);
  await prisma.$executeRaw`
    INSERT INTO place_embeddings (place_id, embedding, source_text, updated_at)
    VALUES (${input.placeId}, ${vec}, ${input.sourceText}, NOW())
    ON CONFLICT (place_id) DO UPDATE SET
      embedding = EXCLUDED.embedding,
      source_text = EXCLUDED.source_text,
      updated_at = EXCLUDED.updated_at
  `;
}

export async function hasPlaceEmbedding(placeId: string): Promise<boolean> {
  const n = await prisma.placeEmbedding.count({ where: { placeId } });
  return n > 0;
}
