-- CreateEnum
CREATE TYPE "LivestreamStatus" AS ENUM ('LIVE', 'ENDED');

-- CreateTable
CREATE TABLE "Livestream" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "LivestreamStatus" NOT NULL DEFAULT 'LIVE',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Livestream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LivestreamComment" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LivestreamComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Livestream_status_startedAt_idx" ON "Livestream"("status", "startedAt");

-- CreateIndex
CREATE INDEX "Livestream_hostId_status_idx" ON "Livestream"("hostId", "status");

-- CreateIndex
CREATE INDEX "LivestreamComment_streamId_createdAt_idx" ON "LivestreamComment"("streamId", "createdAt");

-- CreateIndex
CREATE INDEX "LivestreamComment_streamId_id_idx" ON "LivestreamComment"("streamId", "id");

-- AddForeignKey
ALTER TABLE "Livestream" ADD CONSTRAINT "Livestream_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivestreamComment" ADD CONSTRAINT "LivestreamComment_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Livestream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LivestreamComment" ADD CONSTRAINT "LivestreamComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
