-- CreateEnum
CREATE TYPE "content"."SessionRuntimeStatus" AS ENUM ('RUNNING', 'COMPLETED', 'ABANDONED');

-- CreateTable
CREATE TABLE "content"."sessions" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "scenario_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "status" "content"."SessionRuntimeStatus" NOT NULL DEFAULT 'RUNNING',
    "current_state_order" INTEGER NOT NULL DEFAULT 0,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "max_possible_score" INTEGER,
    "user_agent" VARCHAR(500),
    "ip_address" VARCHAR(45),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."session_decisions" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "action_type" VARCHAR(100) NOT NULL,
    "action_value" VARCHAR(255),
    "state_order" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "time_from_start" INTEGER NOT NULL,
    "is_correct" BOOLEAN,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "feedback_key" VARCHAR(100),
    "rule_matched" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sessions_user_id_status_idx" ON "content"."sessions"("user_id", "status");

-- CreateIndex
CREATE INDEX "sessions_scenario_id_status_idx" ON "content"."sessions"("scenario_id", "status");

-- CreateIndex
CREATE INDEX "session_decisions_session_id_timestamp_idx" ON "content"."session_decisions"("session_id", "timestamp");

-- AddForeignKey
ALTER TABLE "content"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."sessions" ADD CONSTRAINT "sessions_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "content"."scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."session_decisions" ADD CONSTRAINT "session_decisions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "content"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
