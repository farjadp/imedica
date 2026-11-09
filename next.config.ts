import type { NextConfig } from "next";

import { modelHeaderRules } from "./src/lib/model-headers";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // 3D casualty models (.usdz/.glb): MIME types AR Quick Look and Scene Viewer need,
      // and a long cache for versioned files under /models/. See src/lib/model-headers.ts.
      ...modelHeaderRules,
      // AR test page (placeholder model, see docs/product/ar-spike.md): keep it out of search.
      { source: "/ar-spike/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  // The bare domain points at this same Railway service; send it to www.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "imedica.tech" }],
        destination: "https://www.imedica.tech/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
