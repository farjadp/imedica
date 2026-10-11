-- CreateTable
CREATE TABLE "content"."BankQuestion" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "origin" TEXT,
    "levels" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "stem" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BankQuestion_source_idx" ON "content"."BankQuestion"("source");

-- CreateIndex
CREATE UNIQUE INDEX "BankQuestion_source_sourceKey_key" ON "content"."BankQuestion"("source", "sourceKey");
