-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "content";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateEnum
CREATE TYPE "identity"."Role" AS ENUM ('PARAMEDIC', 'INSTRUCTOR', 'PHYSICIAN', 'ADMIN');

-- CreateEnum
CREATE TYPE "identity"."OrgType" AS ENUM ('EMS_SERVICE', 'FIRE_SERVICE', 'HOSPITAL', 'COLLEGE', 'LONG_TERM_CARE', 'OTHER');

-- CreateEnum
CREATE TYPE "identity"."ParamedicLevel" AS ENUM ('PCP', 'ACP', 'CCP', 'EMR', 'STUDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "content"."ScenarioCategory" AS ENUM ('CARDIAC', 'RESPIRATORY', 'NEUROLOGICAL', 'TRAUMA', 'TOXICOLOGY', 'ENVIRONMENTAL', 'OBSTETRIC', 'PEDIATRIC', 'ALLERGIC', 'METABOLIC');

-- CreateEnum
CREATE TYPE "content"."Difficulty" AS ENUM ('FOUNDATIONAL', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "content"."ScenarioStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "content"."ActionCategory" AS ENUM ('ASSESSMENT', 'AIRWAY', 'BREATHING', 'CIRCULATION', 'MEDICATION', 'PROCEDURE', 'TRANSPORT', 'COMMUNICATION');

-- CreateEnum
CREATE TYPE "content"."Outcome" AS ENUM ('CORRECT', 'ACCEPTABLE', 'SUBOPTIMAL', 'HARMFUL', 'CRITICAL');

-- CreateEnum
CREATE TYPE "content"."SessionStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'TIMED_OUT', 'ABANDONED');

-- CreateEnum
CREATE TYPE "content"."AiFeedbackStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "content"."ReviewStatus" AS ENUM ('UNREVIEWED', 'APPROVED', 'FLAGGED');

-- CreateTable
CREATE TABLE "identity"."Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "identity"."OrgType" NOT NULL DEFAULT 'EMS_SERVICE',
    "province" TEXT NOT NULL DEFAULT 'ON',
    "seatLimit" INTEGER NOT NULL DEFAULT 25,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "identity"."Role" NOT NULL DEFAULT 'PARAMEDIC',
    "level" "identity"."ParamedicLevel",
    "yearsExperience" INTEGER,
    "organizationId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."AuthSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "identity"."Role" NOT NULL DEFAULT 'PARAMEDIC',
    "organizationId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."PasswordResetToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."DemoRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "teamSize" TEXT NOT NULL,
    "message" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemoRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "identity"."Role",
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."Scenario" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "dispatch" TEXT NOT NULL,
    "category" "content"."ScenarioCategory" NOT NULL,
    "difficulty" "content"."Difficulty" NOT NULL DEFAULT 'INTERMEDIATE',
    "status" "content"."ScenarioStatus" NOT NULL DEFAULT 'DRAFT',
    "timeLimitSec" INTEGER NOT NULL DEFAULT 600,
    "learningGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "protocolSource" TEXT,
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."ScenarioState" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "vitals" JSONB NOT NULL,
    "isStart" BOOLEAN NOT NULL DEFAULT false,
    "isTerminal" BOOLEAN NOT NULL DEFAULT false,
    "debrief" TEXT,

    CONSTRAINT "ScenarioState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."ScenarioAction" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "category" "content"."ActionCategory" NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ScenarioAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."ScenarioRule" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "fromStateId" TEXT,
    "actionId" TEXT NOT NULL,
    "outcome" "content"."Outcome" NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "toStateId" TEXT,
    "withinSec" INTEGER,
    "rationale" TEXT NOT NULL,
    "feedbackId" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "required" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ScenarioRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."FeedbackTemplate" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "reference" TEXT,

    CONSTRAINT "FeedbackTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."TrainingSession" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "anonymousHash" TEXT NOT NULL,
    "cohortKey" TEXT,
    "status" "content"."SessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "currentStateId" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "maxScore" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stateEnteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."SessionDecision" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "ruleId" TEXT,
    "outcome" "content"."Outcome" NOT NULL,
    "points" INTEGER NOT NULL,
    "elapsedMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."AiFeedback" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "status" "content"."AiFeedbackStatus" NOT NULL DEFAULT 'PENDING',
    "content" JSONB,
    "error" TEXT,
    "model" TEXT,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "cacheReadTokens" INTEGER NOT NULL DEFAULT 0,
    "costMicroUsd" INTEGER NOT NULL DEFAULT 0,
    "review" "content"."ReviewStatus" NOT NULL DEFAULT 'UNREVIEWED',
    "reviewNote" TEXT,
    "reviewerId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."AnalyticsSession" (
    "id" TEXT NOT NULL,
    "anonymousHash" TEXT NOT NULL,
    "cohortKey" TEXT,
    "scenarioId" TEXT NOT NULL,
    "category" "content"."ScenarioCategory" NOT NULL,
    "difficulty" "content"."Difficulty" NOT NULL,
    "level" "identity"."ParamedicLevel",
    "experienceBucket" TEXT,
    "scorePct" INTEGER NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "outcome" "content"."SessionStatus" NOT NULL,
    "harmfulCount" INTEGER NOT NULL DEFAULT 0,
    "missedRequired" INTEGER NOT NULL DEFAULT 0,
    "completedWeek" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."AnalyticsDecision" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "actionCategory" "content"."ActionCategory" NOT NULL,
    "outcome" "content"."Outcome" NOT NULL,
    "secondsInState" INTEGER NOT NULL,

    CONSTRAINT "AnalyticsDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "identity"."Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "identity"."User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "identity"."User"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "identity"."AuthSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "identity"."AuthSession"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "identity"."Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_organizationId_idx" ON "identity"."Invitation"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "identity"."PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "identity"."AuditLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "identity"."AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_slug_key" ON "content"."Scenario"("slug");

-- CreateIndex
CREATE INDEX "Scenario_status_category_idx" ON "content"."Scenario"("status", "category");

-- CreateIndex
CREATE INDEX "ScenarioState_scenarioId_order_idx" ON "content"."ScenarioState"("scenarioId", "order");

-- CreateIndex
CREATE INDEX "ScenarioAction_scenarioId_idx" ON "content"."ScenarioAction"("scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioRule_scenarioId_fromStateId_idx" ON "content"."ScenarioRule"("scenarioId", "fromStateId");

-- CreateIndex
CREATE INDEX "TrainingSession_anonymousHash_startedAt_idx" ON "content"."TrainingSession"("anonymousHash", "startedAt");

-- CreateIndex
CREATE INDEX "SessionDecision_sessionId_idx" ON "content"."SessionDecision"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "AiFeedback_sessionId_key" ON "content"."AiFeedback"("sessionId");

-- CreateIndex
CREATE INDEX "AiFeedback_status_idx" ON "content"."AiFeedback"("status");

-- CreateIndex
CREATE INDEX "AiFeedback_review_idx" ON "content"."AiFeedback"("review");

-- CreateIndex
CREATE INDEX "AnalyticsSession_cohortKey_completedWeek_idx" ON "analytics"."AnalyticsSession"("cohortKey", "completedWeek");

-- CreateIndex
CREATE INDEX "AnalyticsSession_anonymousHash_idx" ON "analytics"."AnalyticsSession"("anonymousHash");

-- CreateIndex
CREATE INDEX "AnalyticsDecision_sessionId_idx" ON "analytics"."AnalyticsDecision"("sessionId");

-- AddForeignKey
ALTER TABLE "identity"."User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "identity"."Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "identity"."Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "identity"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."ScenarioState" ADD CONSTRAINT "ScenarioState_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "content"."Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."ScenarioAction" ADD CONSTRAINT "ScenarioAction_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "content"."Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."ScenarioRule" ADD CONSTRAINT "ScenarioRule_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "content"."Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."ScenarioRule" ADD CONSTRAINT "ScenarioRule_fromStateId_fkey" FOREIGN KEY ("fromStateId") REFERENCES "content"."ScenarioState"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."ScenarioRule" ADD CONSTRAINT "ScenarioRule_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "content"."ScenarioAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."ScenarioRule" ADD CONSTRAINT "ScenarioRule_toStateId_fkey" FOREIGN KEY ("toStateId") REFERENCES "content"."ScenarioState"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."ScenarioRule" ADD CONSTRAINT "ScenarioRule_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "content"."FeedbackTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."FeedbackTemplate" ADD CONSTRAINT "FeedbackTemplate_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "content"."Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."TrainingSession" ADD CONSTRAINT "TrainingSession_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "content"."Scenario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."SessionDecision" ADD CONSTRAINT "SessionDecision_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "content"."TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."AiFeedback" ADD CONSTRAINT "AiFeedback_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "content"."TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."AnalyticsDecision" ADD CONSTRAINT "AnalyticsDecision_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "analytics"."AnalyticsSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
