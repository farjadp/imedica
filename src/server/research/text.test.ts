import { describe, expect, it } from "vitest";

import { cleanAbstract, normalizeQuery, stripXml } from "./text";

describe("normalizeQuery", () => {
  it("finds a pasted DOI, with or without the resolver", () => {
    expect(normalizeQuery("10.1080/10903127.2024.2449505")).toBe('DOI:"10.1080/10903127.2024.2449505"');
    expect(normalizeQuery("https://doi.org/10.1016/j.resplu.2026.101384")).toBe('DOI:"10.1016/j.resplu.2026.101384"');
  });

  it("finds a PMID or PMCID", () => {
    expect(normalizeQuery("39786726")).toBe("EXT_ID:39786726 AND SRC:MED");
    expect(normalizeQuery("PMID: 39786726")).toBe("EXT_ID:39786726 AND SRC:MED");
    expect(normalizeQuery("pmc13320515")).toBe("PMCID:PMC13320515");
  });

  it("strips field syntax from keyword searches and can limit to open access", () => {
    expect(normalizeQuery("  naloxone  AUTH:smith ")).toBe("naloxone AUTH smith");
    expect(normalizeQuery("stroke bypass", { openAccessOnly: true })).toBe("(stroke bypass) AND OPEN_ACCESS:y");
    expect(normalizeQuery("   ")).toBe("");
  });
});

describe("cleanAbstract", () => {
  it("keeps section heads as paragraphs and drops tags", () => {
    expect(cleanAbstract("<h4>Objective</h4>To test &amp; see.<h4>Results</h4>It <i>worked</i>.")).toBe(
      "Objective\nTo test & see.\n\nResults\nIt worked.",
    );
  });
});

describe("stripXml", () => {
  it("keeps titles and paragraphs, drops references and citations", () => {
    const xml =
      "<body><sec><title>Methods</title><p>We enrolled 40 crews<xref ref-type=\"bibr\">[3]</xref>.</p></sec><ref-list><ref>Smith</ref></ref-list></body>";
    expect(stripXml(xml)).toBe("## Methods\nWe enrolled 40 crews.");
  });
});
