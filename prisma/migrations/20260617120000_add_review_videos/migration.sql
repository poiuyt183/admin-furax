-- CreateTable
CREATE TABLE "review_video" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "youtubeUrl" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "review_video_categoryId_idx" ON "review_video"("categoryId");

-- CreateIndex
CREATE INDEX "review_video_isActive_idx" ON "review_video"("isActive");

-- AddForeignKey
ALTER TABLE "review_video" ADD CONSTRAINT "review_video_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
