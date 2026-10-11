import { execFileSync } from "node:child_process";

import { TEST_DATABASE_URL, assertTestDatabase } from "./database-url";

/** Brings the test database up to the current migrations once per run. */
export default function setup() {
  assertTestDatabase(TEST_DATABASE_URL);
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: "inherit",
  });
}
