import type { Source, SourceKind } from "@/server/citations/registry";

/** The order and wording of the groups on the Sources page. */
export const KIND_ORDER: { kind: SourceKind; heading: string; lead: string }[] = [
  {
    kind: "guideline",
    heading: "Clinical guidelines",
    lead: "The standards our scenarios are written against. Doses, thresholds and destinations come from these documents.",
  },
  {
    kind: "data",
    heading: "Data",
    lead: "Recorded data the app plays back, such as the ECG rhythms on the scenario monitor.",
  },
  {
    kind: "literature",
    heading: "Literature",
    lead: "Where the in-app research search finds published papers.",
  },
];

export interface SourceGroup {
  kind: SourceKind;
  heading: string;
  lead: string;
  sources: Source[];
}

/** Groups the registry by kind in page order, dropping empty groups. */
export function groupSources(sources: Record<string, Source>): SourceGroup[] {
  const all = Object.values(sources);
  return KIND_ORDER.map((g) => ({ ...g, sources: all.filter((s) => s.kind === g.kind) })).filter(
    (g) => g.sources.length > 0,
  );
}

export interface ScenarioMapping {
  slug: string;
  name: string;
  refs: { source: Source; section: string | null }[];
}

/**
 * Turns the slug-keyed scenario map into readable rows named by their library
 * title. Slugs not in the shipped library (e.g. unreleased scenarios) and
 * unknown source ids are skipped; scenarios left with no source drop out.
 */
export function mapScenarios(
  scenarioSources: Record<string, { sourceId: string; section: string | null }[]>,
  sources: Record<string, Source>,
  titles: ReadonlyMap<string, string>,
): ScenarioMapping[] {
  return Object.entries(scenarioSources)
    .flatMap(([slug, refs]) => {
      const name = titles.get(slug);
      return name ? [{ slug, name, refs }] : [];
    })
    .map(({ slug, name, refs }) => ({
      slug,
      name,
      refs: refs.flatMap((r) => {
        const source = sources[r.sourceId];
        return source ? [{ source, section: r.section }] : [];
      }),
    }))
    .filter((m) => m.refs.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}
