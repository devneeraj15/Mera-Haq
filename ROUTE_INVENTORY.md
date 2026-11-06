# Route Inventory

Hash routing (`#/path?query`). Hash routes survive refresh and deep links on GitHub Pages without server rewrites. `scripts/serve.mjs` also falls back to `index.html` for unknown path-style URLs, and `404.html` redirects to `#/not-found` on Pages. No route requires authentication.

| Route | Component | Parent | Expected data | Entry points | Exit points | Loading | Error / empty | Redirect behaviour |
|---|---|---|---|---|---|---|---|---|
| `#/mera-haq` | `Overview` (or `Landing` before onboarding) | Shell | dataset, profile | sidebar, brand, default | start, find, eligible, profile, scheme | skeleton | dataset error + retry | `#/`, empty hash → here |
| `#/mera-haq/start` | `Onboarding` | Shell | none | landing CTA, empty states | `eligible` after valid submit | – | inline field errors + summary alert | – |
| `#/mera-haq/find?q&cat&level&ver&outcome&scope&page` | `FindSchemes` | Shell | dataset | sidebar, header search, cards | scheme detail | skeleton | "No schemes match" + clear filters | filter changes use `replace` (no history spam); paging pushes history; invalid `page` clamped |
| `#/mera-haq/eligible?all=1` | `Eligible` | Shell | dataset, profile | onboarding, overview | scheme detail, profile | skeleton | needs-profile empty state; no-match empty state | – |
| `#/mera-haq/scheme/:id` | `SchemeDetail` | Shell | dataset | cards, saved, documents, overview lists | apply hand-off dialog, documents, find | "Loading scheme…" | "Scheme not found" for unknown or invalid IDs (IDs must match `[a-z0-9-]{1,120}`) | – |
| `#/mera-haq/saved` | `Saved` | Shell | dataset, saved IDs | sidebar | scheme detail, documents | skeleton | "No saved schemes yet"; stale saved IDs shown with Remove | `#/saved` → here (replace) |
| `#/mera-haq/profile` | `Profile` | Shell | profile | header avatar, sidebar, "Edit answers" | eligible | – | inline errors | `#/mera-haq/profile/review` → here |
| `#/mera-haq/documents?scheme=:id` | `Documents` | Shell | dataset, saved, checklist | sidebar, scheme detail | scheme detail | skeleton | "No schemes selected"; unknown scheme → not found | – |
| `#/mera-haq/resources` | `Resources` | Shell | dataset | sidebar, landing | official portals (new tab) | skeleton | dataset error | – |
| `#/mera-haq/impact` | `Impact` (`src/app/impact.jsx`) | Shell | `data/impact/fiscal-context.json` | sidebar ("Impact") | CAG source PDF (new tab) | skeleton | load-error notice; inline field errors | – |
| `#/mera-haq/developers` | `Developers` | Shell | `api/v1/meta.json`, dataset | sidebar ("Open Data API"), Resources notice | raw API files (new tab) | skeleton | meta load error notice | – |
| `#/mera-haq/help` | `Help` | Shell | – | sidebar, privacy links | delete-data dialog | – | – | `#/mera-haq/tests` → here |
| `#/schemes` | `UmangSchemes` | Shell | – | sidebar | `#/mera-haq` | – | – | – |
| `#/home`, `#/services`, `#/digilocker`, `#/jobs`, `#/dashboard`, `#/maharashtra` | `UmangPlaceholder` | Shell | – | sidebar | Mera Haq, official UMANG | – | – | – |
| anything else | `NotFound` | Shell | – | – | find, overview | – | "Page not found" | – |

Legacy prototype routes, redirected with `location.replace` so the dead URL never stays in history:

| Old | New |
|---|---|
| `#/mera-haq/matching` | `#/mera-haq/eligible` |
| `#/mera-haq/opportunities` | `#/mera-haq/find` |
| `#/mera-haq/opportunities/:id`, `/:id/eligibility`, `/:id/readiness` | `#/mera-haq/scheme/:id` |
| `#/mera-haq/profile/review` | `#/mera-haq/profile` |
| `#/saved` | `#/mera-haq/saved` |
| `#/mera-haq/tests` | `#/mera-haq/help` |

Behaviour on every route change: the mobile menu closes, the page scrolls to the top, focus moves to the page `<h1>` (except on first load, so the skip link is reachable), and `document.title` is updated. A per-route error boundary resets on navigation.

Tested in `tests/e2e/journeys.spec.js` (Flows 1, 9, 10): direct navigation, refresh, back/forward, query parameters, unknown routes, missing and invalid IDs (including encoded `<script>`), legacy redirects, mobile navigation (Pixel 5 project), and SPA fallback.
