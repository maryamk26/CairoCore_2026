-- Requires pgvector: CREATE EXTENSION IF NOT EXISTS vector; (see docs/planner-ai-upgrade-technical-phases.md Phase 0)
-- Embedding width 768 matches EmbeddingGemma in LM Studio / AI_PLANNER_EMBEDDING_DIMENSIONS.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "place_embeddings" (
    "place_id" TEXT NOT NULL,
    "embedding" vector(768) NOT NULL,
    "source_text" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "place_embeddings_pkey" PRIMARY KEY ("place_id")
);

-- Declared separately so Prisma can match FK name to schema.prisma
ALTER TABLE "place_embeddings" ADD CONSTRAINT "place_embeddings_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "place_embeddings_embedding_hnsw_idx" ON "place_embeddings" USING hnsw ("embedding" vector_cosine_ops);
