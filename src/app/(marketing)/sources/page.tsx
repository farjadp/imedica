import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { SCENARIO_SOURCES, SOURCES } from "@/server/citations/registry";
import { LIBRARY } from "@/server/scenarios/library";

import { LegalPage } from "../legal/legal-page";
import { groupSources, mapScenarios } from "./sources-view";

export const metadata: Metadata = {
  title: "Sources & references",
  description:
    "The clinical guidelines, data and literature behind Imedica's paramedic training scenarios, with links to each source and how every scenario maps to them.",
  alternates: { canonical: "/sources" },
};

const external = "text-pine underline decoration-pine/30 underline-offset-4 hover:decoration-pine";

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={external}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

export default function SourcesPage() {
  const groups = groupSources(SOURCES);
  const scenarios = mapScenarios(SCENARIO_SOURCES, SOURCES, new Map(LIBRARY.map((s) => [s.slug, s.title])));

  return (
    <LegalPage
      kicker="Reference"
      title="Sources & references"
      updated="8 November 2026"
      draft={false}
      lead="Every scenario in Imedica is written against a published standard. Here is each one, with a link to the original."
    >
      {groups.map((g) => (
        <section key={g.kind} aria-labelledby={`kind-${g.kind}`}>
          <h2 id={`kind-${g.kind}`}>{g.heading}</h2>
          <p>{g.lead}</p>
          <ol className="mt-6 divide-y divide-rule border-y border-rule">
            {g.sources.map((s) => (
              <li key={s.id} id={`source-${s.id}`} className="scroll-mt-28 py-5">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-4 no-underline!"
                >
                  <span className="min-w-0">
                    <span className="block font-medium text-ink decoration-pine/40 underline-offset-4 group-hover:underline">
                      {s.title}
                    </span>
                    <span className="mt-1 block text-[15px] text-ink-3">
                      {s.publisher}
                      {s.version ? (
                        <>
                          {" · "}
                          <span className="font-mono text-[13px]">{s.version}</span>
                        </>
                      ) : null}
                    </span>
                    <span className="mt-1 block truncate font-mono text-[12px] text-ink-3">
                      {s.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </span>
                  </span>
                  <ArrowUpRight className="mt-1 size-5 shrink-0 text-pine" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {scenarios.length > 0 ? (
        <section aria-labelledby="scenario-map">
          <h2 id="scenario-map">How scenarios map to guidelines</h2>
          <p>
            Each scenario names the standard and the medical directive or protocol it follows. The same links appear in the
            app on the scenario brief, during the call and in the debrief.
          </p>
          <dl className="mt-6 divide-y divide-rule border-y border-rule">
            {scenarios.map((m) => (
              <div key={m.slug} className="grid gap-1 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-6">
                <dt className="font-medium text-ink">{m.name}</dt>
                <dd>
                  <ul className="list-none! space-y-1! pl-0! text-[15px]">
                    {m.refs.map((r) => (
                      <li key={`${r.source.id}-${r.section ?? ""}`}>
                        <a href={`#source-${r.source.id}`} className={external}>
                          {r.source.title}
                        </a>
                        {r.section ? <span className="text-ink-3">: {r.section}</span> : null}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <h2>Not clinical advice</h2>
      <p>
        Imedica is a training tool for paramedics and students under supervision. It is not a medical device and not for
        clinical decisions. In practice, follow your local medical directives, your base hospital and your own clinical
        judgement. Where Imedica differs from them, they are right. Read the full{" "}
        <Link href="/legal/disclaimer">medical disclaimer</Link>.
      </p>

      <h2>Credits</h2>
      <ul>
        <li>
          ECG rhythms on the scenario monitor are real recordings from the{" "}
          <ExternalLink href="https://physionet.org/content/ptb-xl/1.0.3/">PTB-XL ECG database</ExternalLink> (Wagner et
          al., <em>Scientific Data</em> 7, 154, 2020) on PhysioNet, used under the{" "}
          <ExternalLink href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</ExternalLink> licence.
        </li>
        <li>
          Paper search in Research is powered by <ExternalLink href="https://europepmc.org/">Europe PMC</ExternalLink>.
        </li>
        <li>
          Debrief and teaching notes are drafted by an AI model (Claude, by Anthropic) and checked against these sources by
          our physicians. The AI can&apos;t change a score.
        </li>
      </ul>
    </LegalPage>
  );
}
