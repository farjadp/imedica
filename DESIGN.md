# Imedica design system

**World: the clinical instrument.** Paper of the patient care record, ink of the chart, the deep green of the founders' studio portraits, and ECG red reserved for the trace and real alarms. Calm, credible and exact, the way a good monitor is.

## Colour (`src/app/globals.css`)

| Token | Use |
| --- | --- |
| `paper` #f7f6f1, `paper-2`, `card` #fffefb | Surfaces. Light by design: the buyer is a training director at a desk. |
| `ink` #10201c, `ink-2`, `ink-3` | Text, in three steps. `ink-3` still passes 4.5:1 on paper. |
| `rule`, `rule-2` | Hairlines. Borders do the structural work; shadows only lift floating things. |
| `pine` #123d31 → `pine-3` | Primary actions, active navigation, selection. |
| `signal` #c2302a | ECG trace, live indicators, the active tab underline, time running out. Never decoration. |
| `tag-green / yellow / red / black` | Outcomes, following Canadian triage tags: correct/acceptable, suboptimal, harmful, critical. Always with a text label. |

The dark surfaces are the monitor's (#06110e with monitor green #9ff0c4 and alarm #ff7b6f): the homepage hero, the statement band, the footer and the runtime monitor. Everything a person reads at length sits on paper.

## Type

- **Source Serif 4** for display and page titles: the voice of a clinical journal.
- **IBM Plex Sans** for UI and body.
- **IBM Plex Mono** only for measurement: vitals, timestamps, scores, outcome tags.

## Signature elements

- **ECG trace** (`components/clinical/ecg-trace.tsx`): synthesised lead II, rhythm-aware, seamless scroll, paused under reduced motion.
- **ECG paper** utility: the 1 mm / 5 mm grid behind traces.
- **Outcome tags**: small mono uppercase labels in triage colours.
- **Vectorcardiogram hero** (three.js, `hero-vcg.ts`): the P, QRS and T loops the cardiac vector traces each beat, drawn in sync with a full-width monitor sweep from one clock (`cardiac.ts`). Glow comes from additive halo lines, not post-processing (bloom broke canvas alpha).
- **Privacy plates** (three.js): the three schemas as stacked plates, with records crossing only through the hash gate. Lazy-loaded.

## Rules

- No eyebrow labels over headings, no gradient text, no card grids standing in for structure.
- Display type is big and tight: Source Serif 4 at up to ~9.6rem, tracking -0.045em, with italic serif accents in monitor green or pine.
- Navigation is a floating pill that turns dark over any section marked `data-nav="dark"`.
- Motion: one entrance (`verdict-in`, expo ease-out, a slight blur) for things that arrive; the ECG sweep. Nothing else moves.
- Focus rings are pine, the text caret is signal red, and selection is pine on paper.
- Charts: one hue per series, values in ink, suppressed groups say "fewer than 5 people" rather than disappearing.
