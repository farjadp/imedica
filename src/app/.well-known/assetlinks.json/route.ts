import { NextResponse } from "next/server";

import { env } from "@/server/env";

// Android App Links: proves www.imedica.tech belongs to the app, so invitation
// links open it without asking. Fingerprints come from ANDROID_CERT_SHA256.
export function GET() {
  const { ANDROID_PACKAGE, ANDROID_CERT_SHA256 } = env();
  const body = ANDROID_CERT_SHA256.length
    ? [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: { namespace: "android_app", package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: ANDROID_CERT_SHA256 },
        },
      ]
    : [];
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
