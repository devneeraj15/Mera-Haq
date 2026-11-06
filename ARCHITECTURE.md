# Architecture

```
 Official sources (allow-listed .gov.in / reviewed hosts)
        │  robots.txt + Terms honoured, throttled, TLS-verified, SSRF-guarded
        ▼
 scripts/pipeline/discover_sources.py ──► data/sources/discovered-urls.json
 scripts/pipeline/ingest_schemes.py   ──► data/snapshots/<sha>.json   (plain text + SHA-256 of raw body)
 scripts/pipeline/normalize_schemes.py ◄── data/curation/*.json        (human-curated records + overrides)
        │  MahaDBT structured-page extractor + rule_extract.py (conservative patterns)
        ▼
 data/build/normalized.json
 scripts/pipeline/validate_schemes.py  (re-matches every evidence quote against its snapshot,
        │                               assigns VERIFIED / PARTIALLY_VERIFIED / NEEDS_REVIEW / …)
        ▼
 scripts/pipeline/detect_duplicates.py ─► data/reports/duplicates.json
 scripts/pipeline/sync_schemes.py      ─► data/schemes.json  (published, versioned) + data/history/*.json
 scripts/pipeline/generate_data_report.py ─► DATA_QUALITY_REPORT.md
        ▼
 scripts/build-api.mjs ─► api/v1/ (static POC of the proposed Open Schemes API, docs/api/openapi.yaml)
        ▼
 Static site (GitHub Pages)
   index.html ─ app.js (esbuild bundle: React 18.3.1 + src/app/* + src/engine/*) ─ styles.css
   fetch(<merahaq-api-base>/schemes/index.json) ─► src/engine/eligibility.js (deterministic, runs in the browser)
   profile/saved/checklist ─► sessionStorage (default) or localStorage (opt-in)
```

## 1. Why there is no server

Mera Haq reads public data and never submits anything. Running eligibility in the browser means personal answers never leave the device. No backend means no database credentials, no session store and no PII at rest on a server. The pipeline runs offline (developer machine or CI) and publishes a static JSON file. If a backend is added later (for example for very large datasets), it must keep the same engine and data contract.

## 2. Data model (`data/schemes.json`, `schemaVersion: 2`)

The published file is denormalised for the static client. The *logical* model is normalised as follows:

| Entity | Where it lives |
|---|---|
| Government scheme | `schemes[]`: `id, name, altNames, description, category, subcategory, level, status, version` |
| Eligibility criteria | `schemes[].criteria[]`: `{id, field, op, value, label, mandatory, evidence{source, quote, verified}, extraction}`, including `anyOf` groups and `op:"manual"` |
| Benefits | `schemes[].benefits[]`: `{text, amount (null if not stated), frequency, evidence}` |
| Required documents | `schemes[].documents[]`: `{name, evidence}` |
| Departments | `ministry, department, implementingAuthority` |
| Government sources | `schemes[].sources[]`: `{title, publisher, url, documentType, publicationDate, retrievedAt, contentSha256, evidenceNotes, available}` |
| Geographic applicability | `level` (CENTRAL / STATE / UNION_TERRITORY) + `jurisdictions` (`["ALL"]` or ISO-3166-2:IN codes from `data/registry/locations.json`) |
| Application window | `applicationWindow {opens, closes, evidence}` (null when not published) |
| Scheme versions | `version` per record + `data/history/<timestamp>.json` diffs (added / changed fields / kept previous / missing) |
| Verification | `verification {status, checkedAt, quotesTotal, quotesFound, snapshotAgeDays, errors, warnings, missingEvidence, contradictions}` |
| User profile, saved schemes, assessments | Client-side only (`merahaq.v3` key). Assessments are recomputed, never stored |

Profile fields and operators are defined once in `src/engine/eligibility.js` (`FIELD_META`, `ENUMS`) and checked again by `validate_schemes.py` (`FIELDS`, `OPS`).

## 3. Verification status rules

| Status | Rule (first match wins) | Shown to users as |
|---|---|---|
| INACTIVE | record `status == INACTIVE` | not currently open |
| SOURCE_UNAVAILABLE | primary source has no snapshot | danger badge |
| NEEDS_REVIEW | any quote not found, validation error, contradiction, or `needsReview` | warning; never "Likely eligible" |
| OUTDATED | primary snapshot older than 180 days | warning; never "Likely eligible" |
| VERIFIED | human-curated, all quotes found, at least one benefit, no open review flags | "Verified from official source" |
| PARTIALLY_VERIFIED | all quotes found, but auto-extracted or with open review notes | "Partially verified" + explanation |

A government domain alone never makes a record VERIFIED. The quoted sentence has to be found in the captured page.

## 4. Eligibility engine (`src/engine/eligibility.js`)

- **Pure and deterministic.** The same input always gives the same output, and it runs the same way in Node (tests, dry run) and the browser.
- **Profile validation** (`validateProfile`): every field is type-checked. Enums and locations come from fixed lists, ages are 0–120, and income is 0 to ₹1,000 crore. Invalid values become `null` plus an error message. Stored state is re-validated on every load.
- **Criterion evaluation:** PASS / FAIL / UNKNOWN / MANUAL. A missing profile value is always UNKNOWN. Supported operators: `gte, lte, gt, lt, eq, in, notIn, isTrue, isFalse, eduGte, manual, anyOf`.
- **Jurisdiction:** State/UT schemes get a derived `state ∈ jurisdictions` criterion. Central schemes apply everywhere.
- **Outcome**, in order of precedence:
  1. any mandatory FAIL → `NOT_ELIGIBLE`
  2. contradictory limits → `NEEDS_MANUAL_VERIFICATION`
  3. any UNKNOWN → `POTENTIAL_MATCH` if a substantive (non-location) criterion passed, else `INSUFFICIENT_INFORMATION`
  4. record not VERIFIED/PARTIALLY_VERIFIED, or no machine criteria, or only location criteria passed while manual conditions remain → `NEEDS_MANUAL_VERIFICATION`
  5. otherwise → `LIKELY_ELIGIBLE` (manual conditions are listed as "confirm yourself")
  6. separately, a `CLOSED` / `INACTIVE` window turns any non-failing outcome into `SCHEME_NOT_CURRENTLY_OPEN`. The `eligibility` field keeps the personal result.
- **Explainability:** each result lists passed, failed, unknown and manual criteria with their evidence quotes, plus `missingFields` and the sources. There are no match percentages.
- **Progressive profiling:** `suggestNextQuestions` ranks missing fields by how many outcomes they would change.

## 5. Frontend (`src/app/`)

| File | Responsibility |
|---|---|
| `store.jsx` | hash router (`parseHash`, `legacyRedirect` via `location.replace`), dataset fetch with 15 s timeout + retry, privacy-aware storage, derived results |
| `ui.jsx` | badges, skeletons, empty/error states, accessible `Dialog` (focus trap, Esc, focus restore), `FieldInput` (labels, hints, `aria-invalid`, `aria-describedby`) |
| `views.jsx` | every Mera Haq page (see ROUTE_INVENTORY.md) |
| `main.jsx` | UMANG shell (header, sidebar, footer), route table, per-route error boundary, focus management |

## 6. AI layer policy

No LLM is used. If one is added, it may only rephrase the engine's `explanation` and the record's quoted evidence. It must not create criteria, change outcomes or state benefits that are not in the record.
