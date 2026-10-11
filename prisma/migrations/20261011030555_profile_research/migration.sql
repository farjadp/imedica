-- AlterTable
ALTER TABLE "identity"."User" ADD COLUMN     "avatarUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "notifyAssessments" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferredName" TEXT,
ADD COLUMN     "pronouns" TEXT,
ADD COLUMN     "station" TEXT;

-- CreateTable
CREATE TABLE "identity"."UserAvatar" (
    "userId" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "size" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAvatar_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "identity"."SavedPaper" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "extId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "journal" TEXT,
    "year" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."PaperBrief" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "extId" TEXT NOT NULL,
    "basedOn" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaperBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedPaper_userId_createdAt_idx" ON "identity"."SavedPaper"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SavedPaper_userId_source_extId_key" ON "identity"."SavedPaper"("userId", "source", "extId");

-- CreateIndex
CREATE UNIQUE INDEX "PaperBrief_source_extId_key" ON "content"."PaperBrief"("source", "extId");

-- AddForeignKey
ALTER TABLE "identity"."UserAvatar" ADD CONSTRAINT "UserAvatar_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."SavedPaper" ADD CONSTRAINT "SavedPaper_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
