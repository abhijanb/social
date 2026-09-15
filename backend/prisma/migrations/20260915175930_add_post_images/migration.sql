-- CreateTable
CREATE TABLE "PostImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);

-- Migrate existing single-image posts into PostImage (order 0)
INSERT INTO "PostImage" ("id", "postId", "url", "order", "createdAt")
SELECT gen_random_uuid()::text, "id", "imageUrl", 0, NOW()
FROM "Post"
WHERE "imageUrl" IS NOT NULL;

-- AlterTable
ALTER TABLE "Post" DROP COLUMN "imageUrl";

-- CreateIndex
CREATE INDEX "PostImage_postId_order_idx" ON "PostImage"("postId", "order");

-- AddForeignKey
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
