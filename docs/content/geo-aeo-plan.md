# GEO / AEO plan

Goal: when a paramedic, student or training lead asks ChatGPT, Perplexity, Copilot or Google AI Overviews a question in our clusters, the answer cites imedica.tech.

## Method and its limit

I don't have direct access to ChatGPT, Perplexity or Google AI Overviews from this session. As a proxy I ran each query through an AI-synthesised web search (US-located) on 2026-11-08 and recorded which domains the answer cited. That is close to how Perplexity and ChatGPT search build answers, but it isn't the same index. **Farjad or a teammate should repeat the 10 queries by hand in ChatGPT (search on), Perplexity and Google (Canadian IP) and fill in the last column.** Re-check at 4 and 12 weeks after each related post goes live.

## Top 10 queries: who gets cited now

| # | Query | Cited in the proxy answer | Imedica cited? | Our page |
|---|---|---|---|---|
| 1 | Ontario ALS PCS medical directives | ontario.ca PDFs, rppeo.ca (OBHG companion + memo), cepcp.myobh.ca pocket guides, lhsc.on.ca | No | ontario-als-pcs-explained (17 Nov) |
| 2 | AEMCA exam practice questions | practicetestgeeks.com (×9), ontario.ca exam page, skool.com, copr.ca, Examzify | No | aemca-exam-study-plan (10 Nov) |
| 3 | How to study for the AEMCA exam | Medic Blueprint FAQ, ontario.ca, then off-topic exam pages (insurance, trades) | No | aemca-exam-study-plan |
| 4 | PCP vs ACP Ontario | lhsc.on.ca (SWORBHP), Peel/Ottawa/Toronto paramedic association pages, ontario.ca | No | pcp-vs-acp-ontario (12 Nov) |
| 5 | Paramedic CME Ontario requirements | lhsc.on.ca, ottawa.ca, prehospitalmedicine.ca, ontarioparamedic.ca | No | refresh paramedic-continuing-education-canada |
| 6 | STEMI bypass Ontario criteria | corhealthontario.ca (2015 protocol), Cambridge/CJEM, msdsb.net, cepcp.myobh.ca | No | stemi-bypass-ontario-criteria (19 Nov) |
| 7 | 2025 AHA CPR guideline changes for EMS | jems.com, cpr.heart.org highlights, pocketprep, reachmd, vendor blogs | No | 2025-aha-cpr-guidelines-paramedics (26 Nov) |
| 8 | Ontario TOR (termination of resuscitation) | unityhealth.to, sunnybrook.ca, rppeo memo, ontario.ca PDF, lakeridgehealth pocketbook | No | termination-of-resuscitation-rule (1 Dec) |
| 9 | Paramedic scenario practice app Canada | apps.apple.com (Paramed Mastery, ParaGuide), simulationcanada.ca, hmpglobal (ParamediSIM) | No | /product, /download (after App Store approval) |
| 10 | EMS training software / scenario-based assessment | vrpatients.com, laerdal.com, simtutor.com, ems1.com, Pitt MedDbriefer | No | scenario-based-training-paramedic-services (24 Nov), /for-services |

Brand check: a search for "Imedica paramedic decision training Ashavid" returned nothing about us. The engines don't know the entity yet.

Pattern: answers cite **primary documents** (ontario.ca, base hospitals) for facts, and **whoever explains them in plain HTML** for structure. There is no plain-HTML explainer for most Ontario topics. That's the opening.

## What we change

### On every post (writing rules, add to `content/blog/README.md`)

1. **Answer first.** The `keyTakeaway` (40–60 words) is the direct answer to the title question, written so it reads correctly if quoted alone. It's already rendered and used as the `BlogPosting.description`.
2. **Version-stamp facts.** "ALS PCS v5.4, in force 2 June 2025" rather than "the current standards". Engines prefer dated, attributable statements, and it ages honestly.
3. **One quotable sentence per H2**: a plain declarative fact with its source named in the sentence ("SWORBHP's crew policy says the ACP must attend when…").
4. **Question-shaped H2s** where the reader would ask one (matches PAA and how engines split answers).
5. **FAQ front-matter → FAQPage schema** (already wired). 3–5 questions taken from People Also Ask and the proxy answers above.
6. **Internal links** to the cluster pillar and to `/sources`.
7. **Freshness**: when a standard changes, update the post and let `dateModified` move. Never change the published date.

### Entity consistency

- Same one-line description everywhere: *"Imedica is decision-training software for Canadian paramedics, built by Ashavid Inc. in Ontario: short emergency scenarios scored against physician-written rules aligned to the Ontario ALS and BLS Patient Care Standards."* Use it on the home page, About, App Store listing, LinkedIn, Crunchbase, and in `llms.txt`.
- **Organization JSON-LD** (name Imedica, legalName Ashavid Inc., url, logo, `sameAs` for LinkedIn / App Store / Google Play once live) on the home page, reused as `publisher` on posts. *Added in this branch; `sameAs` is left for Farjad to fill with the real profile URLs.*
- Don't say "Imedica Health", "iMedica", "IMedica" interchangeably. The App Store name is "iMedicaApp"; the site is "Imedica". Pick one written form for prose (Imedica) and say "the Imedica app" for the app.
- Earn a few third-party mentions engines trust: OBHG/base-hospital education newsletters, Paramedic Association of Canada, college paramedic programs (Durham, Centennial, Fanshawe), CJEM letters. One citation from an authority domain outweighs ten posts.

### llms.txt: yes

Google says it ignores `llms.txt`, and no major engine has committed to it. We add it anyway because it costs one static file, some agents and IDE assistants do read it, and it's a clean place to state the entity description and point at the pillar pages and `/sources`. We don't expect ranking impact. *Added in this branch at `public/llms.txt`.*

### Crawler access

`robots.txt` allows everything public, including GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot and Google-Extended. Keep it that way for the marketing site and blog. (If Farjad ever wants to block model *training* but keep *search* citation, block `GPTBot` and `Google-Extended` only, never `OAI-SearchBot`, `PerplexityBot` or `Googlebot`.)

### Bing

ChatGPT search and Copilot rely heavily on Bing's index. Verify the site in **Bing Webmaster Tools**, submit the sitemap, and enable IndexNow later if publishing frequency justifies it.

## Tracking sheet (fill in by hand)

| Query | Date | ChatGPT cites us? | Perplexity cites us? | Google AIO cites us? | Notes |
|---|---|---|---|---|---|
| (the 10 above) | | | | | |
