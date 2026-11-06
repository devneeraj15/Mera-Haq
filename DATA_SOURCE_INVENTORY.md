# Data Source Inventory

Investigated 2026-11-06 from the ingestion host with User-Agent `MeraHaq-SchemeIndexer/1.0 (+https://github.com/devneeraj15/Mera-Haq; respects robots.txt)`. The machine-readable policy is `data/sources/domains.json`. The latest run's results are in `data/sources/discovery-report.json` and `data/reports/ingest-log.json`.

## 1. Sources named in the brief

| Source | APIs / structured data | robots.txt | Terms / access | Decision |
|---|---|---|---|---|
| myscheme.gov.in / search.myscheme.gov.in | Scheme pages are client-rendered from a keyed API. `sitemap-0.xml` lists only 38 static pages, no scheme URLs | `Allow: /` | **Terms of Use: "The use of any software (e.g. bots, scraper tools) … to access, monitor, or copy the platform pages is prohibited unless expressly authorized"** | **Not ingested** (BLOCKED_BY_TERMS). Linked for users under its Hyperlinking Policy. Ingesting it needs written authorisation from myScheme / DIC |
| india.gov.in/my-government/schemes | – | `Crawl-delay: 10` (readable once) | Akamai returned **HTTP 403 "Access Denied"** to automated requests (page and sitemap) | **Not ingested** (BLOCKED_BY_WAF). Bot protection is not bypassed |
| egazette.gov.in | Search UI only | – | **TLS chain could not be verified** | **Not ingested** (SOURCE_UNAVAILABLE). Certificate verification is never disabled. GR/Gazette references are recorded only when an official scheme page cites them (`governmentOrderRef`) |
| mahadbt.maharashtra.gov.in | Home page links every scheme to a public `/SchemeData/SchemeData?str=…` page with stable sections (Department, Overview, Benefits, Eligibility, Renewal Policy, Documents Required) | none (404) | No restriction found | **Ingested**: 55 scheme pages, auto-extracted |
| data.gov.in | OGD API (`api.data.gov.in`) needs a registered key | **`Disallow: /`** | API key required | **Not ingested** (BLOCKED_BY_ROBOTS). A future connector can use `DATA_GOV_IN_API_KEY` (not implemented: no key available and no scheme-eligibility dataset identified) |

## 2. Department and scheme portals

| Host | Publisher | Status | Notes |
|---|---|---|---|
| financialservices.gov.in | Dept. of Financial Services | Ingested | APY, PMJDY, PMJJBY, PMSBY, PMMY, Stand-Up India pages |
| www.pmuy.gov.in | MoPNG | Ingested | About (eligibility, documents, benefits) + FAQ |
| maandhan.in | Ministry of Labour & Employment | Ingested | PM-SYM and NPS-Traders eligibility blocks. `/shramyogi` returned 404 |
| pmvishwakarma.gov.in | Ministry of MSME | Ingested | Guidelines PDF v30.0 (over 5 MB, so the PDF cap was raised to 15 MB) + FAQ |
| pmsvanidhi.mohua.gov.in | MoHUA | Ingested (needs review) | Only an older FAQ PDF captured ("implemented up to March, 2022"). Operational guidelines not yet ingested |
| www.standupmitra.in | SIDBI / DFS | Ingested | Scheme guidelines |
| www.mudra.org.in | MUDRA Ltd | Ingested | FAQ (supplementary source) |
| pmjdy.gov.in | DFS | Ingested | Scheme details |
| www.startupindia.gov.in | DPIIT | Captured, not curated | Pages mix many sub-schemes under generic headings. Not curated, to avoid mis-attributing benefits |
| scholarships.gov.in | NSP | Captured, **no usable text** | Client-rendered (29 characters of text) |
| jansuraksha.gov.in | DFS | Captured, **no usable text** | Client-rendered (261 characters) |
| wcd.gov.in | MoWCD | Captured, index pages only | Scheme detail content is in PDFs/JS. Not yet curated |
| tribal.nic.in | Ministry of Tribal Affairs | Reachable | Scholarship page URL guessed from nav returned 404. Not yet curated |
| minorityaffairs.gov.in, socialjustice.gov.in, depwd.gov.in, agriwelfare.gov.in, pmfby.gov.in, nrega.nic.in, apprenticeshipindia.gov.in, pmsuryaghar.gov.in | various | Reachable, not curated | Mostly client-rendered or index-only home pages. Candidates for the next ingestion round |
| pmkisan.gov.in, pmegp.msme.gov.in | DA&FW, MoMSME | **TLS failure** | Server chains to a root not in the host's trust store, even after AIA intermediate fetching. Not ingested |
| pmjay.gov.in | NHA | **Timeout** | Connection timed out. `nha.gov.in/PM-JAY` is disallowed by robots.txt |
| eshram.gov.in | MoLE | HTTP 504 | Not ingested |
| pmayg.nic.in, nsap.nic.in, www.pmkvyofficial.org, www.npscra.nsdl.co.in | various | DNS failure | Host not resolvable from the ingestion host |

## 2a. Fiscal sources (impact model)

| Host | Status | Notes |
|---|---|---|
| cag.gov.in + its document CDN (d1jmc0u14z2tmp.cloudfront.net) | **Ingested** | Press release on CAG Report No. 6 of 2026 (Union Government accounts FY 2024-25), linked from cag.gov.in. Figures quoted in `data/impact/fiscal-context.json` and verified against the snapshot by a test |
| www.indiabudget.gov.in | BLOCKED_BY_WAF | HTTP 403 to automated requests, including robots.txt. Scheme-wise BE / Actuals must be downloaded by a person |
| www.pib.gov.in, www.sansad.in | BLOCKED_BY_WAF | HTTP 403 to automated requests |
| cga.nic.in, rajyasabha.nic.in | SOURCE_UNAVAILABLE | Connection timed out |

## 3. Directly seeded pages (latest snapshot)

| URL | Type | Text chars | Captured | Cited by records |
|---|---|---|---|---|
| https://www.pmuy.gov.in/about.html | HTML | 6755 | 2026-11-06 | 1 |
| https://www.pmuy.gov.in/faq.html | HTML | 18494 | 2026-11-06 | 1 |
| https://maandhan.in/ | HTML | 3275 | 2026-11-06 | 2 |
| https://pmvishwakarma.gov.in/cdn/MiscFiles/eng_v30.0_PM_Vishwakarma_Guidelines_final.pdf | PDF | 117796 | 2026-11-06 | 1 |
| https://pmvishwakarma.gov.in/Home/FAQ | HTML | 13335 | 2026-11-06 | 1 |
| https://pmsvanidhi.mohua.gov.in/Default/ViewFile/?id=FAQEng.pdf&path=MiscFiles | PDF | 7031 | 2026-11-06 | 1 |
| https://pmsvanidhi.mohua.gov.in/Home/Schemes | HTML | 1212 | 2026-11-06 | 1 |
| https://www.standupmitra.in/Home/SchemeGuidelines | HTML | 12484 | 2026-11-06 | 1 |
| https://www.mudra.org.in/FAQ | HTML | 37948 | 2026-11-06 | 1 |
| https://pmjdy.gov.in/scheme | HTML | 1849 | 2026-11-06 | 1 |
| https://financialservices.gov.in/atal-pension-yojana-apy | HTML | 3179 | 2026-11-06 | 1 |
| https://financialservices.gov.in/pradhan-mantri-jan-dhan-yojana-pmjdy | HTML | 3370 | 2026-11-06 | 1 |
| https://financialservices.gov.in/pradhan-mantri-jeevan-jyoti-bima-yojana-pmjjby | HTML | 2613 | 2026-11-06 | 1 |
| https://financialservices.gov.in/pradhan-mantri-suraksha-bima-yojana-pmsby | HTML | 2917 | 2026-11-06 | 1 |
| https://financialservices.gov.in/pradhan-mantri-mudra-yojana-pmmy | HTML | 2925 | 2026-11-06 | 1 |
| https://financialservices.gov.in/stand-india-scheme-supi | HTML | 3805 | 2026-11-06 | 1 |
| https://www.standupmitra.in/Home/FAQs, startupindia ×2, jansuraksha FAQ, wcd ×3, financialservices schemes index | HTML | – | 2026-11-06 | 0 (captured, not curated) |
| https://scholarships.gov.in/scholarshipEligibility | HTML | 29 | 2026-11-06 | 0 (client-rendered) |
| https://tribal.nic.in/ScholarshiPh.aspx | – | – | not captured (404) | 0 |

Plus **55 MahaDBT scheme pages** (all captured, listed in `data/sources/discovered-urls.json`).

## 4. Non-`.gov.in` hosts accepted as official

`officialUrlInfo()` (engine) and `url_problem()` (validator) accept `*.gov.in`, `*.nic.in` and these reviewed hosts only:

| Host | Why it counts as official |
|---|---|
| maandhan.in | Footer: "Website Content owned and managed by Ministry of Labour & Employment" |
| www.mudra.org.in | MUDRA Ltd, a wholly-owned subsidiary of SIDBI under DFS |
| www.standupmitra.in | Stand-Up India portal run by SIDBI. Linked from financialservices.gov.in |
| pmvidyalaxmi.co.in | PM-Vidyalaxmi portal of the Department of Higher Education (not currently used by any record) |

## 5. How to add a source

1. Check robots.txt and the Terms of Use. Add the host to `domains.json` as `ALLOWED` only if both permit automated access.
2. Add the URL to `seed-urls.json` (or a listing with a reviewed `linkPattern`).
3. `python scripts/pipeline/ingest_schemes.py`, then curate in `data/curation/*.json` with a verbatim `evidence.quote` for every field.
4. `python scripts/pipeline/run_all.py --offline` and check `data/reports/review-queue.json`.
