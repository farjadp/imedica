-- AlterTable
ALTER TABLE "content"."session_decisions"
ADD COLUMN "enhanced_feedback" TEXT,
ADD COLUMN "feedback_source" VARCHAR(20);
