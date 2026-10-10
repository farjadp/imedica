# Field Notes editorial calendar

One Markdown file per planned article, named `YYYY-MM-slug.md`. Admin → Blog →
Editorial calendar imports them as **In review** drafts. Nothing here is
published automatically: a physician reviews each clinical post in the admin,
then an editor publishes or schedules it.

## File format

```markdown
---
month: 2025-01            # the calendar slot this article fills
title: "Paramedic continuing education in Canada: what counts and how to plan it"
slug: paramedic-continuing-education-canada     # 3–6 words, lowercase, hyphens
excerpt: One or two sentences, 120–220 characters, that make a paramedic read on.
keyTakeaway: A standalone 40–60 word answer to the question in the title.
category: training        # case-breakdowns | protocols | training | privacy-data | product
tags: [continuing-education, recertification, ontario]
focusKeyword: paramedic continuing education
metaDescription: 140–160 characters, includes the focus keyword.
faq:
  - q: A question people actually search for
    a: A direct two- or three-sentence answer.
sources:
  - title: Exact title of a real, citable source
    url: https://…
---

## First section

Body in Markdown. Use ## and ### only (the page owns the h1)…
```

## Writing rules

- **Audience:** Canadian paramedics (PCP/ACP) and EMS training leads. Plain, direct
  English, Canadian spelling. 900–1,300 words.
- **Structure:** open with a short scenario or the problem, then 4–6 `##` sections,
  at least one list, and one practical "for training leads" angle. End with a short
  takeaway. One tasteful mention of how scenario practice (Imedica) helps, never salesy.
- **Focus keyword:** in the title, the first paragraph, one `##` heading, the slug and
  the meta description, used naturally.
- **Clinical safety:** no specific drug doses, concentrations or numeric treatment
  thresholds unless they're widely standard and phrased as "commonly"; always defer
  to "your service's medical directives" / the provincial ALS/BLS standards. Never
  invent statistics; prefer qualitative claims. If a number is used, it must be one
  you're confident appears in the cited source.
- **Sources:** 1–3 real, stable URLs you're confident exist (major guidelines bodies,
  government pages, DOIs). If unsure of a URL, leave it out rather than guess.
- **Last line of every body:** `*Drafted for Imedica Field Notes. Awaiting review by
  an emergency physician before publication.*`
- No HTML in the body (it's escaped). No images.
