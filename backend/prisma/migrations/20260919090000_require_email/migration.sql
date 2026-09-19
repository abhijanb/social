-- Backfill NULL emails using username as local-part, then enforce NOT NULL
UPDATE "User" SET email = username || '@social.test' WHERE email IS NULL;
ALTER TABLE "User" ALTER COLUMN email SET NOT NULL;
