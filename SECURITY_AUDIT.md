# Security Audit

Scope: the frontend (`index.html`, `src/app/*`, `src/engine/*`), the build and dev server, the ingestion pipeline (`scripts/pipeline/*`), dependencies and the repository contents. References: OWASP Top 10:2025, OWASP ASVS 5.0.0.

> **Limits of this audit.** This was a source-code review plus automated tests (unit, E2E, hostile-input). **No penetration test was performed.** Passing these checks does not mean the application is secure. It means the findings listed here were found and addressed.

## Findings

| ID | Vulnerability | Severity | Component | Status |
|---|---|---|---|---|
| SEC-01 | Personal data (full name + date of birth) committed to a public repo | **High** | `data/mock_digilocker.json` | Removed from tree. **Still in git history: owner action required** |
| SEC-02 | Unpinned third-party scripts without SRI + in-browser Babel | **High** | `index.html` | Fixed |
| SEC-03 | No Content-Security-Policy | Medium | `index.html` / hosting | Fixed (meta CSP; `_headers` for capable hosts) |
| SEC-04 | Unvalidated external links / open-redirect style hand-off | Medium | apply buttons | Fixed |
| SEC-05 | Sensitive attributes in `localStorage` without consent or retention limit | Medium | profile storage | Fixed |
| SEC-06 | Error boundary wiped the whole origin's storage (`localStorage.clear()`) | Low | `ErrorBoundary` | Fixed (removed) |
| SEC-07 | Stored state trusted without validation (tampering → crashes or wrong claims) | Medium | `AppProvider` | Fixed |
| SEC-08 | CORS `allow_origins=["*"]` with `allow_credentials=True` | Low (not deployed) | `backend_rag_service.py` | Removed with the simulated backend |
| SEC-09 | Vulnerable dev dependencies (esbuild ≤0.24.2 GHSA-67mh-4wv8-2f99; playwright <1.55.1 GHSA-7mvr-c777-76hp) | Moderate / High (dev only) | `package.json` | Fixed by pinning patched versions |
| SEC-10 | Scraper SSRF / rebinding / resource-exhaustion risks | High (by design) | ingestion pipeline | Controls implemented |
| SEC-11 | Fabricated data presented as verified (integrity, A08) | High | dataset | Fixed (evidence-verified dataset) |

### SEC-01: Personal data in repository history
- **Reproduction:** `git show 6bbc118:data/mock_digilocker.json` shows `simulatedCitizen.name` and `dob`.
- **Impact:** a person's identity data is publicly available and can be used for profiling or social engineering.
- **Root cause:** realistic "synthetic" fixtures were built from real personal details.
- **Fix:** file deleted on `feat/real-data-revamp`. No fixture in the new tree contains real personal data (personas in `tests/fixtures/personas.json` have no names or dates).
- **Residual risk / owner action:** history was **not rewritten** (the brief forbids rewriting history and force-pushing). If this is real data, the repository owner should purge it with `git filter-repo` (or GitHub support) and rotate anything derived from it.

### SEC-02: Supply chain through CDN scripts
- **Before:** `<script src="https://unpkg.com/react@18/umd/...">` and `@babel/standalone` with no version pin and no `integrity`. Babel compiled code at runtime, which requires `unsafe-eval`.
- **Impact:** a compromised or malicious package release would run as the page (full XSS).
- **Fix:** React 18.3.1 is pinned in `package.json` / `package-lock.json` and bundled by esbuild into `app.js`. The page loads **no third-party scripts, styles or fonts**.
- **Verification:** `index.html` has only `script src="app.js"`. CSP `script-src 'self'`. E2E Flow 1 asserts no console errors under the CSP.

### SEC-03: Security headers
GitHub Pages cannot send custom headers. Delivered instead:
- `<meta http-equiv="Content-Security-Policy">`: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; upgrade-insecure-requests`
- `<meta name="referrer" content="strict-origin-when-cross-origin">`
- `_headers` (Netlify / Cloudflare Pages) and `scripts/serve.mjs` send the full set: CSP with `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `X-Frame-Options: DENY`.
- **Residual risk:** on GitHub Pages, `frame-ancestors` and `X-Frame-Options` cannot be set (clickjacking protection is limited there). GitHub Pages already enforces HTTPS/HSTS for `*.github.io`.

### SEC-04: Official application hand-off
- `officialUrlInfo()` accepts only `https:` URLs with no credentials, on `*.gov.in`, `*.nic.in` or a short reviewed list (DATA_SOURCE_INVENTORY.md §4). `javascript:`, `http:`, look-alike hosts (`pmuy.gov.in.evil.com`, `evilgov.in`) and malformed URLs are rejected (unit test "official URL validation").
- The hand-off dialog shows the exact destination and opens it with `window.open(url, "_blank", "noopener,noreferrer")`. Source links use `rel="noopener noreferrer"`. E2E Flow 8 asserts `window.opener === null` in the new tab.
- The app never claims an application was submitted.

### SEC-05: Privacy and data minimisation
- Collected by default: age, gender, State/UT. Everything else is optional.
- Sensitive fields (income, social category, religion, disability, marital status) are shown only after explicit consent. **Withdrawing consent deletes them** immediately.
- Storage: `sessionStorage` by default (cleared when the tab closes). `localStorage` only if the user ticks "Remember my answers on this device".
- "Delete all my data" (Help page) removes every Mera Haq key, including the legacy prototype keys, which are also purged automatically on load.
- Never collected: Aadhaar, bank account numbers, document uploads. The documents checklist stores only booleans. No analytics, ads or tracking. Answers are never transmitted (there is no backend and `connect-src 'self'`).

### SEC-06 / SEC-07: Storage robustness
- Stored JSON is size-capped (200 KB), parsed in `try/catch`, and **re-validated through `validateProfile`**. Saved IDs and checklist keys must match `^[a-z0-9-]{1,120}$`. E2E "Random input" injects `age: 999, state: "<x>", gender: "ROBOT"` into storage and asserts the values are dropped.

### XSS review
- There is no `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` in `src/`. All scheme text (from government pages) is rendered as React text nodes.
- Snapshots store **extracted plain text only**. Scripts, styles and iframes are dropped by the stdlib `HTMLParser`, so captured HTML is never served or executed.
- URL query values are length-capped and used only as filter strings. E2E checks `?q=<img src=x onerror=…>` and a display name containing `<script>`: no element is created.

### SEC-10: Scraping security (`scripts/pipeline/safe_fetch.py`)

| Threat | Control |
|---|---|
| Arbitrary URL fetching / SSRF | Host allow-list (`domains.json`, status `ALLOWED`). `https` only, port 443 only, no URL credentials |
| Internal network / DNS rebinding | Every hostname is resolved and **all** addresses must be global unicast before connecting, re-checked on every redirect hop (unit tests: 127.0.0.1, 169.254.169.254) |
| Malicious redirects | Redirects followed manually (max 5). Every hop re-validated against the allow-list, IP rules and robots.txt |
| Oversized responses / resource exhaustion | 5 MB cap for HTML, 15 MB for PDF (Content-Length checked and read bounded), 30 s timeout, max 3 retries with exponential backoff, at least 3 s per-host throttle (or robots Crawl-delay) |
| Malformed PDFs | `pypdf` with `strict=False`, at most 60 pages, wrapped in exception handling: a bad PDF becomes an empty snapshot, never a crash |
| Malicious HTML / XXE | No XML parser is used on fetched content. `html.parser` does not resolve external entities. Content-type allow-list |
| Command injection | No shell calls with fetched data. `run_all.py` uses `subprocess.run` with fixed argument lists |
| Executing downloaded content | Never: content is only converted to text |
| TLS | Verification always on (TLS ≥ 1.2). For servers that omit intermediates, AIA chasing adds **non-self-signed** intermediates only, so trust stays anchored in the OS root store (self-signed downloads are rejected because they would act as trust anchors) |
| Terms / robots | robots.txt honoured per URL. Hosts whose Terms prohibit scraping are marked `BLOCKED_BY_TERMS` and cannot be fetched |

### SEC-09: Dependencies
- `npm audit`: **0 vulnerabilities** (prod and dev) after pinning `esbuild@0.25.0` and `@playwright/test@1.55.1`. Runtime dependencies: `react@18.3.1` and `react-dom@18.3.1` only.
- Python: stdlib plus `pypdf==5.1.0` (pipeline only, never shipped).
- CI runs `npm audit --audit-level=moderate`.
- `npm outdated`: React 19 and newer major versions of esbuild and Playwright are available. Not upgraded on purpose: no security need, and a React major upgrade is out of scope.

### Backend items (Phase 9.2)
There is no backend after this change: authentication, sessions, CSRF, SQL/NoSQL injection, CORS and file-upload risks do not apply to the deployed app. The removed FastAPI prototype's CORS configuration (SEC-08) is recorded for completeness.

### Secrets check
`git grep -nIiE "(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}"` on the branch finds no credentials. `.gitignore` excludes `.env*`, `*.pem`, build and test artefacts.

## Residual risks
1. SEC-01 history purge is pending with the owner.
2. Clickjacking protection on GitHub Pages is limited (see SEC-03).
3. Dataset integrity depends on the official sources themselves. A source page that is compromised or wrong would be captured as published, so quotes prove *provenance*, not *truth*.
4. No independent penetration test or accessibility audit with assistive-technology users has been done.
