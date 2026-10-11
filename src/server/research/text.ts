// Text helpers for papers from Europe PMC. Pure, so they're testable.

const DOI = /^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)?(10\.\d{4,9}\/\S+)$/i;
const PMID = /^(?:pmid:?\s*)?(\d{5,9})$/i;
const PMCID = /^(PMC\d{3,10})$/i;

/**
 * Turns what a person types into a Europe PMC query. A pasted DOI, PMID or
 * PMCID finds that paper; anything else is a keyword search, newest research
 * first in relevance order.
 */
export function normalizeQuery(raw: string, opts: { openAccessOnly?: boolean } = {}): string {
  const q = raw.trim().slice(0, 300);
  if (!q) return "";
  const doi = q.match(DOI);
  if (doi) return `DOI:"${doi[1].replace(/"/g, "")}"`;
  const pmid = q.match(PMID);
  if (pmid) return `EXT_ID:${pmid[1]} AND SRC:MED`;
  const pmcid = q.match(PMCID);
  if (pmcid) return `PMCID:${pmcid[1].toUpperCase()}`;
  // Keep words, quotes and simple operators; drop field syntax a person
  // didn't mean to type.
  const words = q.replace(/[{}[\]\\:]/g, " ").replace(/\s+/g, " ").trim();
  return opts.openAccessOnly ? `(${words}) AND OPEN_ACCESS:y` : words;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decode(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

/** Europe PMC abstracts carry <h4> section heads and inline tags. */
export function cleanAbstract(html: string): string {
  return decode(
    html
      .replace(/<h4>(.*?)<\/h4>/gi, "\n\n$1\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Long enough for the methods and results of a typical paper, short enough to
// keep one summary cheap.
export const MAX_FULL_TEXT_CHARS = 60_000;

/** JATS XML body to plain text, with section titles kept and references dropped. */
export function stripXml(xml: string): string {
  const text = decode(
    xml
      .replace(/<(ref-list|table-wrap|fig|supplementary-material)[\s\S]*?<\/\1>/g, "")
      .replace(/<xref[^>]*>[\s\S]*?<\/xref>/g, "")
      .replace(/<title>(.*?)<\/title>/g, "\n\n## $1\n")
      .replace(/<\/p>/g, "\n")
      .replace(/<[^>]+>/g, ""),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text.length > MAX_FULL_TEXT_CHARS ? `${text.slice(0, MAX_FULL_TEXT_CHARS)}\n\n[truncated]` : text;
}
