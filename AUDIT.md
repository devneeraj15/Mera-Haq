# Codebase Audit (Phase 1)

Audit date: 2026-11-06. Baseline: `main` @ `6bbc118`. Branch with the remediation: `feat/real-data-revamp`.

## 1. What the repository contained

| Area | Finding |
|---|---|
| Frontend framework | React 18 **UMD from unpkg**, unpinned (`react@18`, `react-dom@18`), no SRI |
| JSX compilation | `@babel/standalone` (unpinned) compiling `app.jsx` **in the browser** on every page load |
| Backend | `backend_rag_service.py`: optional FastAPI app (BM25 + "Voyage AI" embedding *simulation*), not deployed |
| Package manager | None (no `package.json`) |
| Folder structure | Flat. `app.jsx` (5,807 lines), `app.js` (stale 4,173-line fallback, not loaded), `styles.css`, `data/*.json`, `schemes/*.md` |
| Routing | Hand-written hash router in `AppProvider` (`location.hash`, `hashchange`) |
| State management | One React context. `localStorage` for profile and saved IDs |
| Authentication | None (none needed: public, read-only information service) |
| API integrations | None live. DigiLocker, AI copilot and RAG were simulated with canned data |
| Database | None. Data hard-coded in `app.jsx` (`const opportunities = [...]`) and mirrored in `data/opportunities.json` |
| Environment variables | `VOYAGE_API_KEY` (backend only, optional) |
| UI library / CSS | No library. One 2,949-line dark-theme `styles.css`; Google Fonts |
| Build / deploy | None. GitHub Pages serves the repository root (`https://devneeraj15.github.io/Mera-Haq/`) |
| Tests | An in-browser "test suite" page (`#/mera-haq/tests`) that asserted properties of the mock dataset |
| CI | No GitHub Actions workflows |
| Git | Remote `origin` → `github.com/devneeraj15/Mera-Haq`, branch `main`. Untracked nested repo `hostel-management/` (not touched) |

## 2. Defects and risks found

### Data integrity (critical)
1. **39 hand-curated scheme records presented as "verified"** (`data/opportunities.json`: "Mera Haq 39-Scheme Verified Dataset"). They had no retrieval timestamps, no evidence and no provenance. Several values could not be traced to any source (e.g. "AI Technocrat — IIT Dharwad … ₹1,000/month stipend", benefit "amount: 57000" built from `directAmount + costAvoidedAmount`).
2. **Eligibility outcomes were partly hard-coded to a demo persona.** `AppProvider` overwrote missing profile values with `name: "Neeraj"`, `age: 23`, `course: "Computer Engineering"`, and a `demoProfile` loaded by default.
3. "Match percentage", "potential value" and "Citizen Balance Sheet" figures were computed from the invented benefit amounts.
4. `schemes/*.md` "gazette store" files were written by hand and labelled as gazette data.
5. Mock DigiLocker vault (`data/mock_digilocker.json`) with APAAR/ABC IDs and certificate URIs styled like real ones.

### Privacy (high)
6. `data/mock_digilocker.json` contained a **full name and date of birth** that appear to be the developer's, in a public repository. The file is removed on this branch but **remains in git history** (see SECURITY_AUDIT.md, SEC-01).
7. Sensitive attributes (income, caste category, minority religion, disability) were persisted to `localStorage` indefinitely, with no consent step.
8. The error boundary called `localStorage.clear()`, wiping all of the origin's storage.

### Security (high/medium)
9. Unpinned third-party scripts from unpkg without Subresource Integrity, plus in-browser Babel (needs `unsafe-eval`). A compromised CDN or package release would mean full XSS.
10. No Content-Security-Policy. External links used `rel="noreferrer"` but URLs were never validated.
11. Backend CORS: `allow_origins=["*"]` together with `allow_credentials=True`.

### Functionality / UX
12. The routing table had no handling for invalid IDs on sub-routes, and the legacy routes had no redirects. Hash navigation pushed duplicate history entries.
13. Several "UMANG" items were placeholders presented like working services.
14. A large share of UI text claimed AI/RAG capabilities (Voyage embeddings, N-gram guardrails) that only ran in simulation.

## 3. Decisions

- **Preserved:** React, hash routing (works on GitHub Pages with refresh and deep links, no server fallback needed), the UMANG shell (header and sidebar with Home / Services / DigiLocker / Schemes / Jobs / Dashboard), Mera Haq under the Schemes section, and the profile-first flow.
- **Changed:** in-browser Babel replaced by an esbuild build that emits the same root-level `app.js`, so GitHub Pages hosting is unchanged. This was needed for the CSP and supply-chain fixes, not a technology migration.
- **Removed:** every fabricated dataset (`data/opportunities.json`, `data/mock_*.json`, `schemes/*.md`), the simulated RAG backend and the canned AI copilot. Any future AI layer may only *explain* the deterministic results (ARCHITECTURE.md §6).
- **Not touched:** the PMO deck (`*.pptx`) and brief (`*.pdf`), `SUBMISSION.md` (it describes the earlier prototype; see the README note), and `hostel-management/`.
