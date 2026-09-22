-- Add idempotencyKey column to PostComment
ALTER TABLE "PostComment" ADD COLUMN "idempotencyKey" TEXT;

-- Create unique index for idempotency
CREATE UNIQUE INDEX "PostComment_postId_authorId_idempotencyKey_key" ON "PostComment" ("postId", "authorId", "idempotencyKey");