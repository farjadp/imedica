import { describe, expect, it } from "vitest";

import { indexable } from "./indexing";

describe("indexable", () => {
  it("indexes the official domain", () => {
    expect(indexable("https://www.imedica.tech", "www.imedica.tech")).toBe(true);
    expect(indexable("https://imedica.ca", "imedica.ca")).toBe(true);
  });

  it("never indexes staging, even when APP_URL is official", () => {
    expect(indexable("https://www.imedica.tech", "imedica-staging.up.railway.app")).toBe(false);
  });

  it("never indexes when APP_URL isn't an official https domain", () => {
    expect(indexable("https://imedica-staging.up.railway.app", "imedica-staging.up.railway.app")).toBe(false);
    expect(indexable("http://www.imedica.tech", "www.imedica.tech")).toBe(false);
    expect(indexable("http://localhost:3000", "localhost:3000")).toBe(false);
    expect(indexable(undefined, "www.imedica.tech")).toBe(false);
    expect(indexable("https://www.imedica.tech.evil.example", "www.imedica.tech.evil.example")).toBe(false);
  });
});
