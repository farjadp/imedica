import { describe, expect, it } from "vitest";

import { experienceBucket, keyedHash, weekStart } from "./hash";

describe("keyedHash", () => {
  const secret = "x".repeat(48);

  it("is stable for the same input", () => {
    expect(keyedHash(secret, "user", "u1")).toBe(keyedHash(secret, "user", "u1"));
  });

  it("separates purposes, so a user hash never equals a cohort hash for the same id", () => {
    expect(keyedHash(secret, "user", "abc")).not.toBe(keyedHash(secret, "cohort", "abc"));
  });

  it("depends on the secret", () => {
    expect(keyedHash(secret, "user", "u1")).not.toBe(keyedHash("y".repeat(48), "user", "u1"));
  });

  it("doesn't contain the id", () => {
    expect(keyedHash(secret, "user", "cl_user_123")).not.toContain("cl_user_123");
  });
});

describe("experienceBucket", () => {
  it.each([
    [null, null],
    [0, "0-2"],
    [2, "0-2"],
    [3, "3-5"],
    [10, "6-10"],
    [25, "10+"],
  ])("%s years → %s", (years, bucket) => {
    expect(experienceBucket(years)).toBe(bucket);
  });
});

describe("weekStart", () => {
  it("truncates to Monday 00:00 UTC", () => {
    // Thursday 9 Oct 2026, 15:42 UTC
    expect(weekStart(new Date("2026-10-08T15:42:00Z")).toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });

  it("keeps a Monday on itself", () => {
    expect(weekStart(new Date("2026-10-05T23:59:00Z")).toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });

  it("moves a Sunday back to the previous Monday", () => {
    expect(weekStart(new Date("2026-10-11T08:00:00Z")).toISOString()).toBe("2026-10-05T00:00:00.000Z");
  });
});
