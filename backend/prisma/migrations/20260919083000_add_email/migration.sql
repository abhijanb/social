-- Add email column to User table (nullable, unique — allows NULL in Postgres)
ALTER TABLE "User" ADD COLUMN "email" TEXT;
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
