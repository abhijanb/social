-- Add idempotencyKey column to PostLike
ALTER TABLE "PostLike" ADD COLUMN "idempotencyKey" TEXT;

-- Create unique index for idempotency
CREATE UNIQUE INDEX "PostLike_postId_userId_idempotencyKey_key" ON "PostLike" ("postId", "userId", "idempotencyKey");
