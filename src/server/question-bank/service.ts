import "server-only";

import { z } from "zod";

import type { Prisma } from "@/generated/prisma/client";

import { createQuestion } from "../assessments/authoring";
import { audit } from "../audit";
import { CONTENT_ROLES, HttpError } from "../auth/guards";
import type { CurrentUser } from "../auth/session";
import { db } from "../db";
import { env } from "../env";
import { limited } from "../rate-limit";

import { EMS_MCQA, parseEmsMcqa } from "./ems-mcqa";

// ============================================================================
// The question bank: questions from open datasets that physicians can copy
// into a draft assessment. Internal testing only, so every entry point checks
// the INTERNAL_DATASETS switch and answers 404 when it's off.
// ============================================================================

export function questionBankEnabled() {
  return env().INTERNAL_DATASETS === "on";
}

function assertAuthor(user: CurrentUser) {
  if (!questionBankEnabled()) throw new HttpError(404, "Not found.");
  if (!CONTENT_ROLES.includes(user.role)) throw new HttpError(403, "Only physicians can use the question bank.");
}

const PAGE = 25;

const searchSchema = z.object({
  q: z.string().trim().max(120).default(""),
  level: z.string().trim().max(30).default(""),
  category: z.string().trim().max(60).default(""),
  page: z.coerce.number().int().min(1).max(1000).default(1),
});

export async function searchBank(user: CurrentUser, url: URL) {
  assertAuthor(user);
  const { q, level, category, page } = searchSchema.parse(Object.fromEntries(url.searchParams));
  const where: Prisma.BankQuestionWhereInput = {
    ...(q ? { stem: { contains: q, mode: "insensitive" } } : {}),
    ...(level ? { levels: { has: level } } : {}),
    ...(category ? { categories: { has: category } } : {}),
  };
  const [total, items, all] = await Promise.all([
    db.bankQuestion.count({ where }),
    db.bankQuestion.findMany({ where, orderBy: { id: "asc" }, skip: (page - 1) * PAGE, take: PAGE }),
    db.bankQuestion.count(),
  ]);
  return { total, all, page, pages: Math.max(1, Math.ceil(total / PAGE)), items };
}

/** Downloads EMS-MCQA and adds what's new. Admins only; safe to run again. */
export async function importEmsMcqa(user: CurrentUser) {
  assertAuthor(user);
  if (user.role !== "ADMIN") throw new HttpError(403, "Only an admin can import a dataset.");
  if (await limited(`bank-import:${user.id}`, 3, 60 * 60 * 1000)) {
    throw new HttpError(429, "That's three imports this hour. Try again later.");
  }

  let records: unknown;
  try {
    const res = await fetch(EMS_MCQA.url, { signal: AbortSignal.timeout(60_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    records = await res.json();
  } catch (error) {
    console.error("[question-bank] EMS-MCQA download failed", error);
    throw new HttpError(502, "Couldn't download EMS-MCQA from Hugging Face. Try again in a minute.");
  }

  const { rows, skipped } = parseEmsMcqa(records);
  let added = 0;
  for (let i = 0; i < rows.length; i += 1000) {
    const { count } = await db.bankQuestion.createMany({ data: rows.slice(i, i + 1000), skipDuplicates: true });
    added += count;
  }
  await audit(user, "bank.import", { type: "BankQuestion", id: EMS_MCQA.source }, { added, usable: rows.length, skipped });
  return { source: EMS_MCQA.source, added, usable: rows.length, skipped };
}

const addSchema = z.object({ assessmentId: z.string().min(1) });

/** Copies a bank question into a draft assessment, naming its source. */
export async function addToAssessment(user: CurrentUser, bankId: string, body: unknown) {
  assertAuthor(user);
  const { assessmentId } = addSchema.parse(body);
  const b = await db.bankQuestion.findUnique({ where: { id: bankId } });
  if (!b) throw new HttpError(404, "Not found in the question bank.");

  const reference = `${b.source} (internal test, licence not cleared)${b.origin ? `, from ${b.origin}` : ""}`.slice(0, 300);
  return createQuestion(user, assessmentId, {
    stem: b.stem,
    options: b.options,
    correctIndex: b.correctIndex,
    rationale: b.explanation ?? "The source gives no explanation. Write one before sending this for review.",
    reference,
  });
}
