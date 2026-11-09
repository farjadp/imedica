# SEO baseline audit: www.imedica.tech

Checked 2026-11-08 against the live site and `content/blog/`. No Search Console, Analytics or rank-tracking access was connected, so rankings and impressions are **unknown**, not zero.

## What's already right

- `robots.txt` allows all crawlers (including GPTBot, ClaudeBot, PerplexityBot, Google-Extended, since none is blocked) and disallows only `/admin`, `/app`, `/run`, `/api`, `/invite`, `/reset-password`, `/blog/preview`. Staging serves `Disallow: /`.
- Sitemap at `/sitemap.xml`: 56 URLs, all 29 posts, category pages, `lastModified` on posts.
- Posts: one H1, `lang="en-CA"`, self-canonical on `www`, unique title and meta description, `BlogPosting` + `BreadcrumbList` + `FAQPage` JSON-LD, `citation` from front-matter sources, visible "Updated" date.
- Responses are fast (TTFB 0.13–0.7 s from Toronto-area curl). `http://` and apex redirect to `https://www`.
- Content: 29 posts, 955–1,427 words each, each with a key takeaway, 3 FAQs and 1–3 sources. No thin or duplicate posts. Focus keywords don't overlap. The 5 data posts (PTB-XL, EMS-MCQA, EMSDialog, inventory, what-we-do) are related but each targets a separate entity.

## Problems

| # | Issue | Impact | Evidence |
|---|---|---|---|
| 1 | **Zero in-body internal links in all 29 posts** (and zero outbound links in the body; sources sit only in the source list). The only links between posts are the "Keep reading" cards. | High | grep of `](/` and `](http` across `content/blog/*.md` = 0 |
| 2 | **No og:image anywhere.** No cover images, no `opengraph-image` route. Shares on LinkedIn/Slack/X show a bare text card; `BlogPosting.image` is empty, which makes posts ineligible for Google's article rich results with images and Discover. | High | no `og:image` in `/` or any post; no `opengraph-image*` in `src/app` |
| 3 | **No Organization / WebSite JSON-LD on the home page**, and the `publisher` on posts has no logo or `sameAs`. AI engines and Google's Knowledge Graph have nothing to anchor "Imedica, by Ashavid Inc." to. A web search for "Imedica paramedic Ashavid" today returns nothing about us. | High (GEO) | home page has no JSON-LD |
| 4 | **Author is "Imedica Clinical Team" typed as `Person`.** That is an organisation, not a person, so it gives no E-E-A-T signal and is technically wrong schema. No reviewer field exists. | Medium | `seo.ts` `articleLd` |
| 5 | **Missing canonical on `/`, `/for-services`, `/how-it-works`, `/about`** (and probably other marketing pages without their own `alternates`). Low risk today, but a stray `?utm=` or the apex host could create duplicates. | Medium | live HTML, see table below |
| 6 | **Calendar engine stops at 2026-12** (`CALENDAR.end`). Any post filed for January 2027 or later won't appear in Admin → Editorial calendar. Two posts a week also needs `extra: true` because the engine has one regular slot per month. | Medium (blocks the plan) | `src/server/blog/calendar.ts` |
| 7 | **Thin meta descriptions on key buyer pages**: `/for-services` 99 chars, `/how-it-works` 114, category pages ~60. Home is 183 (truncated in SERPs). | Medium | live HTML |
| 8 | **Apex `https://imedica.tech` fails TLS** (registrar DNS record). Anyone typing the bare domain, and any backlink to it, hits an error. Farjad is fixing; re-check after. | Medium | known issue; not touched |
| 9 | **No `llms.txt`** (404). Low impact on its own; see the GEO plan for why we still add one. | Low | `/llms.txt` 404 |
| 10 | **Posts don't link to `/sources`** or name the standard version (e.g. "ALS PCS v5.4, in force 2 June 2025") in the body. Version-stamped facts are what AI answers quote. | Medium (GEO) | body grep |

Marketing page check:

| Page | Title | Canonical | Meta desc |
|---|---|---|---|
| `/` | Imedica — Decision training for Canadian paramedics | missing | 183 c (too long) |
| `/product` | The product · Imedica | ok | 159 c |
| `/for-services` | For services · Imedica | missing | 99 c |
| `/how-it-works` | How it works · Imedica | missing | 114 c |
| `/pricing` | Pricing · Imedica | ok | 127 c |
| `/about` | About · Imedica | missing | 130 c |
| `/sources` | Sources & references · Imedica | ok | 160 c |
| `/blog` | Field Notes · Imedica | ok | 155 c |

Titles on buyer pages carry no keyword ("For services · Imedica"). "Paramedic training for EMS services · Imedica" would say what the page is.

## Top 10 fixes by impact

1. **Internal links in every post**: 3–5 contextual links each to related posts, plus one to `/product` or `/for-services` and one to `/sources` where a guideline is cited. Do it as part of the refresh pass in the calendar (no code needed; edit markdown, re-import).
2. **Default OG image** (site-wide `opengraph-image`) and a per-post fallback, so every share and every `BlogPosting` has an image. *Code fix, done in this branch (static brand card).*
3. **Organization + WebSite JSON-LD** on the home page, and the same Organization (with logo) as `publisher` on posts. *Code fix, done in this branch.*
4. **Fix the author schema**: when the author is the team, emit `Organization`; when a named physician reviews, add them as `reviewedBy` (needs a reviewer field; not done here).
5. **Extend `CALENDAR.end` to 2027-12** so the 12-week plan shows up in Admin. *Code fix, done in this branch.*
6. **Canonical on every marketing page** (set `alternates.canonical: "/"` on home and add to the four missing pages). *Code fix, done in this branch for the four pages found.*
7. **Rewrite meta descriptions and titles on `/for-services`, `/how-it-works`, home** to 140–160 chars with the buyer keyword. *Done in this branch for `/for-services`, `/how-it-works` and home.*
8. **Fix apex TLS** (Farjad, at the registrar). Then confirm `https://imedica.tech` → 301 → `https://www.imedica.tech`.
9. **Connect Google Search Console** (Adspirer or Supermetrics: both are installed but not authorised) and submit the sitemap; add Bing Webmaster Tools (Copilot and ChatGPT search both lean on Bing's index).
10. **Add `/llms.txt`** with a plain description of Imedica and links to the pillar pages and `/sources`. *Done in this branch as a static file.*

## What to track per article

Impressions, clicks, average position and CTR for the focus keyword (Search Console, from week 2); whether ChatGPT, Perplexity and Google AI Overviews cite the page for its question (manual check at 4 and 12 weeks, logged in `docs/content/geo-aeo-plan.md`); "Book a demo" / download clicks from the post. Refresh any post with impressions but CTR under 1% after 8 weeks (title/description first), and any post whose standard version changes (e.g. ALS PCS 5.5).
