-- Add idempotencyKey column to LivestreamComment
ALTER TABLE "LivestreamComment" ADD COLUMN "idempotencyKey" TEXT;

-- Create unique index for idempotency
CREATE UNIQUE INDEX "LivestreamComment_streamId_authorId_idempotencyKey_key" ON "LivestreamComment" ("streamId", "authorId", "idempotencyKey");
