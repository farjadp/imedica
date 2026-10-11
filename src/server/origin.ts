// Is a browser write coming from our own site? Pure, so it's testable.
//
// Behind a proxy (Railway), `req.url` carries the container's own address,
// not the public one, so the public host comes from the Host and
// X-Forwarded-Host headers the proxy passes on. A cross-site page can't set
// Host, and setting X-Forwarded-Host would need a CORS preflight we never grant.

function hosts(req: Request, extra: string[]): Set<string> {
  const out = new Set<string>([new URL(req.url).host, ...extra.map((h) => h.toLowerCase())]);
  for (const name of ["host", "x-forwarded-host"]) {
    for (const h of (req.headers.get(name) ?? "").split(",")) {
      if (h.trim()) out.add(h.trim().toLowerCase());
    }
  }
  return out;
}

/**
 * True for reads, requests without Origin (the mobile app), and writes whose
 * Origin is this site. `extra` adds known hosts, such as APP_URL's.
 */
export function isSameOrigin(req: Request, extra: string[] = []): boolean {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origin = req.headers.get("origin");
  if (!origin) return true;
  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false; // "null" and other opaque origins
  }
  return hosts(req, extra).has(host);
}
