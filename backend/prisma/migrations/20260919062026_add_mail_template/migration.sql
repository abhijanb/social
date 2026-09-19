-- CreateTable
CREATE TABLE "MailTemplate" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "subject" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "bodyHtml" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MailTemplate_key_key" ON "MailTemplate"("key");

-- CreateIndex
CREATE INDEX "MailTemplate_isActive_idx" ON "MailTemplate"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "MailTemplate_key_locale_key" ON "MailTemplate"("key", "locale");
