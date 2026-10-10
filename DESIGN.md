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

The runtime monitor is the one dark surface (#0d1513 with monitor green #9ff0c4 and alarm #ff7b6f), because that is what a monitor looks like.

## Type

- **Source Serif 4** for display and page titles: the voice of a clinical journal.
- **IBM Plex Sans** for UI and body.
- **IBM Plex Mono** only for measurement: vitals, timestamps, scores, outcome tags.

## Signature elements

- **ECG trace** (`components/clinical/ecg-trace.tsx`): synthesised lead II, rhythm-aware, seamless scroll, paused under reduced motion.
- **ECG paper** utility: the 1 mm / 5 mm grid behind traces.
- **Outcome tags**: small mono uppercase labels in triage colours.
- **Privacy plates** (three.js): the three schemas as stacked plates, with records crossing only through the hash gate. Lazy-loaded.

## Rules

- No eyebrow labels over headings, no gradient text, no card grids standing in for structure.
- Motion: one entrance (`verdict-in`, expo ease-out, a slight blur) for things that arrive; the ECG sweep. Nothing else moves.
- Focus rings are pine, the text caret is signal red, and selection is pine on paper.
- Charts: one hue per series, values in ink, suppressed groups say "fewer than 5 people" rather than disappearing.
