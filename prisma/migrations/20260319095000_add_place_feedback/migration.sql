-- CreateTable
CREATE TABLE "place_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "placeId" TEXT NOT NULL,
    "rating" INTEGER,
    "content" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "place_feedback_userId_placeId_key" ON "place_feedback"("userId", "placeId");

-- CreateIndex
CREATE INDEX "place_feedback_placeId_createdAt_idx" ON "place_feedback"("placeId", "createdAt");

-- CreateIndex
CREATE INDEX "place_feedback_userId_createdAt_idx" ON "place_feedback"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "place_feedback" ADD CONSTRAINT "place_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "place_feedback" ADD CONSTRAINT "place_feedback_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
