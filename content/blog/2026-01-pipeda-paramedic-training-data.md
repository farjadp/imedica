---
month: 2026-01
title: "PIPEDA training data: what paramedic services owe their own staff"
slug: pipeda-paramedic-training-data
excerpt: "Scenario scores, attempt logs and remediation notes are personal information. Here is how paramedic services can use training data well without exposing the people behind it."
keyTakeaway: "Paramedic training records are personal information about staff. Under PIPEDA and Ontario's PHIPA, services should collect only what training needs, separate identity from performance data, report on groups rather than individuals where possible, and hold vendors to the same standard in writing before any data leaves the building."
category: privacy-data
tags: [pipeda, phipa, privacy, training-data, ontario, vendors]
focusKeyword: PIPEDA training data
metaDescription: "How paramedic services should handle PIPEDA training data and Ontario PHIPA duties: de-identification, group reporting and the questions to ask every vendor."
faq:
  - q: Is paramedic training data covered by PIPEDA?
    a: "It depends on who holds it and why. Training records are personal information about employees, and PIPEDA applies to commercial vendors handling them. Public-sector services are usually governed by provincial public-sector privacy law, so check with your privacy officer which statute applies."
  - q: Does PHIPA apply to training scenarios?
    a: "PHIPA governs personal health information about patients. Scenarios built from real calls can carry patient information if they are not properly de-identified, so strip identifying details before a call becomes a case."
  - q: What should we ask a training vendor about privacy?
    a: "Ask where data is stored, who can see identified records, how identity is separated from performance data, how small groups are protected in reports, and how data is deleted when the contract ends. Get the answers in the contract."
sources:
  - title: The Personal Information Protection and Electronic Documents Act (PIPEDA) — Office of the Privacy Commissioner of Canada
    url: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/
  - title: Personal Health Information Protection Act, 2004, S.O. 2004, c. 3, Sched. A
    url: https://www.ontario.ca/laws/statute/04p03
  - title: Information and Privacy Commissioner of Ontario
    url: https://www.ipc.on.ca/
---

A training lead exports last quarter's scenario results to a spreadsheet so she can plan remediation. Names in column A, scores in column B, a free-text "concerns" column at the end. Within a week, that file has been emailed to two supervisors, saved to a shared drive and printed for a meeting. Nobody meant any harm. But PIPEDA training data rules, and the plain expectations of the paramedics in that spreadsheet, were left behind somewhere around the second forward.

Training data feels low-stakes next to patient charts. It is not. A record that says a named paramedic missed a STEMI in a simulation, or needed three attempts at a paediatric airway case, can affect promotion, discipline and how colleagues see them. Handling it badly also undermines the thing training depends on: people being willing to get things wrong in practice.

## Which law actually applies

Canadian privacy law is layered, and services should get advice from their own privacy officer rather than assume. In broad terms:

- **PIPEDA** is the federal law for private-sector organizations handling personal information in commercial activity. It commonly applies to the vendors that host training platforms, even when the service itself is public.
- **Provincial public-sector privacy laws** usually govern municipal and regional paramedic services as employers.
- **Ontario's PHIPA** governs personal health information about patients. It matters for training whenever real calls are turned into cases.

The overlap is where problems start. A scenario built from last month's motor vehicle collision may carry enough detail (location, time, injuries, age) to identify a patient. Under PHIPA, that is not a training asset until it has been properly de-identified.

The principles behind PIPEDA are a useful baseline whichever law governs you: be accountable, identify purposes, limit collection, limit use and disclosure, safeguard what you keep, and be open with the people the data is about.

## Collect less, and say why

Most training programs collect more than they use. Before adding a field or a report, ask what decision it supports.

- If the goal is to see whether a cohort can recognise sepsis, you need aggregate performance on sepsis cases, not every click.
- If the goal is individual remediation, the paramedic and their educator need detail; their platoon chief may not.
- Free-text "concerns" fields are the riskiest data you hold. They drift into opinion and rarely get deleted.

Tell staff, in plain language, what is collected, who sees it and how long it is kept. A one-page notice at onboarding does more for trust than a long policy nobody reads.

## De-identifying PIPEDA training data: the rule of five

De-identification means removing or transforming data so it can no longer reasonably be linked to a person. For staff training data, that usually involves three moves.

### Separate identity from performance

Store who someone is apart from how they did. Performance records should carry a pseudonymous key, not a name or employee number. Only a small, defined group should be able to re-link the two, and only for a stated purpose such as individual coaching.

### Report on groups, not individuals

Aggregate reports should only show results for groups large enough that no one can be singled out. A common rule is a minimum group size of five: if fewer than five people sit in a cell (one station, one shift, one rare scenario), suppress or merge it. A "group average" for three people on a night shift is effectively three individual scores.

### Watch for indirect identifiers

Rank, station, start date and rare certifications can identify someone even without a name. If there is only one ACP on a crew at a small base, "ACP results at Station 4" is a name by another route.

## What to ask vendors

When a third party hosts your training data, you remain accountable for it. Ask these questions before signing, and get the answers in the contract, not just the sales deck:

1. Where is the data stored, and does it leave Canada?
2. How is identity separated from performance and content data?
3. Who at the vendor can see identified records, and is that access logged?
4. What is the minimum group size in aggregate reports, and can we change it?
5. Is our data used to train models or benchmark other customers?
6. How do we get a full export, and how is data deleted at contract end?
7. How and when will you notify us of a breach?

As one example of how this can be built, Imedica keeps identity, scenario content and analytics in separate database schemas. They are joined only through a keyed one-way hash, so analytics can count and compare performance without holding names, and re-linking requires a key that sits outside the analytics layer. Other designs can meet the same goal. What matters is that a vendor can explain theirs clearly.

## For training leads: a practical checklist

You do not need a privacy team to raise the standard. Start with the habits that cause most leaks.

- **Stop emailing exports.** Share reports through a system with access control, and expire links.
- **Default to aggregate.** Supervisors see cohort trends; educators see individuals they are coaching.
- **Apply the group-of-five rule** to any slide, dashboard or memo that leaves the education team.
- **De-identify before you write a case.** Change ages, locations, times and any unusual detail before a real call becomes a scenario.
- **Set a retention period** and actually delete old records, especially free-text notes.
- **Separate learning from discipline.** If scenario results can be pulled into performance management, say so upfront, and expect people to practise less honestly.

That last point matters most. Scenario-based practice works because people can make the wrong call in a safe place and talk about why. Training platforms such as Imedica are built around that idea, but the safety is only real if the data behind it is handled with care.

## The takeaway

PIPEDA training data obligations, and Ontario's PHIPA where real calls are involved, come down to a few habits: collect what you need, keep identity apart from performance, report on groups of five or more, and make vendors prove their design. Do that and staff can trust the training record, which is the only way they will use it to get better.

*Drafted for Imedica Field Notes. Awaiting review by an emergency physician before publication.*
