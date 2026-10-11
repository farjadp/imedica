// Local development seed. Every person and organization here is fictional.
//
// Test accounts. Locally they share DEV_PASSWORD below. On any deployed
// environment set SEED_PASSWORD instead: the seed refuses to publish the
// documented dev password on a public server.
//   admin@imedica.test        Imedica administrator
//   physician@imedica.test    physician, author of the scenarios
//   reviewer@imedica.test     second physician (publishes; two-person rule)
//   instructor@lakeshore.test training lead at Lakeshore Paramedic Services
//   medic1..medic6@lakeshore.test  paramedics
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import type { ParamedicLevel, ScenarioCategory } from "../src/generated/prisma/enums";
import { anaphylaxis, hypoglycemia, stemi } from "../src/server/scenarios/library/core";
import { LIBRARY } from "../src/server/scenarios/library";
import { installScenario } from "../src/server/scenarios/library/install";
import type { ScenarioDef } from "../src/server/scenarios/library/types";
import { experienceBucket, keyedHash, weekStart } from "../src/server/privacy/hash";

export const DEV_PASSWORD = "Imedica-dev-2026";

const seedPassword = process.env.SEED_PASSWORD || DEV_PASSWORD;
const deployed = process.env.NODE_ENV === "production" || Boolean(process.env.RAILWAY_ENVIRONMENT);
if (deployed && seedPassword === DEV_PASSWORD) {
  throw new Error("Set SEED_PASSWORD before seeding a deployed environment.");
}

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const secret = process.env.DEIDENTIFICATION_SECRET!;
if (!secret || secret.length < 32) throw new Error("Set DEIDENTIFICATION_SECRET in .env first.");

async function upsertScenario(def: ScenarioDef, authorId: string, reviewerId: string) {
  await db.scenario.deleteMany({ where: { slug: def.slug } });
  return installScenario(db, def, { authorId, reviewerId });
}

async function main() {
  const passwordHash = await bcrypt.hash(seedPassword, 12);

  const org = await db.organization.upsert({
    where: { slug: "lakeshore-paramedic-services" },
    update: {},
    create: { name: "Lakeshore Paramedic Services", slug: "lakeshore-paramedic-services", type: "EMS_SERVICE", province: "ON", seatLimit: 40 },
  });

  const people: {
    email: string;
    firstName: string;
    lastName: string;
    role: "ADMIN" | "PHYSICIAN" | "INSTRUCTOR" | "PARAMEDIC";
    org?: boolean;
    level?: ParamedicLevel;
    years?: number;
  }[] = [
    { email: "admin@imedica.test", firstName: "Avery", lastName: "Admin", role: "ADMIN" },
    { email: "physician@imedica.test", firstName: "Jordan", lastName: "Hale", role: "PHYSICIAN" },
    { email: "reviewer@imedica.test", firstName: "Priya", lastName: "Raman", role: "PHYSICIAN" },
    { email: "instructor@lakeshore.test", firstName: "Morgan", lastName: "Leclerc", role: "INSTRUCTOR", org: true },
    { email: "medic1@lakeshore.test", firstName: "Sam", lastName: "Okafor", role: "PARAMEDIC", org: true, level: "PCP", years: 3 },
    { email: "medic2@lakeshore.test", firstName: "Riley", lastName: "Tremblay", role: "PARAMEDIC", org: true, level: "ACP", years: 9 },
    { email: "medic3@lakeshore.test", firstName: "Casey", lastName: "Nguyen", role: "PARAMEDIC", org: true, level: "PCP", years: 1 },
    { email: "medic4@lakeshore.test", firstName: "Taylor", lastName: "Singh", role: "PARAMEDIC", org: true, level: "PCP", years: 6 },
    { email: "medic5@lakeshore.test", firstName: "Jamie", lastName: "Côté", role: "PARAMEDIC", org: true, level: "ACP", years: 14 },
    { email: "medic6@lakeshore.test", firstName: "Alex", lastName: "Morrison", role: "PARAMEDIC", org: true, level: "PCP", years: 2 },
  ];

  const users = new Map<string, { id: string; level: ParamedicLevel | null; years: number | null }>();
  for (const p of people) {
    const u = await db.user.upsert({
      where: { email: p.email },
      update: { role: p.role, passwordHash },
      create: {
        email: p.email,
        passwordHash,
        firstName: p.firstName,
        lastName: p.lastName,
        role: p.role,
        organizationId: p.org ? org.id : null,
        level: p.level ?? null,
        yearsExperience: p.years ?? null,
      },
    });
    users.set(p.email, { id: u.id, level: p.level ?? null, years: p.years ?? null });
  }

  const author = users.get("physician@imedica.test")!.id;
  const reviewer = users.get("reviewer@imedica.test")!.id;
  const s1 = await upsertScenario(stemi, author, reviewer);
  const s2 = await upsertScenario(anaphylaxis, author, reviewer);
  await upsertScenario(hypoglycemia, author, reviewer);
  // The rest of the library, as physicians would find it: waiting for review.
  for (const def of LIBRARY.filter((d) => ![stemi, anaphylaxis, hypoglycemia].includes(d))) {
    await upsertScenario(def, author, reviewer);
  }

  // De-identified history so the instructor view has something to show.
  // Toxicology has only three people, so it stays below the k-anonymity floor.
  await db.analyticsSession.deleteMany({});
  const cohortKey = keyedHash(secret, "cohort", org.id);
  const medics = [...users.entries()].filter(([email]) => email.startsWith("medic"));
  const now = new Date();
  let seed = 11;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280), seed / 233280);

  const plan: { category: ScenarioCategory; scenarioId: string; who: number; base: number }[] = [
    { category: "CARDIAC", scenarioId: s1.id, who: 6, base: 68 },
    { category: "ALLERGIC", scenarioId: s2.id, who: 6, base: 81 },
    { category: "RESPIRATORY", scenarioId: "seed-respiratory", who: 5, base: 74 },
    { category: "TOXICOLOGY", scenarioId: "seed-toxicology", who: 3, base: 55 },
  ];
  for (const p of plan) {
    for (const [, m] of medics.slice(0, p.who)) {
      for (let week = 0; week < 10; week += 1 + Math.floor(rand() * 3)) {
        const score = Math.max(20, Math.min(100, Math.round(p.base + (10 - week) * 1.2 + (rand() - 0.5) * 22)));
        const harmful = score < 60 && rand() > 0.4 ? 1 : 0;
        const when = new Date(now.getTime() - week * 7 * 864e5);
        await db.analyticsSession.create({
          data: {
            anonymousHash: keyedHash(secret, "user", m.id),
            cohortKey,
            scenarioId: p.scenarioId,
            category: p.category,
            difficulty: "INTERMEDIATE",
            level: m.level,
            experienceBucket: experienceBucket(m.years),
            scorePct: score,
            durationSec: 420 + Math.floor(rand() * 360),
            outcome: "COMPLETED",
            harmfulCount: harmful,
            missedRequired: score < 70 ? 1 : 0,
            completedWeek: weekStart(when),
            decisions: {
              create: [
                { actionCategory: "ASSESSMENT", outcome: "CORRECT", secondsInState: 40 + Math.floor(rand() * 120) },
                { actionCategory: "MEDICATION", outcome: harmful ? "HARMFUL" : score > 75 ? "CORRECT" : "SUBOPTIMAL", secondsInState: 30 + Math.floor(rand() * 90) },
                { actionCategory: "TRANSPORT", outcome: score > 65 ? "CORRECT" : "ACCEPTABLE", secondsInState: 20 + Math.floor(rand() * 60) },
              ],
            },
          },
        });
      }
    }
  }

  console.log(`Seeded ${people.length} users, 3 scenarios and de-identified history for ${org.name}.`);
  console.log(seedPassword === DEV_PASSWORD ? `All test accounts use the password: ${DEV_PASSWORD}` : "All test accounts use SEED_PASSWORD.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
