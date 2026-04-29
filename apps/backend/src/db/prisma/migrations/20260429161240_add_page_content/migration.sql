-- CreateTable
CREATE TABLE "content"."page_contents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" VARCHAR(100) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "page_contents_slug_key" ON "content"."page_contents"("slug");

