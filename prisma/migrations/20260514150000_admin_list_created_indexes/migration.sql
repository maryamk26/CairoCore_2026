-- Speed up admin moderation lists (range + ORDER BY createdAt DESC)
CREATE INDEX IF NOT EXISTS "places_createdAt_idx" ON "places"("createdAt");

CREATE INDEX IF NOT EXISTS "users_createdAt_idx" ON "users"("createdAt");

CREATE INDEX IF NOT EXISTS "place_feedback_createdAt_idx" ON "place_feedback"("createdAt");
