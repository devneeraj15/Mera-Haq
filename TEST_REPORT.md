# Test Report

Run on 2026-11-06 on Windows 11, Node 22.11.0, Python 3.11.4, Chrome (stable channel), against the dataset in `data/schemes.json` (66 schemes). Every number below comes from an actual run. Reproduce with the commands in README.md §Testing.

## Summary

| Suite | Command | Result |
|---|---|---|
| Engine, API contract and impact-model unit tests | `npm run test:unit` | **37 / 37 passed** (26 engine, 6 API contract, 5 impact model) |
| Pipeline unit tests | `npm run test:pipeline` | **16 / 16 passed** (includes CAG quote verification) |
| End-to-end (Playwright, desktop 1280×800 + Pixel 5 mobile) | `npx playwright test` | **26 / 26 passed** (13 journeys × 2 viewports) |
| Real-data dry run (18 personas × 66 schemes) | `npm run dryrun` | **210 oracle checks, 0 mismatches, 0 failed evaluations**. 5 suspected false positives flagged, reviewed and found to be heuristic false alarms |
| Production build | `npm run build` | passes. `app.js` 213.6 KiB (67.2 KiB gzip) |
| Data pipeline (offline) | `npm run data:offline` | 66 records: 978 / 978 evidence quotes found in source snapshots (7 VERIFIED, 56 PARTIALLY_VERIFIED, 3 NEEDS_REVIEW) |
| Dependency audit | `npm audit` | 0 vulnerabilities |

## 1. Unit tests (`tests/unit/eligibility.test.js`)
Cover: the 28 + 8 location registry; inclusive age bounds (17/18/40/41); income exactly at the ceiling vs ₹1 above, zero and decimal income; strict "<" ceilings; missing income and gender (never a pass); schemes with no age limit; State vs Central applicability, multiple jurisdictions and unknown State; `anyOf` (SC/ST **or** woman); contradictory rules; closed application window vs eligibility; unverified records; manual-only criteria; location-only matches; explanations; and profile validation for age 0/17/18/23/60/100/150/-1/-30/23.5/"abc"/"1e3"/empty, income negative/1e15/"Infinity"/"NaN"/"12abc"/Indian digit grouping/₹ prefix, enums with HTML, SQL-like strings, Unicode and 5,000-character strings, display-name sanitisation, prototype-pollution keys, unknown fields. Also URL hand-off validation (`javascript:`, `http:`, look-alike domains, credentials) and dataset invariants: unique IDs, every criterion has evidence, all quotes found for trusted records, official URLs, no contradictions, deterministic ordering.

## 2. Pipeline tests (`tests/pipeline/test_pipeline.py`)
Rule extraction (inclusive ceilings, ambiguous `>` text, conditional "For …" lines, OR-alternatives, cross-scheme "also eligible" lines, domicile vs residence, categories including Navbouddha / OPEN+EWS, disability %, amount parsing); fetch security (non-https, non-allow-listed, blocked-by-terms host, 127.0.0.1, 169.254.169.254, credentials in URL, non-443 port); HTML-to-text script stripping; quote normalisation; validator URL rules; contradictions; duplicate detection; published-dataset evidence integrity.

## 3. End-to-end journeys (`tests/e2e/journeys.spec.js`)

| # | Journey | Desktop | Mobile |
|---|---|---|---|
| 1 | Landing loads, navigation works, no console errors, no broken images | ✅ | ✅ |
| 2 | Onboarding: empty submit → errors; age 150 rejected; valid profile → results | ✅ | ✅ |
| 3–6 | 10–20 results shown; search (URL-synced), empty search state, filters, pagination + browser back; scheme detail with sources; enrichment with consent (income ₹2,50,000 + SC → "Likely eligible"); earlier answers preserved; save → saved list → remove | ✅ | ✅ |
| – | Income ₹2,50,001 flips the same scheme to "Not eligible" (1 condition not met) | ✅ | ✅ |
| 7 | Documents checklist: tick persists across reload when "remember" is on; no ID numbers stored | ✅ | ✅ |
| 8 | Apply hand-off: dialog names the official host, says Mera Haq does not submit, Esc closes; offline scheme offers the information page; new tab has `window.opener === null` | ✅ | ✅ |
| 9 | Back/forward, direct deep link, refresh, legacy-route redirects, path-URL SPA fallback (HTTP 200) | ✅ | ✅ |
| 10 | Unknown route, unknown and script-injected scheme IDs, empty saved, no profile; API returns 503 → error + retry recovers | ✅ | ✅ |
| – | Random/hostile input: negative, decimal, exponent, HTML and SQL-like ages rejected; age 0 + Lakshadweep accepted; `<script>` display name and `?q=<img onerror>` inert; tampered storage re-validated | ✅ | ✅ |
| – | Accessibility: skip link is the first Tab stop; every input/select is labelled; dialog traps focus; delete-data works | ✅ | ✅ |
| – | Impact page: CAG figures shown with caveat; spend above allocation rejected; ₹1,000 cr / ₹800 cr / 10% / 25% / ₹10,000 gives ₹5 cr and 5,000 beneficiaries | ✅ | ✅ |
| – | Open Data API page: live metadata via `api/v1/meta.json`; app loads data only through `api/v1/schemes/index.json` | ✅ | ✅ |

Bugs these tests found and that were fixed during the run:
- The skip link was not the first Tab stop because focus moved to `<h1>` on first load.
- The consent checkbox vanished after being ticked, so consent could not be withdrawn.
- The Saved nav link's accessible name ran its count badge into the label ("Saved Schemes1").
- **Router race (found by CI):** filter changes made before the browser delivered `hashchange` reused the previous query, so "Clear all filters" followed quickly by a filter change brought the old search back (CI showed `?q=zzzz-no-such-scheme&level=STATE`, 0 results). Fixed by updating route state synchronously in `navigate()` and merging filters into the live URL. A regression test delays `hashchange` by 400 ms; it fails on the old build and passes on the fix.

## 4. Real-data dry run (Phase 10.5)

Personas are synthetic people (`tests/fixtures/personas.json`). Schemes are the real published records. Expected outcomes (`tests/fixtures/oracle.json`) were written by hand from the quoted source sentences for all 11 Central schemes, plus 8 Maharashtra boundary and category checks, separately from the criteria JSON.

| Persona | Profile | Evaluated (in location) | Likely | Potential | Check source | Need info | Not open | Not eligible | Oracle mismatches | Suspected FP |
|---|---|---|---|---|---|---|---|---|---|---|
| p01 | 23M, Maharashtra, graduate, salaried (brief's example; income not given) | 66 | 4 | 0 | 14 | 41 | 1 | 6 | 0 | 0 |
| p02 | 19F, Maharashtra, Class 12 student, OBC, income 1.8L | 66 | 20 | 4 | 20 | 2 | 1 | 19 | 0 | 1 |
| p03 | 36M, Maharashtra, farmer, OBC, income 1.4L | 66 | 18 | 3 | 20 | 1 | 0 | 24 | 0 | 1 |
| p04 | 24F, Bihar, homemaker, SC, income 1.2L | 11 | 5 | 1 | 2 | 1 | 1 | 1 | 0 | 0 |
| p05 | 29M, Delhi, street vendor, General, income 2.2L | 11 | 5 | 0 | 3 | 0 | 0 | 3 | 0 | 0 |
| p06 | 21F, Karnataka, diploma student, disability 45% | 11 | 5 | 1 | 2 | 1 | 1 | 1 | 0 | 1 |
| p07 | 45M, Tamil Nadu, artisan, self-employed | 11 | 3 | 0 | 2 | 0 | 1 | 5 | 0 | 0 |
| p08 | 17M, Uttar Pradesh, school student (minor) | 11 | 0 | 0 | 2 | 1 | 0 | 8 | 0 | 0 |
| p09 | 18F, Gujarat, student (age boundary 18) | 11 | 5 | 1 | 2 | 1 | 1 | 1 | 0 | 0 |
| p10 | 40M, West Bengal, trader (age boundary 40) | 11 | 5 | 0 | 2 | 0 | 0 | 4 | 0 | 0 |
| p11 | 41M, Kerala, trader (one year above 40) | 11 | 2 | 0 | 2 | 0 | 0 | 7 | 0 | 0 |
| p12 | 60F, Punjab, retired | 11 | 2 | 1 | 2 | 1 | 1 | 4 | 0 | 0 |
| p13 | 70M, Rajasthan, retired (age boundary 70) | 11 | 1 | 0 | 2 | 0 | 1 | 7 | 0 | 0 |
| p14 | 71F, Ladakh (UT), retired | 11 | 1 | 1 | 2 | 1 | 1 | 5 | 0 | 0 |
| p15 | 30 transgender, Jammu and Kashmir (UT), ST, unemployed | 11 | 4 | 1 | 2 | 1 | 1 | 2 | 0 | 0 |
| p16 | 25, gender not given, Andaman and Nicobar Islands, unemployed | 11 | 4 | 2 | 2 | 1 | 1 | 1 | 0 | 0 |
| p17 | 22M, Maharashtra domicile, SC, UG student, income exactly 2,50,000 | 66 | 17 | 4 | 20 | 2 | 1 | 22 | 0 | 1 |
| p18 | 22M, Maharashtra domicile, OBC, UG student, income 2,50,001 | 66 | 15 | 4 | 20 | 2 | 0 | 25 | 0 | 1 |

Personas outside Maharashtra see only the 11 Central schemes, because State-specific data exists only for Maharashtra (DATA_QUALITY_REPORT.md §8).

### False positives / negatives found and fixed during dry runs
The first runs found **real errors**. They were fixed at the source (extractor or curation), not by changing expectations:

| # | Problem | Cause | Fix |
|---|---|---|---|
| FP-1 | Freeship (SC only) was "Likely eligible" for a general-category persona | "Student category **should be** Scheduled caste…" did not match the category pattern | Pattern extended (`category should/shall/must be`, `Applicable for ST only`) |
| FP-2 | Many MahaDBT schemes were "Likely eligible" on location alone while substantive conditions were unverifiable | Location criteria counted as evidence | Engine: location-only passes with manual conditions → `NEEDS_MANUAL_VERIFICATION` |
| FP-3 | Maharashtra Minority Scholarship was "Likely eligible" for non-minority personas | Minority condition is stated in the Overview, not in the Eligibility list | Human override with a verbatim Overview quote (3 schemes). The fourth (Part II) lists no communities, so it was sent to the review queue instead of guessing |
| FP-4 | Freeship "income above Rs. 250000 to unlimited" was not enforced (p17 at exactly ₹2,50,000 matched) | Lower bounds were left as manual | Extractor: explicit "income above X" → `gt X`. Tribal Freeship override from its Overview |
| FN/FP-5 | "less than or equal to Rs. 2,50,000" was parsed as strictly less than | Pattern order | Inclusive wording is checked first. Unit-tested |
| FP-6 | "For Non Professional Courses … upto 1 lakh" became a mandatory ceiling for every course | Conditional statements | Conditional / OR / cross-scheme lines stay manual |

### Remaining flags (reviewed, not false positives)
- `pmuy-ujjwala` for OBC and General women (p02, p06): the PMUY household list also includes "Poor Household as per 14-point declaration", so caste is not required. The condition is shown as "confirm yourself".
- `mh-minority-scholarship` for male personas (p03, p17, p18): "30% scholarship is reserved for girls" is a quota, not a girls-only rule. These results are Potential matches pending the religion answer.

### Known limitations (not hidden)
- 53 MahaDBT records are auto-extracted (PARTIALLY_VERIFIED; 2 more MahaDBT records are in the review queue). Their non-pattern conditions are shown verbatim as "confirm yourself". There are more such conditions than machine rules.
- The oracle covers 11 Central and 8 Maharashtra scheme/persona pairs in depth. The other Maharashtra pairs rely on the extractor tests plus the suspected-false-positive audit.

## 5. Performance (`data/reports/performance.txt`)

| Measure | Value |
|---|---|
| `app.js` | 213.6 KiB (67.2 KiB gzip). No other JS. No web fonts |
| `styles.css` | 16.6 KiB (4.0 KiB gzip) |
| `data/schemes.json` | 440.7 KiB (51.4 KiB gzip) |
| `evaluateAll` on the 66 real schemes | 1.7 ms |
| `evaluateAll` on a 9,900-record stress copy (real records replicated in memory, not published) | 106 ms |
| Text search on 9,900 records | 4.3 ms / query |

Results are memoised (`useMemo`) and recomputed only when the dataset or the profile changes. Search input is debounced (250 ms). Find Schemes paginates 12 per page. There are no images except an SVG favicon.

## 6. Accessibility checks
Semantic landmarks (`header`, `nav[aria-label]`, `main`, `footer`), a skip link, one `h1` per route that receives focus on navigation, labels on every control (automated check), `aria-describedby` hints and errors, `role="alert"` for form errors, `aria-live` result counts, focus-trapped dialogs with Esc, `aria-pressed` save toggles, `aria-current` navigation, 44 px minimum targets, `prefers-reduced-motion` and `prefers-color-scheme` support. Colour tokens were picked for WCAG AA contrast on both themes. **Not done:** a formal audit with screen-reader users or an automated axe scan.
