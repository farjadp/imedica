// Response headers for 3D model files, used by next.config.ts.
//
// iOS AR Quick Look only opens a .usdz served as model/vnd.usdz+zip; with the
// default octet-stream it shows "Zero KB" (found in the AR spike,
// docs/product/ar-spike.md). These rules hold for every .usdz/.glb the site
// serves, not just one folder.
//
// Files under /models/ live in versioned folders (/models/<slug>/v<n>/…) and
// never change once published, so they cache for a year. A new model version
// gets a new folder, never an overwrite.

type HeaderRule = { source: string; headers: { key: string; value: string }[] };

export const MODELS_PATH = "/models";

export const MODEL_MIME = {
  usdz: "model/vnd.usdz+zip",
  glb: "model/gltf-binary",
} as const;

export const modelHeaderRules: HeaderRule[] = [
  { source: "/:path(.*\\.usdz)", headers: [{ key: "Content-Type", value: MODEL_MIME.usdz }] },
  { source: "/:path(.*\\.glb)", headers: [{ key: "Content-Type", value: MODEL_MIME.glb }] },
  {
    source: `${MODELS_PATH}/:path*`,
    headers: [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      // Public, non-personal files; lets a viewer on another origin fetch them.
      { key: "Access-Control-Allow-Origin", value: "*" },
    ],
  },
];
