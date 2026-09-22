-- Add idempotencyKey column to Post table
ALTER TABLE "Post" ADD COLUMN "idempotencyKey" TEXT;

-- Create unique constraint on (authorId, idempotencyKey)
CREATE UNIQUE INDEX "Post_authorId_idempotencyKey_unique" ON "Post"("authorId", "idempotencyKey");
