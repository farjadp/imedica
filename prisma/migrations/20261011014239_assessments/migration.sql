-- CreateEnum
CREATE TYPE "content"."AssessmentPhase" AS ENUM ('PRE', 'POST');

-- AlterTable
ALTER TABLE "content"."TrainingSession" ADD COLUMN     "attemptId" TEXT;

-- CreateTable
CREATE TABLE "content"."Assessment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "status" "content"."ScenarioStatus" NOT NULL DEFAULT 'DRAFT',
    "scenarioIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "stem" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "rationale" TEXT NOT NULL,
    "reference" TEXT,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."AssessmentAttempt" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "windowId" TEXT NOT NULL,
    "phase" "content"."AssessmentPhase" NOT NULL,
    "anonymousHash" TEXT NOT NULL,
    "cohortKey" TEXT,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "quizScorePct" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."AssessmentWindow" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "opensAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closesAt" TIMESTAMP(3),
    "openedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentWindow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assessment_status_idx" ON "content"."Assessment"("status");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentId_order_idx" ON "content"."AssessmentQuestion"("assessmentId", "order");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessmentId_cohortKey_phase_idx" ON "content"."AssessmentAttempt"("assessmentId", "cohortKey", "phase");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_windowId_anonymousHash_key" ON "content"."AssessmentAttempt"("windowId", "anonymousHash");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentWindow_organizationId_assessmentId_phase_key" ON "identity"."AssessmentWindow"("organizationId", "assessmentId", "phase");

-- CreateIndex
CREATE INDEX "TrainingSession_attemptId_idx" ON "content"."TrainingSession"("attemptId");

-- AddForeignKey
ALTER TABLE "content"."AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "content"."Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "content"."Assessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."AssessmentWindow" ADD CONSTRAINT "AssessmentWindow_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "identity"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
