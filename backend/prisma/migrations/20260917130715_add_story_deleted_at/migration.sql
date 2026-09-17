-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Story_deletedAt_idx" ON "Story"("deletedAt");
