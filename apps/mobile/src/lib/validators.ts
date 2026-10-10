// ============================================================================
// File: apps/mobile/src/lib/validators.ts
// Why: Inline copy of Zod validators from @imedica/shared.
//      Needed because EAS cloud builds only upload apps/mobile — the shared
//      package is not available on the EAS server during bundling.
// ============================================================================

import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(254)
    .toLowerCase()
    .trim(),
  password: z.string().min(1, 'Password is required').max(128),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Shared constants (from @imedica/shared) ─────────────────────────────────

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CLINICAL_VALIDATOR: 'clinical_validator',
  PARAMEDIC: 'paramedic',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
