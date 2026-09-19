-- Add isEmailSent column to Notification table for digest tracking
ALTER TABLE "Notification" ADD COLUMN "isEmailSent" BOOLEAN NOT NULL DEFAULT false;
