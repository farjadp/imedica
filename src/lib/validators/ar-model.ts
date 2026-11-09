import { z } from "zod";

import { text } from "./scenario";

// Shared by the editor (client) and the API (server).
// A scenario's 3D casualty for "look before you act" (docs/product/ar-spike.md).

/** Body regions a hotspot can sit on. v2 groups taps by these; extend here, no migration needed. */
export const BODY_REGIONS = [
  "head",
  "face",
  "airway",
  "neck",
  "chest",
  "abdomen",
  "pelvis",
  "back",
  "left_arm",
  "right_arm",
  "left_leg",
  "right_leg",
  "skin",
  "whole_body",
  "scene",
] as const;

/**
 * One named part of the model. `node` is the object name in the GLB/USDZ
 * (lower snake case, e.g. `wound_thigh_left`), so the model brief and the data
 * agree. `action` optionally points at a ScenarioAction id in the same scenario;
 * v2 scores a tap on the node as that action.
 */
export const hotspotSchema = z.strictObject({
  node: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]{0,63}$/, "Use the node name from the model: lower case, digits and _ only."),
  label: text(1, 80, "Label"),
  region: z.enum(BODY_REGIONS, { error: "Pick a body region." }),
  action: z.string().trim().min(1).max(64).optional(),
});
export type Hotspot = z.infer<typeof hotspotSchema>;

/** A site path under /models/ or /ar-spike/, or an https URL; ending in the right extension. */
const modelUrl = (ext: string, what: string) =>
  z
    .string({ error: `${what} is required.` })
    .trim()
    .max(500)
    .refine((v) => /^\/(?!\/)[\w\-./]+$/.test(v) || /^https:\/\/[^\s]+$/.test(v), {
      message: `${what} must be a path on this site (starting with /) or an https:// URL.`,
    })
    .refine((v) => new RegExp(`\\.${ext}$`, "i").test(v.split(/[?#]/)[0]), {
      message: `${what} must end in .${ext}.`,
    });

export const arModelSchema = z.object({
  glbUrl: modelUrl("glb", "GLB file (Android)"),
  usdzUrl: modelUrl("usdz", "USDZ file (iPhone)"),
  posterUrl: z
    .union([modelUrl("(png|jpe?g|webp)", "Poster image"), z.literal("").transform(() => null), z.null()])
    .optional()
    .transform((v) => v ?? null),
  heightMeters: z.coerce
    .number({ error: "Height is required." })
    .min(0.2, "Height must be at least 0.2 m.")
    .max(3, "Height must be 3 m or less."),
  licence: text(1, 80, "Licence"),
  source: text(1, 300, "Source"),
  hotspots: z
    .array(hotspotSchema)
    .max(50)
    .default([])
    .refine((hs) => new Set(hs.map((h) => h.node)).size === hs.length, { message: "Each node can have one hotspot." }),
});
export type ArModelInput = z.infer<typeof arModelSchema>;

export const arModelReviewSchema = z.object({ action: z.enum(["approve", "revoke"]) });

/** Site paths become absolute: the phone hands the URL to Quick Look / Scene Viewer. */
export function resolveModelUrl(url: string, base: string) {
  return url.startsWith("/") ? new URL(url, base).toString() : url;
}
