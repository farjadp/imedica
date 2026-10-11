import { afterAll, beforeAll, vi } from "vitest";

import { assertTestDatabase } from "./database-url";
import { requestHeaders } from "./request-context";

vi.mock("next/headers", () => ({
  headers: async () => requestHeaders(),
  // Tests authenticate with bearer tokens, the same path the mobile app uses.
  cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/server")>()),
  // No request lifecycle to hang work on; the AI explanation is out of scope here.
  after: () => {},
}));

vi.mock("next/cache", () => ({ revalidatePath: () => {}, revalidateTag: () => {} }));

// Every file starts from an empty database.
beforeAll(async () => {
  assertTestDatabase(process.env.DATABASE_URL!);
  const { db } = await import("@/server/db");
  const tables = await db.$queryRaw<{ name: string }[]>`
    SELECT format('%I.%I', table_schema, table_name) AS name
    FROM information_schema.tables
    WHERE table_schema IN ('identity', 'content', 'analytics') AND table_type = 'BASE TABLE'`;
  if (tables.length) {
    await db.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => t.name).join(", ")} RESTART IDENTITY CASCADE`);
  }
});

afterAll(async () => {
  const { db } = await import("@/server/db");
  await db.$disconnect();
});
