-- CreateEnum
CREATE TYPE "identity"."MessageKind" AS ENUM ('CONTACT', 'CAREERS', 'APP_WAITLIST');

-- CreateTable
CREATE TABLE "identity"."InboundMessage" (
    "id" TEXT NOT NULL,
    "kind" "identity"."MessageKind" NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "organization" TEXT,
    "topic" TEXT,
    "message" TEXT,
    "links" TEXT,
    "handled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InboundMessage_kind_handled_createdAt_idx" ON "identity"."InboundMessage"("kind", "handled", "createdAt");
