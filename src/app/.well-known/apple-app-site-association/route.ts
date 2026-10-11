import { NextResponse } from "next/server";

import { env } from "@/server/env";

// iOS reads this when the app is installed to learn which links on this domain
// open the app instead of Safari. Served as JSON, no redirect, no extension.
export function GET() {
  const appID = env().APPLE_APP_ID;
  return NextResponse.json(
    {
      applinks: {
        details: [
          { appIDs: [appID], components: [{ "/": "/invite/*", comment: "Invitation links open the join screen" }] },
          // Pre-iOS 13 format, kept second as Apple recommends.
          { appID, paths: ["/invite/*"] },
        ],
      },
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
