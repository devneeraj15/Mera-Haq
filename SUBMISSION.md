# Build What Moves India — Submission Brief & Verification Pack

## Project Information

- **Project Name:** Mera Haq on UMANG (मेरा हक / My Entitlement)
- **Tagline:** Government support you may qualify for — without having to know it exists.
- **Live Public URL:** [https://devneeraj15.github.io/Mera-Haq/](https://devneeraj15.github.io/Mera-Haq/)
- **GitHub Repository:** [https://github.com/devneeraj15/Mera-Haq](https://github.com/devneeraj15/Mera-Haq)
- **Target Platform:** Web application integrated into the official UMANG Design System (Mobile & Desktop Responsive)

---

## 1. Project Summary (Under 250 Words)

> Every year, millions of Indian citizens miss out on scholarships, free technical certifications, interest subventions, maternal benefits, and startup grants simply because government support is fragmented across dozens of separate ministries, state portals, and institutions.
>
> On the current UMANG portal, citizens are forced to navigate rigid category questionnaires that frequently terminate in dead ends ("No schemes found based on your preference").
>
> **Mera Haq** reverses this broken paradigm. Instead of requiring citizens to search for schemes they don't know exist, citizens complete a 60-second lightweight profile (optionally powered by DigiLocker/APAAR ID). A 100% deterministic eligibility engine continuously matches their profile against 39 Central, Maharashtra State, and Premier Institutional programs.
>
> Citizens receive a personalized **Opportunity Map** with clear status tiers (Strong Matches, Verification Needed, Future Opportunities), an estimated financial value calculator (e.g. ₹1.35L+), and a signature **"Why Do I Match?"** rule-by-rule audit with plain-language explanations. A pre-application checklist allows one-tap digital retrieval of verified credentials via DigiLocker before safely handing off to the official government destination.
>
> Mera Haq transforms government discovery from a bureaucratic scavenger hunt into an empowering citizen entitlement layer.

---

## 2. Who is Facing the Problem?

- **Students & Graduates:** Unaware of specialized institutional quotas (e.g., IIT Dharwad AI Technocrat, AICTE Pragati, Maharashtra minority fee waivers) or credit-linked interest subsidies (PM-Vidyalaxmi).
- **Marginalized & Minority Communities:** Citizens from Jain, Muslim, Buddhist, Sikh, Parsi, Christian, SC/ST, and OBC communities who meet constitutional quota criteria but lack knowledge of active schemes.
- **Rural Workers & Farmers:** Smallholders needing income support (PM-KISAN), crop insurance (PMFBY), or employment guarantees (MGNREGA).
- **Women & Homemakers:** Mothers seeking safe motherhood incentives (PMMVY, JSY) and clean cooking connections (PM Ujjwala).
- **Micro-Entrepreneurs & Street Vendors:** Informal workers seeking collateral-free micro-credit (PM SVANidhi, MUDRA Yojana, PMEGP).

---

## 3. What is Difficult About the Current Experience?

1. **Search-First Trap:** Portals require citizens to search by scheme name or guess the exact administrative department.
2. **Dead-End Questionnaires:** Answering 8–10 generic category dropdowns frequently ends in zero results without explaining which specific criterion disqualified the citizen.
3. **Information Asymmetry:** Scheme guidelines are published as dense 40-page PDF gazettes written in complex bureaucratic jargon.
4. **Document Friction:** Citizens arrive at application deadlines only to discover missing certificates that could have been fetched months earlier via DigiLocker.

---

## 4. What Did We Change & Why is It Better?

| Current Public Service Experience | Mera Haq Experience |
|---|---|
| Citizen must guess scheme name or department | Continuous proactive matching from a 60-second profile |
| "No schemes found" dead-ends | Multi-tier opportunities (Strong, Check, Future) with explanations |
| Opaque black-box rejections | Signature **"Why Do I Match?"** published rule vs citizen profile matrix |
| 40-page legal PDF gazettes | Plain-language AI-translated citizen summaries |
| Manual physical document scramble | Pre-application checklist with simulated DigiLocker one-tap fetch |
| Desktop-only or fragmented portals | Responsive UMANG design (320px mobile to 4K desktop) |

---

## 5. What Works Today vs. What is Mocked (Honesty & Disclosures)

In strict adherence to the builder brief, **no real government servers are scraped, modified, or compromised, and zero real citizen PII is stored.**

### What Works End-to-End Today:
- ✅ **Complete Citizen Flow:** Landing comparison → Profile wizard → Deterministic matching radar → Opportunity Map → "Why Do I Match?" matrix → Pre-application checklist → Safe official handoff.
- ✅ **Deterministic Eligibility Engine:** 100% real published eligibility rules evaluated across 39 Central, State, and Institutional schemes.
- ✅ **Dual-Runtime Architecture:** Interactive React 18 frontend + fallback Vanilla JS runtime with identical state, logic, and dataset parity.
- ✅ **14 Automated In-Browser Test Cases:** Live test harness (`#/mera-haq/tests`) validating age limits, gender restrictions, minority tags, income ceilings, domicile constraints, and dataset integrity.
- ✅ **14-Category Scrollable Filter Bar:** Real-time filtering across Health, Food, Housing, Education, Training, Employment, Agriculture, Utilities, Women & Child, Pension, and Disability.
- ✅ **Mobile-First Responsive Layout:** Off-canvas drawer navigation, touch targets (≥44px), bottom-sheet modals, and fluid typography.

### What is Mocked / Simulated:
- 🔹 **DigiLocker / APAAR Handshake:** Simulated 1.5s digital fetch and credential verification using synthetic APAAR ID (`279903493988`) and mock verifiable credentials (`data/mock_digilocker.json`).
- 🔹 **Citizen Persona:** Synthetic profile ("Neeraj Alkesh Karnavat", 23, Jain Minority, Maharashtra) used for safe repeatable judging.
- 🔹 **Official Destination Handoff:** Simulated interstitial trust modal before directing the user to official verified portal URLs (e.g., `https://pmjay.gov.in/`, `https://pmkisan.gov.in/`, `https://pmegp.msme.gov.in/`).

---

## 6. How the Idea Works Safely at Large Scale (1.4B Citizens)

1. **Client-Side Edge Evaluation:** All matching logic executes client-side within the citizen's browser or mobile app. Zero personal profiling data is retained on central servers, ensuring absolute privacy compliance under the Digital Personal Data Protection (DPDP) Act.
2. **Decentralized DigiLocker Handshake:** Verified credentials (Aadhaar, Marksheets, Caste/Income certificates) are pulled on-demand using standard OIDC / DigiLocker APIs with user consent.
3. **Structured Scheme Schema (OpenAPI):** Government ministries can publish structured JSON eligibility manifests (`data/opportunities.json`) alongside Gazette notifications, allowing instant national synchronization.

---

## 7. 2-Minute Video Walkthrough Script

- **[0:00 - 0:15] The Hook & Citizen Problem:** Show standard UMANG filter ending in "No schemes found". Explain the problem of discovery fragmentation.
- **[0:15 - 0:45] The 60-Second Citizen Journey:** Launch Mera Haq, click "60s Demo (Neeraj)", watch the deterministic matching radar evaluate 39 schemes across India.
- **[0:45 - 1:15] Opportunity Map & "Why Do I Match?":** Explore the 6 personalized matches (IIT Dharwad AI Technocrat, Maharashtra Minority Support, PMKVY). Click "Why do I match?" to demonstrate the rule-by-rule published criteria vs profile audit.
- **[1:15 - 1:40] Application Readiness & DigiLocker Fetch:** Open pre-application checklist, click "Fetch from DigiLocker", show live progress bar reaching 100% readiness, inspect official handoff notice.
- **[1:40 - 2:00] Architecture, Test Suite & Safety:** Show live 14-test suite (`#/mera-haq/tests`) passing 100%, explain client-side privacy architecture, mobile responsiveness, and scalability for 1.4B citizens.
