-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "content";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "identity";

-- CreateEnum
CREATE TYPE "identity"."UserRole" AS ENUM ('paramedic', 'admin', 'super_admin', 'clinical_validator');

-- CreateEnum
CREATE TYPE "identity"."OrgType" AS ENUM ('paramedic_service', 'training_program', 'private');

-- CreateEnum
CREATE TYPE "identity"."OrgPlan" AS ENUM ('pilot', 'standard', 'enterprise');

-- CreateEnum
CREATE TYPE "analytics"."ParamedicLevel" AS ENUM ('PCP', 'ACP', 'CCP', 'student');

-- CreateEnum
CREATE TYPE "analytics"."ExperienceBucket" AS ENUM ('0-2_years', '3-5_years', '5-10_years', '10+_years');

-- CreateEnum
CREATE TYPE "analytics"."ServiceType" AS ENUM ('public_large', 'public_small', 'private', 'training_program');

-- CreateEnum
CREATE TYPE "analytics"."SessionStatus" AS ENUM ('in_progress', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "analytics"."DecisionType" AS ENUM ('assessment', 'medication', 'procedure', 'diagnosis', 'transport');

-- CreateEnum
CREATE TYPE "content"."ScenarioCategory" AS ENUM ('cardiac', 'trauma', 'neuro', 'respiratory', 'pediatric', 'obstetric', 'toxicology');

-- CreateEnum
CREATE TYPE "content"."ScenarioDifficulty" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "content"."ScenarioStatus" AS ENUM ('draft', 'review', 'published');

-- CreateEnum
CREATE TYPE "content"."RuleStatus" AS ENUM ('draft', 'active', 'deprecated');

-- CreateEnum
CREATE TYPE "content"."AuditActorType" AS ENUM ('user', 'system');

-- CreateEnum
CREATE TYPE "content"."AuditResult" AS ENUM ('success', 'failure');

-- CreateTable
CREATE TABLE "identity"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "phone" VARCHAR(20),
    "organization_id" UUID,
    "role" "identity"."UserRole" NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token_hash" VARCHAR(255),
    "email_verification_token_expires_at" TIMESTAMP(3),
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" VARCHAR(255),
    "password_reset_token_hash" VARCHAR(255),
    "password_reset_token_expires_at" TIMESTAMP(3),
    "consent_analytics" BOOLEAN NOT NULL DEFAULT false,
    "consent_analytics_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."organizations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "type" "identity"."OrgType" NOT NULL,
    "province" VARCHAR(2),
    "billing_email" VARCHAR(254),
    "contract_start" DATE,
    "contract_end" DATE,
    "plan" "identity"."OrgPlan",
    "max_seats" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identity"."anonymous_mappings" (
    "user_id" UUID NOT NULL,
    "anonymous_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anonymous_mappings_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "identity"."refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."paramedic_profile_snapshot" (
    "anonymous_hash" VARCHAR(255) NOT NULL,
    "paramedic_level" "analytics"."ParamedicLevel",
    "experience_bucket" "analytics"."ExperienceBucket",
    "region" VARCHAR(2),
    "service_type" "analytics"."ServiceType",
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "paramedic_profile_snapshot_pkey" PRIMARY KEY ("anonymous_hash")
);

-- CreateTable
CREATE TABLE "analytics"."sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "anonymous_hash" VARCHAR(255) NOT NULL,
    "scenario_id" UUID NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "total_duration_seconds" INTEGER,
    "final_score" INTEGER,
    "status" "analytics"."SessionStatus" NOT NULL DEFAULT 'in_progress',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics"."decisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "anonymous_hash" VARCHAR(255) NOT NULL,
    "state_order" INTEGER NOT NULL,
    "decision_type" "analytics"."DecisionType" NOT NULL,
    "decision_value" JSONB NOT NULL,
    "time_to_decision_ms" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "protocol_alignment_score" DOUBLE PRECISION,
    "rule_ids_applied" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."scenarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(255) NOT NULL,
    "category" "content"."ScenarioCategory" NOT NULL,
    "difficulty" "content"."ScenarioDifficulty" NOT NULL,
    "estimated_duration_minutes" INTEGER,
    "learning_objectives" TEXT[],
    "status" "content"."ScenarioStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "clinical_validated_by" VARCHAR(255),
    "clinical_validated_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."scenario_states" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scenario_id" UUID NOT NULL,
    "state_order" INTEGER NOT NULL,
    "patient_presentation" JSONB NOT NULL,
    "expected_actions" JSONB NOT NULL,
    "time_limit_seconds" INTEGER,
    "next_state_logic" JSONB,

    CONSTRAINT "scenario_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "scenario_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "priority" INTEGER NOT NULL,
    "conditions" JSONB NOT NULL,
    "outcomes" JSONB NOT NULL,
    "timing_bonuses" JSONB,
    "validated_by" VARCHAR(255),
    "validated_at" TIMESTAMP(3),
    "status" "content"."RuleStatus" NOT NULL DEFAULT 'draft',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."feedback_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rule_id" UUID NOT NULL,
    "baseText" TEXT NOT NULL,
    "detail_text" TEXT,
    "references" TEXT[],
    "physician_reviewed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content"."audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actor_type" "content"."AuditActorType" NOT NULL,
    "actor_id" VARCHAR(255),
    "action" VARCHAR(255) NOT NULL,
    "resource_type" VARCHAR(100),
    "resource_id" VARCHAR(255),
    "metadata" JSONB,
    "ip_address" VARCHAR(45),
    "user_agent" VARCHAR(500),
    "result" "content"."AuditResult" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "identity"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "anonymous_mappings_anonymous_hash_key" ON "identity"."anonymous_mappings"("anonymous_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "identity"."refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "identity"."refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_anonymous_hash_idx" ON "analytics"."sessions"("anonymous_hash");

-- CreateIndex
CREATE INDEX "sessions_scenario_id_idx" ON "analytics"."sessions"("scenario_id");

-- CreateIndex
CREATE INDEX "decisions_session_id_idx" ON "analytics"."decisions"("session_id");

-- CreateIndex
CREATE INDEX "decisions_anonymous_hash_idx" ON "analytics"."decisions"("anonymous_hash");

-- CreateIndex
CREATE UNIQUE INDEX "scenario_states_scenario_id_state_order_key" ON "content"."scenario_states"("scenario_id", "state_order");

-- CreateIndex
CREATE INDEX "rules_scenario_id_priority_idx" ON "content"."rules"("scenario_id", "priority");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_idx" ON "content"."audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "content"."audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "content"."audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "identity"."users" ADD CONSTRAINT "users_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "identity"."organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."anonymous_mappings" ADD CONSTRAINT "anonymous_mappings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "identity"."refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "identity"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."sessions" ADD CONSTRAINT "sessions_anonymous_hash_fkey" FOREIGN KEY ("anonymous_hash") REFERENCES "analytics"."paramedic_profile_snapshot"("anonymous_hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."decisions" ADD CONSTRAINT "decisions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "analytics"."sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics"."decisions" ADD CONSTRAINT "decisions_anonymous_hash_fkey" FOREIGN KEY ("anonymous_hash") REFERENCES "analytics"."paramedic_profile_snapshot"("anonymous_hash") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."scenario_states" ADD CONSTRAINT "scenario_states_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "content"."scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."rules" ADD CONSTRAINT "rules_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "content"."scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content"."feedback_templates" ADD CONSTRAINT "feedback_templates_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "content"."rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
