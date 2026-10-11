-- CreateTable
CREATE TABLE "content"."DialogueCall" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceKey" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "turns" JSONB NOT NULL,
    "turnCount" INTEGER NOT NULL,
    "draftScenarioId" TEXT,
    "draftNotes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DialogueCall_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DialogueCall_protocol_idx" ON "content"."DialogueCall"("protocol");

-- CreateIndex
CREATE UNIQUE INDEX "DialogueCall_source_sourceKey_key" ON "content"."DialogueCall"("source", "sourceKey");
