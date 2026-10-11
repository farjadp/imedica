import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Route-level tests: the real route handlers against a real Postgres. The suite
// wipes this database; test/integration/global-setup.ts refuses any not named *_test.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://imedica:imedica_dev@127.0.0.1:54329/imedica_test";

export default defineConfig({
  test: {
    include: ["test/integration/**/*.test.ts"],
    environment: "node",
    globalSetup: ["test/integration/global-setup.ts"],
    setupFiles: ["test/integration/setup.ts"],
    // One database, so files run one after another.
    fileParallelism: false,
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      DEIDENTIFICATION_SECRET: "integration-test-secret-at-least-thirty-two-chars",
      APP_URL: "http://localhost:3000",
      ANTHROPIC_API_KEY: "",
      RESEND_API_KEY: "",
      NODE_ENV: "test",
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The marker package throws outside a React Server Components build.
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
});
