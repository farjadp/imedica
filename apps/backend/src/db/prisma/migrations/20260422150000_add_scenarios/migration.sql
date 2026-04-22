-- Drop the old content tables and enums. Content is reseeded after this migration.
DROP TABLE IF EXISTS "content"."feedback_templates";
DROP TABLE IF EXISTS "content"."rules";
DROP TABLE IF EXISTS "content"."scenario_states";
DROP TABLE IF EXISTS "content"."scenarios";

DROP TYPE IF EXISTS "content"."RuleStatus";
DROP TYPE IF EXISTS "content"."ScenarioCategory";
DROP TYPE IF EXISTS "content"."ScenarioDifficulty";
DROP TYPE IF EXISTS "content"."ScenarioStatus";

-- Recreate the content enums used by Phase 3.
CREATE TYPE "content"."ScenarioCategory" AS ENUM (
  'CARDIAC',
  'RESPIRATORY',
  'TRAUMA',
  'NEUROLOGICAL',
  'PEDIATRIC',
  'OBSTETRIC',
  'TOXICOLOGY',
  'ENVIRONMENTAL',
  'BEHAVIORAL',
  'OTHER'
);

CREATE TYPE "content"."ScenarioDifficulty" AS ENUM (
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED'
);

CREATE TYPE "content"."ScenarioStatus" AS ENUM (
  'DRAFT',
  'REVIEW',
  'PUBLISHED',
  'ARCHIVED'
);

-- Scenario library records authored by clinicians.
CREATE TABLE "content"."scenarios" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "category" "content"."ScenarioCategory" NOT NULL,
  "difficulty" "content"."ScenarioDifficulty" NOT NULL,
  "estimated_duration" INTEGER NOT NULL,
  "patient_presentation" TEXT NOT NULL,
  "learning_objectives" TEXT NOT NULL,
  "author_id" UUID NOT NULL,
  "status" "content"."ScenarioStatus" NOT NULL DEFAULT 'DRAFT',
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content"."scenario_states" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scenario_id" UUID NOT NULL,
  "state_order" INTEGER NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "vitals" JSONB NOT NULL,
  "physical_exam" TEXT,
  "symptoms" TEXT,
  "time_limit_seconds" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "scenario_states_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content"."scenario_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scenario_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "condition" JSONB NOT NULL,
  "points" INTEGER NOT NULL,
  "feedback_key" TEXT NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "scenario_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "content"."feedback_templates" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "scenario_id" UUID NOT NULL,
  "key" VARCHAR(100) NOT NULL,
  "language" VARCHAR(10) NOT NULL DEFAULT 'en',
  "title" VARCHAR(200) NOT NULL,
  "message" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "feedback_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "scenarios_category_difficulty_is_published_idx"
  ON "content"."scenarios" ("category", "difficulty", "is_published");

CREATE INDEX "scenarios_author_id_idx"
  ON "content"."scenarios" ("author_id");

CREATE UNIQUE INDEX "scenario_states_scenario_id_order_key"
  ON "content"."scenario_states" ("scenario_id", "state_order");

CREATE INDEX "scenario_rules_scenario_id_priority_idx"
  ON "content"."scenario_rules" ("scenario_id", "priority");

CREATE UNIQUE INDEX "feedback_templates_scenario_id_key_language_key"
  ON "content"."feedback_templates" ("scenario_id", "key", "language");

ALTER TABLE "content"."scenarios"
  ADD CONSTRAINT "scenarios_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "identity"."users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "content"."scenario_states"
  ADD CONSTRAINT "scenario_states_scenario_id_fkey"
  FOREIGN KEY ("scenario_id") REFERENCES "content"."scenarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "content"."scenario_rules"
  ADD CONSTRAINT "scenario_rules_scenario_id_fkey"
  FOREIGN KEY ("scenario_id") REFERENCES "content"."scenarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "content"."feedback_templates"
  ADD CONSTRAINT "feedback_templates_scenario_id_fkey"
  FOREIGN KEY ("scenario_id") REFERENCES "content"."scenarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analytics"."sessions"
  DROP CONSTRAINT IF EXISTS "sessions_scenario_id_fkey";

ALTER TABLE "analytics"."sessions"
  ADD CONSTRAINT "sessions_scenario_id_fkey"
  FOREIGN KEY ("scenario_id") REFERENCES "content"."scenarios"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
