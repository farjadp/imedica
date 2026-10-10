// Shared by the public blog and the admin desk.

export function formatPostDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}

export type FaqItem = { q: string; a: string };
export type SourceItem = { title: string; url: string };

/** Json columns arrive untyped; keep only well-formed entries. */
export function asFaq(v: unknown): FaqItem[] {
  return Array.isArray(v) ? v.filter((x): x is FaqItem => typeof x?.q === "string" && typeof x?.a === "string") : [];
}
export function asSources(v: unknown): SourceItem[] {
  return Array.isArray(v) ? v.filter((x): x is SourceItem => typeof x?.title === "string" && typeof x?.url === "string") : [];
}
