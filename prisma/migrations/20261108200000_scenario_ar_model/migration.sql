-- Additive only: one new table, no change to existing ones.
-- Rollback: DROP TABLE "content"."ScenarioArModel"; (see docs/architecture/data-ar-model.md)


-- CreateTable
CREATE TABLE "content"."ScenarioArModel" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "glbUrl" TEXT NOT NULL,
    "usdzUrl" TEXT NOT NULL,
    "posterUrl" TEXT,
    "heightMeters" DOUBLE PRECISION NOT NULL,
    "licence" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "hotspots" JSONB NOT NULL DEFAULT '[]',
    "createdById" TEXT NOT NULL,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioArModel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioArModel_scenarioId_version_key" ON "content"."ScenarioArModel"("scenarioId", "version");

-- AddForeignKey
ALTER TABLE "content"."ScenarioArModel" ADD CONSTRAINT "ScenarioArModel_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "content"."Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
