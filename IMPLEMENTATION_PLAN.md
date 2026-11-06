# Implementation Plan and Status

Branch: `feat/real-data-revamp`. Status as of 2026-11-06. "Done" means implemented **and** covered by tests or a report.

| Phase | Plan | Status |
|---|---|---|
| 1 Audit | Inventory stack, routing, data, risks | **Done**: AUDIT.md |
| 2 UI/UX | Keep the UMANG shell. Rebuild the Mera Haq sections (Overview, Find, Eligible, Saved, Profile, Documents, Resources, Help). Loading, empty, error and success states. Responsive, light and dark | **Done**: `src/app/*`, `styles.css` |
| 3 Data collection | Source discovery, policy checks, hardened fetcher, snapshots, MahaDBT listing expansion, curated Central records, sync/versioning, review queue | **Done, with documented gaps**: myScheme / india.gov.in / data.gov.in / egazette not machine-ingested (terms, WAF, robots, TLS). See DATA_SOURCE_INVENTORY.md |
| 3.3 Geography | Registry of 28 States + 8 UTs as separate types | **Done**: `src/engine/locations.js`, `data/registry/locations.json` |
| 3.5–3.7 Fields, traceability, status | Normalised record with nulls for unknowns. Every field has a verbatim evidence quote. Six verification statuses | **Done**: ARCHITECTURE.md §2–3 |
| 4 Data architecture | Logical model, validation checks, data-quality report | **Done**: `validate_schemes.py`, DATA_QUALITY_REPORT.md |
| 5 Profiling | 3-question start, then progressive questions ranked by impact. Sensitive fields need consent. Editable profile | **Done** |
| 6 Engine | Deterministic outcomes (six), explainability, edge cases | **Done**: `src/engine/eligibility.js`, 26 unit tests |
| 7 Flows | Flows 1–10 | **Done**: E2E 20/20 |
| 8 Routing | Inventory, 404, legacy redirects, SPA fallback | **Done**: ROUTE_INVENTORY.md |
| 9 Security | Findings and fixes, headers, scraping controls, dependency audit | **Done, with residual risks**: SECURITY_AUDIT.md (SEC-01 history purge is an owner action) |
| 10 Testing | Unit, pipeline, E2E, random input, real-data dry run | **Done**: TEST_REPORT.md |
| 11 Data report | Generated from artefacts, per State/UT | **Done**: DATA_QUALITY_REPORT.md |
| 12 Perf/a11y | Measured. Accessibility checks automated where possible | **Done** (formal axe / screen-reader audit not done) |
| 13 Git | Feature branch, logical commits, push, no force-push, no merge to main | See README §Deployment and the final session report |

## Next steps (not done)
1. Ask myScheme / DIC for written authorisation or an API key. That is the only route to near-complete national coverage.
2. Add State portals with structured pages (e.g. other State DBT portals), using the MahaDBT extractor as the template.
3. Ingest PM SVANidhi operational guidelines and the MahaDBT GR PDFs, then clear the review queue.
4. Human field-by-field review of the 53 auto-extracted MahaDBT records to promote them to VERIFIED.
5. A scheduled `npm run data:sync` (weekly) that opens a PR with the diff in `data/history/`.
6. Optional data.gov.in connector once a key is available (`DATA_GOV_IN_API_KEY`).

## Operational note
Snapshots older than 180 days become `OUTDATED` by design. Outdated records stop yielding "Likely eligible", so the CI dry run will start failing on oracle mismatches. That is the signal to run `npm run data:sync` and re-review.
