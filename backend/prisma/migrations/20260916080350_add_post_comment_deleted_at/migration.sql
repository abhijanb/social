-- AlterTable
ALTER TABLE "PostComment" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PostComment_postId_deletedAt_createdAt_idx" ON "PostComment"("postId", "deletedAt", "createdAt");
