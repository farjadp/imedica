import { defineRailway, github, preserve, project, service } from "railway/iac";

// Railway Infrastructure as Code for the Imedica `web` service.
// Replaces railway.json (Config as Code stops working on 2026-12-01).
// Railway does not read this file during deploys: run `railway config plan`
// then `railway config apply` from the repo root to sync service settings.
// https://docs.railway.com/infrastructure-as-code#migrating-from-config-as-code

// Per-repo partial: this repo owns only the `web` service, not Postgres.
export const partial = "web";

export default defineRailway(() => {
  const web = service("web", {
    source: github("farjadp/imedica", { branch: "main", checkSuites: false }),
    build: {
      builder: "RAILPACK",
      buildCommand: "npm run build",
    },
    deploy: {
      startCommand:
        "sh -c 'npx prisma migrate deploy && if [ \"$SEED_ON_DEPLOY\" = \"true\" ]; then npx tsx prisma/seed.ts; fi && npm start'",
      preDeployCommand: [],
      preDeployTimeoutSeconds: 600,
      healthcheckPath: "/",
      healthcheckTimeout: 300,
      restartPolicyType: "ON_FAILURE",
      restartPolicyMaxRetries: 5,
    },
    // Values live in Railway only; preserve() keeps them as they are.
    env: {
      ANDROID_CERT_SHA256: preserve(),
      ANTHROPIC_API_KEY: preserve(),
      ANTHROPIC_MODEL: preserve(),
      APP_URL: preserve(),
      DATABASE_URL: preserve(),
      DEIDENTIFICATION_SECRET: preserve(),
      EMAIL_FROM: preserve(),
      INTERNAL_DATASETS: preserve(),
      PORT: preserve(),
      SEED_PASSWORD: preserve(),
    },
  });
  return project("imedica", {
    resources: [web],
  });
});
