// Which copy of the site search engines may index. Pure, so it's testable.

const OFFICIAL = /^(www\.)?imedica\.(tech|ca)$/;

/**
 * Index only when APP_URL is an official domain and the request came in on
 * that same host. Staging (imedica-staging.up.railway.app), previews and local
 * copies are served by the same app and must never compete with it in search.
 */
export function indexable(appUrl: string | undefined, requestHost: string | null): boolean {
  if (!appUrl) return false;
  let official: URL;
  try {
    official = new URL(appUrl);
  } catch {
    return false;
  }
  if (official.protocol !== "https:" || !OFFICIAL.test(official.hostname)) return false;
  return (requestHost ?? "").toLowerCase().split(":")[0] === official.hostname;
}
