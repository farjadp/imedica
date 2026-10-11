---
month: 2026-10
extra: true
title: "What Imedica does with training data, now and next"
slug: what-imedica-does-with-data
excerpt: "Real ECGs on the monitor, decision-level records instead of quiz scores, and before-and-after evidence for services. Here is how Imedica uses data today, where it's heading, and why it matters."
keyTakeaway: "Today Imedica uses data in three ways: real ECGs make the monitor realistic, decision records show exactly where a crew went right or wrong, and paired pre/post assessments measure whether training worked. Next, aggregated decision data will show where scenarios are too hard or too easy, and how a service compares with its peers."
category: product
tags: [training-data, value-proposition, assessment, privacy, imedica]
focusKeyword: paramedic training data
metaDescription: "How Imedica uses paramedic training data today and next: real ECGs, decision-level records, pre/post evidence, and why privacy-first data is the advantage."
faq:
  - q: What does Imedica record when a paramedic trains?
    a: "Each decision in a scenario: the action, the patient state it was taken in, the rule engine's ruling, and the time since the call began. A de-identified copy keeps only a one-way hash in place of the person, the week rather than the exact time, and an experience range."
  - q: Does Imedica train AI models on paramedic data?
    a: "No. The AI writes plain-language debriefs. It doesn't score decisions and it isn't trained on learner records. Scores come from physician-written rules."
  - q: Can a manager see one paramedic's results?
    a: "Team reports only show groups of five or more people. The point is to understand the team, not to rank individuals."
sources:
  - title: "The Personal Information Protection and Electronic Documents Act (PIPEDA), Office of the Privacy Commissioner of Canada"
    url: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/
  - title: "PTB-XL, a large publicly available electrocardiography dataset (Scientific Data, 2020)"
    url: https://doi.org/10.1038/s41597-020-0495-6
---

A training lead finishes a recertification block and is asked the usual question: did it work? Usually the only honest answer is attendance and a quiz score. Both show that people took part. Neither shows that anyone will make a better decision at 3 a.m. with a patient who is getting worse.

That gap is the reason Imedica treats paramedic training data as part of the product, not an afterthought. This post covers what we do with data today, what we plan next, and why we think this is one of the strongest things Imedica offers.

## How Imedica uses paramedic training data today

**1. Real signals, not cartoons.** The scenario monitor plays real ECG recordings from PTB-XL, a peer-reviewed open dataset. Paramedics learn rhythms on drawn waveforms, then meet real ones at work, with noise, wander and messy morphology. Practising on real recordings closes some of that gap.

**2. A record of every decision, not just a score.** Every action in a scenario is scored by rules a physician wrote, and every ruling is kept along with its timing. A debrief can then say "you gave the right drug, three minutes after the patient's condition changed" rather than just "72%". The AI turns those rulings into plain language, but it never changes them.

**3. Before-and-after evidence.** Services can run the same set of scenarios and questions before and after training, with the debrief held back on the first attempt. Once at least five people have done both, the report shows the change for the group. That gives a service something concrete to bring to a medical director or a funder.

**4. Better material, faster.** Inside the company, open datasets help us write material: an exam-style question bank for drafting assessments, and EMS call transcripts that Claude can turn into first drafts of scenarios. Everything drafted this way stays a draft until a physician has rewritten and approved it, and none of it reaches customers today.

## What comes next

As pilots start, the data we generate becomes more useful than the data we borrow. Three things are on the roadmap:

- **Scenario tuning.** If most crews take the same wrong turn in the same state, either the scenario is unclear or the gap is real. Either way, combined decision data tells the physician who wrote it where to look.
- **Benchmarks between services.** A service will be able to compare its group results with those of similar services, using the same minimum of five people.
- **Spotting skill fade.** Repeated runs show which skills slip between training blocks, so refreshers go where they're needed rather than on a fixed calendar.

We are also asking for access to larger EMS datasets, such as NEMSIS in the United States, to check that scenarios match how calls actually present. We'll only use those under their terms, and we'll say so when we do.

## What we won't do

Three lines we don't cross:

- No real patient information goes into scenarios or AI prompts.
- AI doesn't decide scores, and we don't train AI models on learner records.
- Reports don't show individuals. Groups of fewer than five are hidden.

## Why this is a strength, not a footnote

Most training tools for paramedics are either content libraries or high-end mannequin systems. Content libraries can show that a module was finished. Mannequin labs record rich data, but only for the few hours a crew spends in the lab. Imedica sits in the middle: frequent, low-cost practice that leaves a detailed decision record every time.

That record is the advantage, for three reasons:

1. **It's specific.** Knowing which decision, in which patient state and how long it took is far more useful than a percentage.
2. **It builds up.** Every run adds to the record, so the product improves as it's used, and an imitator starts without that history.
3. **Services can trust it.** Because privacy is built in (hashed identities, week-level dates, groups of at least five), a service can say yes without a long negotiation over individual surveillance. In our experience, data a service agrees to share is worth more than data it puts up with.

## For training leads

When you assess any platform, ask it to show you one learner's decision record and one team report from the same group. If it can't show the first, it can't explain a score. If the second identifies individuals, expect resistance from your staff.

## The takeaway

Today, data makes Imedica training more realistic and makes the results measurable. Next, the combined decision records of Canadian paramedics, gathered with privacy built in, will show where training is weak and whether it's working. That, more than any dataset count, is what we're building.

*Written by the Imedica team, October 2026. Plans described here are intentions, not commitments with dates.*
