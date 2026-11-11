# Proposal: Proactive Scheme Discovery for Citizens
### Integrate Mera Haq into UMANG, or publish an Open Government Schemes API

**Prepared for:** National e-Governance Division (NeGD), MeitY: UMANG and myScheme teams; Digital India Corporation; State IT / DBT departments
**Prepared by:** Mera Haq project ([github.com/devneeraj15/Mera-Haq](https://github.com/devneeraj15/Mera-Haq))
**Status:** working proof of concept, live at https://devneeraj15.github.io/Mera-Haq/ (feature branch `feat/real-data-revamp`)

> Figures marked **[to source]** must be filled in from official publications (for example the myScheme dashboard or the UMANG annual report) before this proposal is presented. Every other number here was measured in the POC.

---

## 1. The problem

Citizens are often eligible for schemes they have never heard of. Scheme information is spread across Central ministries, 36 State/UT governments and hundreds of department portals, each with its own format. Existing search tools ask citizens to know what they are looking for, or to answer long questionnaires up front.

Third-party services that want to help (CSC operators, NGOs, State helplines, civil-society apps) have **no machine-readable source** of scheme rules:
- **myScheme** has the most complete catalogue, but its Terms of Use prohibit automated access without written authorisation.
- **india.gov.in** blocks automated requests (HTTP 403).
- **data.gov.in** does not publish scheme-eligibility datasets, and its robots.txt disallows crawling.
- Department portals are inconsistent. Many render client-side, have broken TLS chains or have disappeared (examples in `DATA_SOURCE_INVENTORY.md`).

The result: every intermediary re-types scheme rules by hand, copies drift out of date when a GR changes an income limit, and citizens get conflicting answers.

## 2. What the POC proves

Mera Haq is a working, tested prototype of a **profile-first discovery layer inside UMANG**, built only from data it was allowed to collect.

| Capability | Evidence in the POC |
|---|---|
| 3-question start (age, gender, State/UT), then only questions that change results | `#/mera-haq/start`, `#/mera-haq/eligible`. Questions ranked by how many outcomes they would change |
| Deterministic, explainable eligibility with no AI guessing | `src/engine/eligibility.js`: six outcomes, each with passed / failed / unknown / confirm-yourself conditions |
| Every rule traceable to the official sentence | 978 of 978 evidence quotes re-found in stored copies of the official pages |
| Honest about unknowns | A missing answer is never treated as a pass. A closed application window is shown separately from eligibility |
| Privacy by design | Answers stay on the device. Session-only storage by default. Consent before sensitive questions. No Aadhaar or document uploads |
| Hands off to the official portal | Destination shown before leaving. Never claims to submit an application |
| Works for all 28 States and 8 UTs | Canonical registry. State/UT data so far for Maharashtra (55 MahaDBT schemes) + 11 Central schemes |
| Quality assurance | 86 automated tests (42 unit, 16 pipeline, 28 end-to-end on desktop and mobile), and a dry run of 18 personas × 66 schemes with 210 independently written expected outcomes (0 mismatches) |
| Already speaks a proposed API | The app reads data only through `api/v1/` (OpenAPI 3.1, `docs/api/openapi.yaml`) |

**What the POC cannot do alone:** national coverage. That needs the government's data, which is the point of this proposal.

## 3. The fiscal case: less money left unspent

Money Parliament votes for still goes unspent. CAG Report No. 6 of 2026 (Accounts of the Union Government, FY 2024-25; press release of 2 April 2026) states:

> "The total voted provision was ₹47,06,865.39 crore and actual expenditure was ₹42,84,939.54 crore with savings of ₹4,21,925.85 crore."

> "there were savings of ₹5,000 crore or more in 19 Grants/ Appropriations during FY 2024 -25 against which seven Grants/ Appropriations had persistent savings in last three FYs."

**What this does and does not show.** These savings have many causes (project and procurement delays, re-appropriation, budgeting practice), and CAG does not attribute them to low citizen uptake. For **citizen-benefit schemes**, though, part of any underspend is demand-side: eligible people never learn of the scheme, are unsure they qualify, or are rejected for missing documents. That is the part Mera Haq addresses.

**Model (implemented and unit-tested in `src/engine/impact.js`, live at `#/mera-haq/impact`):**

`reduction in unspent funds = (allocation − actual spend) × A × B`

- **A**: share of the scheme's unspent amount caused by eligible citizens not applying
- **B**: share of that missed demand that proactive discovery converts into successful applications

Per ₹1,000 crore of unspent allocation, illustrative arithmetic only:

| A \ B | 10% | 25% | 50% |
|---|---|---|---|
| 5% | ₹5 cr | ₹12.5 cr | ₹25 cr |
| 10% | ₹10 cr | ₹25 cr | ₹50 cr |
| 25% | ₹25 cr | ₹62.5 cr | ₹125 cr |

A and B are **not known today**. The pilot (§8) is designed to measure them from department application data. Before a meeting, replace the grid with one or two real schemes from the relevant ministry's Expenditure Budget (BE vs Actuals) **[to source]**. indiabudget.gov.in blocks automated access, so those figures must be downloaded by a person.

**Levers and how each is measured:**

| Cause of low uptake | What Mera Haq does | Pilot metric |
|---|---|---|
| Citizen doesn't know the scheme exists | Shows schemes after 3 questions | Users shown at least one relevant scheme |
| Unsure if they qualify | Explains each condition with the official text | Hand-offs to official portals per 100 users |
| Rejected for missing documents | Scheme-specific checklist before applying | Rejection rate of referred applicants |
| Helpers use outdated rules | Versioned records and a change feed | Days from GR change to updated record |
| Deadline missed | Shows published application windows | Applications filed before the last two weeks |

## 4. Two ways to adopt it (not mutually exclusive)

### Option A: Integrate Mera Haq into UMANG
UMANG adds a "Mera Haq" entry under Schemes that runs the open engine on myScheme's existing catalogue.

- **Citizen benefit:** discovery where citizens already hold an account. With consent, UMANG/DigiLocker could prefill verified attributes (age, State, category certificate), shortening onboarding.
- **Effort:** UMANG embeds the React module or reimplements the engine natively (about 450 lines of dependency-free JavaScript). myScheme exports its catalogue in the schema below, or UMANG maps its internal model to it.
- **Data stays inside government.** No public API is needed for this option.

### Option B: Publish an Open Government Schemes API
myScheme (or API Setu) publishes the catalogue as a read-only, versioned API under an open licence (GODL).

- **Ecosystem benefit:** State portals, CSCs, NGOs, banks (for credit-linked schemes) and researchers consume one authoritative source instead of scraping or re-typing.
- **Privacy:** the API publishes **rules, not people**. Evaluation happens on the user's device (or inside the consuming government app), so no personal data passes through the API.
- **Contract:** ready as `docs/api/openapi.yaml`. The POC serves it at `/api/v1/` and switching to an official endpoint is a configuration change.

**Recommendation:** start with **Option B in read-only form** (it unlocks everyone, including UMANG), then do **Option A** as UMANG's own front end on top of it.

## 5. Proposed API at a glance

| Endpoint | Purpose |
|---|---|
| `GET /schemes?level&jurisdiction&category&updatedSince&page` | Eligibility-ready scheme records |
| `GET /schemes/{id}` | One record: criteria, benefits, documents, application links, window, sources, version |
| `GET /jurisdictions` and `GET /jurisdictions/{code}/schemes` | 28 States + 8 UTs (ISO 3166-2:IN). Central + State/UT schemes for a location |
| `GET /changes?since=` | Change feed for incremental sync |
| `GET /meta` | Version, generation time, coverage |

**Each criterion is structured and evidenced:**
```json
{ "id": "age-max", "field": "age", "op": "lte", "value": 40,
  "label": "Joining age at most 40 years",
  "evidence": { "source": 0, "quote": "The minimum age of joining APY is 18 years and maximum age is 40 years." } }
```
Conditions that cannot be machine-checked are published as `"op": "manual"` with the verbatim text, never dropped.

Deliberately **not** included: any endpoint that accepts a citizen's profile.

## 6. Governance and data stewardship

| Role | Responsibility |
|---|---|
| Scheme-owning department (Central or State/UT) | Authoritative source. Publishes guidelines/GRs. Approves its scheme record |
| myScheme (DIC / NeGD) | Data steward: schema, editorial review, verification status, change feed |
| API Setu / UMANG | Distribution and integration |
| Consumers | Must show source links and "last verified" dates. Must not alter rules |

Proposed controls: every published field cites a document; record status (VERIFIED / PARTIALLY_VERIFIED / NEEDS_REVIEW / OUTDATED / INACTIVE); a 180-day re-verification cycle; a public changelog.

## 7. Privacy and compliance
- **DPDP Act, 2023:** the API processes no personal data. Option A processes it inside UMANG under UMANG's existing consent and notice framework. The POC already shows purpose limitation, consent for sensitive attributes, and deletion on request.
- **Data minimisation:** onboarding needs three non-sensitive fields. Sensitive attributes (income, category, religion, disability) are optional and asked only when a scheme needs them.
- **No profiling outside the device** in the open-API model.

## 8. Phased roadmap (proposal)

| Phase | Scope | Exit criteria |
|---|---|---|
| 0. Authorisation (weeks) | Written permission to use myScheme data for the POC, or a sandbox API key | Mera Haq runs on the full myScheme catalogue in a sandbox |
| 1. Pilot (1 State + Central) | Read-only API for Central schemes + one State (e.g. Maharashtra via MahaDBT) | Schema signed off; dry-run accuracy reviewed by department officers |
| 2. National read-only API | All Central and State/UT schemes on myScheme; change feed; GODL licence | Consumers onboarded (UMANG, at least one State portal, a CSC pilot) |
| 3. UMANG integration (Option A) | Mera Haq in UMANG with optional DigiLocker-verified prefill | Usability testing with citizens; accessibility audit; multilingual UI |

## 9. What we are asking for
1. **Interim:** written authorisation (or a sandbox API key) to use myScheme scheme data in the Mera Haq POC. The POC respects the current Terms and does not scrape.
2. A **review meeting** with the myScheme and UMANG product teams to validate the schema (`docs/api/openapi.yaml`) against myScheme's internal model.
3. A **pilot partner State** (Maharashtra suggested, since 55 MahaDBT schemes are already modelled) and a nominated officer to review the dry-run results.
4. A decision on the licence for published scheme data (GODL suggested).

## 10. Measurable outcomes for a pilot (baselines to be set during the pilot)
- Share of citizens who see at least one relevant scheme after 3 questions.
- Median number of questions asked before a result is confirmed.
- Hand-offs to official application portals.
- Accuracy against officer review (false positives / false negatives per 100 assessments).
- Change in utilisation (Actuals ÷ BE) of pilot schemes, compared with matched non-pilot districts or the previous year, to estimate A and B.
- Data freshness: median days between a GR change and an updated record.

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Citizens read "Likely eligible" as a guarantee | Explicit wording; every result lists conditions to confirm; final decision rests with the department |
| Rules change faster than records | Change feed; 180-day OUTDATED rule; department sign-off |
| Ambiguous guideline text | Published as `manual` conditions verbatim; never guessed |
| Misuse of the open data (fake "agents") | Mandatory source links and an official-domain allow-list for application links |

---
*Appendices in the repository:* `docs/POC_WALKTHROUGH.md` (illustrated tour of the POC), `ARCHITECTURE.md` (engine and data model), `DATA_SOURCE_INVENTORY.md` (access findings for each source), `DATA_QUALITY_REPORT.md` (coverage by State/UT), `TEST_REPORT.md` (accuracy testing), `SECURITY_AUDIT.md`.
