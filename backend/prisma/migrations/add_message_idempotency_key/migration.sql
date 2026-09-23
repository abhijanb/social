-- Add idempotencyKey column to Message
ALTER TABLE "Message" ADD COLUMN "idempotencyKey" TEXT;

-- Create unique index for idempotency
CREATE UNIQUE INDEX "Message_senderId_receiverId_idempotencyKey_key" ON "Message" ("senderId", "receiverId", "idempotencyKey");
