-- Add idempotencyKey column to Story
ALTER TABLE "Story" ADD COLUMN "idempotencyKey" TEXT;

-- Create unique index for idempotency
CREATE UNIQUE INDEX "Story_authorId_idempotencyKey_unique" ON "Story" ("authorId", "idempotencyKey");
