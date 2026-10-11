import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  DEIDENTIFICATION_SECRET: z.string().min(32, "DEIDENTIFICATION_SECRET must be at least 32 characters"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  ANTHROPIC_API_KEY: z.string().optional().transform((v) => v || undefined),
  ANTHROPIC_MODEL: z.string().default("claude-opus-5-5"),
  RESEND_API_KEY: z.string().optional().transform((v) => v || undefined),
  // Optional: only needed once "Enhanced push security" is on in the Expo project.
  EXPO_ACCESS_TOKEN: z.string().optional().transform((v) => v || undefined),
  EMAIL_FROM: z.string().default("Imedica <no-reply@imedica.ca>"),
  // "on" turns on features built from open datasets whose licence we haven't
  // cleared for customers yet (the question bank). Off everywhere a customer can reach.
  INTERNAL_DATASETS: z.enum(["on", "off"]).default("off"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

// Validated lazily so `next build` can run without production secrets present.
export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
