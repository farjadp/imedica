import { describe, expect, it } from "vitest";

import { isSameOrigin } from "./origin";

// What Railway's proxy hands the app: the container's address in the URL,
// the public domain in Host / X-Forwarded-Host.
const behindProxy = (origin: string | null, headers: Record<string, string> = {}) =>
  new Request("http://0.0.0.0:8080/api/v1/question-bank/import", {
    method: "POST",
    headers: { host: "imedica-staging.up.railway.app", ...(origin ? { origin } : {}), ...headers },
  });

describe("isSameOrigin", () => {
  it("accepts a write from the public site behind a proxy", () => {
    expect(isSameOrigin(behindProxy("https://imedica-staging.up.railway.app"))).toBe(true);
  });

  it("accepts the public host from X-Forwarded-Host", () => {
    const req = new Request("http://0.0.0.0:8080/x", {
      method: "POST",
      headers: { host: "0.0.0.0:8080", "x-forwarded-host": "imedica.ca", origin: "https://imedica.ca" },
    });
    expect(isSameOrigin(req)).toBe(true);
  });

  it("refuses a write from another site", () => {
    expect(isSameOrigin(behindProxy("https://evil.example"))).toBe(false);
    expect(isSameOrigin(behindProxy("https://imedica-staging.up.railway.app.evil.example"))).toBe(false);
  });

  it("accepts APP_URL's host when the proxy passes neither header", () => {
    const req = new Request("http://0.0.0.0:8080/x", { method: "POST", headers: { origin: "https://imedica.ca" } });
    expect(isSameOrigin(req)).toBe(false);
    expect(isSameOrigin(req, ["imedica.ca"])).toBe(true);
  });

  it("refuses an opaque origin", () => {
    expect(isSameOrigin(behindProxy("null"))).toBe(false);
  });

  it("lets reads and the mobile app (no Origin) through", () => {
    expect(isSameOrigin(new Request("http://0.0.0.0:8080/x", { headers: { origin: "https://evil.example" } }))).toBe(true);
    expect(isSameOrigin(behindProxy(null))).toBe(true);
  });

  it("still works locally, with no proxy", () => {
    const req = new Request("http://localhost:3000/x", { method: "POST", headers: { origin: "http://localhost:3000" } });
    expect(isSameOrigin(req)).toBe(true);
  });
});
