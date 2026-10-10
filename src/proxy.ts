import { type NextRequest, NextResponse } from "next/server";

// Optimistic check only: no cookie means no session, so skip the render and go
// straight to sign-in. The real check happens on the server for every page,
// action and API route.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("imedica_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
