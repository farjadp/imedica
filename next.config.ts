import type { NextConfig } from "next";

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
      // AR test page (placeholder model, see docs/product/ar-spike.md). iOS AR Quick Look
      // only opens a .usdz served with its own MIME type; keep the page out of search.
      { source: "/ar-spike/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/ar-spike/models/:file(.*\\.usdz)", headers: [{ key: "Content-Type", value: "model/vnd.usdz+zip" }] },
      { source: "/ar-spike/models/:file(.*\\.glb)", headers: [{ key: "Content-Type", value: "model/gltf-binary" }] },
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
