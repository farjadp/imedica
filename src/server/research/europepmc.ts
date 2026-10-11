import "server-only";

import { HttpError } from "../auth/guards";

import { cleanAbstract, normalizeQuery, stripXml } from "./text";

// Europe PMC: free, keyless access to PubMed and PubMed Central, with full
// text for open-access papers. https://europepmc.org/RestfulWebService
const BASE = "https://www.ebi.ac.uk/europepmc/webservices/rest";
const TIMEOUT_MS = 12_000;

// Only real Europe PMC sources; the id goes into a URL path.
const SOURCES = new Set(["MED", "PMC", "PPR", "AGR", "CBA", "CTX", "ETH", "HIR", "PAT"]);
const ID = /^[A-Za-z0-9._-]{1,40}$/;

export function assertPaperRef(source: string, extId: string) {
  if (!SOURCES.has(source) || !ID.test(extId)) throw new HttpError(404, "Not found.");
}

export type PaperSummary = {
  source: string;
  extId: string;
  title: string;
  authors: string | null;
  journal: string | null;
  year: number | null;
  doi: string | null;
  openAccess: boolean;
  citedBy: number;
  pubType: string | null;
};

export type PaperDetail = PaperSummary & {
  abstract: string | null;
  keywords: string[];
  pubTypes: string[];
  pmcid: string | null;
  url: string;
};

type Raw = Record<string, unknown> & {
  id: string;
  source: string;
  title?: string;
  authorString?: string;
  journalTitle?: string;
  journalInfo?: { journal?: { title?: string; medlineAbbreviation?: string } };
  pubYear?: string;
  doi?: string;
  pmcid?: string;
  isOpenAccess?: string;
  inEPMC?: string;
  citedByCount?: number | string;
  pubType?: string;
  pubTypeList?: { pubType?: string[] };
  abstractText?: string;
  keywordList?: { keyword?: string[] };
};

async function get(path: string, accept = "application/json"): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { headers: { accept }, signal: AbortSignal.timeout(TIMEOUT_MS), cache: "no-store" });
  } catch {
    throw new HttpError(502, "The paper index didn't answer. Try again in a moment.");
  }
  if (res.status === 404) throw new HttpError(404, "Not found.");
  if (!res.ok) throw new HttpError(502, "The paper index had a problem. Try again in a moment.");
  return res;
}

function toSummary(r: Raw): PaperSummary {
  const year = Number(r.pubYear);
  return {
    source: r.source,
    extId: r.id,
    title: (r.title ?? "Untitled").replace(/\.$/, ""),
    authors: r.authorString ?? null,
    journal: r.journalTitle ?? r.journalInfo?.journal?.medlineAbbreviation ?? r.journalInfo?.journal?.title ?? null,
    year: Number.isFinite(year) && year > 0 ? year : null,
    doi: r.doi ?? null,
    openAccess: r.isOpenAccess === "Y",
    citedBy: Number(r.citedByCount ?? 0) || 0,
    pubType: r.pubType ?? r.pubTypeList?.pubType?.[0] ?? null,
  };
}

/** Search PubMed and PMC. `cursor` is Europe PMC's cursorMark. */
export async function searchPapers(input: { q: string; cursor?: string | null; openAccessOnly?: boolean }) {
  const query = normalizeQuery(input.q, { openAccessOnly: input.openAccessOnly });
  if (!query) throw new HttpError(422, "Type something to search for.");
  const params = new URLSearchParams({
    query,
    format: "json",
    resultType: "lite",
    pageSize: "20",
    cursorMark: input.cursor || "*",
  });
  const json = (await (await get(`/search?${params}`)).json()) as {
    hitCount?: number;
    nextCursorMark?: string;
    resultList?: { result?: Raw[] };
  };
  const results = (json.resultList?.result ?? []).map(toSummary);
  return {
    total: json.hitCount ?? 0,
    results,
    // Europe PMC repeats the cursor on the last page.
    nextCursor: results.length === 20 && json.nextCursorMark && json.nextCursorMark !== input.cursor ? json.nextCursorMark : null,
  };
}

export async function getPaper(source: string, extId: string): Promise<PaperDetail> {
  assertPaperRef(source, extId);
  const params = new URLSearchParams({ query: `EXT_ID:${extId} AND SRC:${source}`, format: "json", resultType: "core", pageSize: "1" });
  const json = (await (await get(`/search?${params}`)).json()) as { resultList?: { result?: Raw[] } };
  const r = json.resultList?.result?.[0];
  if (!r) throw new HttpError(404, "That paper isn't in the index.");
  return {
    ...toSummary(r),
    abstract: r.abstractText ? cleanAbstract(r.abstractText) : null,
    keywords: r.keywordList?.keyword?.slice(0, 12) ?? [],
    pubTypes: r.pubTypeList?.pubType ?? [],
    // PMC-only records carry the PMCID as their id.
    pmcid: r.pmcid ?? (source === "PMC" ? extId : null),
    // Only open-access papers in Europe PMC can be read in full.
    url: r.doi ? `https://doi.org/${r.doi}` : `https://europepmc.org/article/${source}/${extId}`,
    openAccess: r.isOpenAccess === "Y" && r.inEPMC === "Y",
  };
}

/** The body text of an open-access paper, or null when there isn't one to read. */
export async function getFullText(paper: PaperDetail): Promise<string | null> {
  if (!paper.openAccess || !paper.pmcid) return null;
  try {
    const xml = await (await get(`/${paper.pmcid}/fullTextXML`, "application/xml")).text();
    const body = xml.match(/<body[\s\S]*<\/body>/)?.[0];
    return body ? stripXml(body) : null;
  } catch {
    return null; // fall back to the abstract
  }
}
