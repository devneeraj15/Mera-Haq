# Mera Haq on UMANG

> *"Government support you may qualify for — without having to know it exists."*

A working prototype built for the **"Build What Moves India"** challenge.

🌐 **Live Deployment:** [https://devneeraj15.github.io/Mera-Haq/](https://devneeraj15.github.io/Mera-Haq/)  
📦 **GitHub Repository:** [https://github.com/devneeraj15/Mera-Haq](https://github.com/devneeraj15/Mera-Haq)  
📄 **Submission Brief & 250-Word Summary:** [`SUBMISSION.md`](./SUBMISSION.md)  
🔬 **Verifiable Mock Data & Test Documentation:** [`VERIFICATION.md`](./VERIFICATION.md)

---

## 🌟 The Core Problem Solved

A citizen can be eligible for government scholarships, training, health coverage, food support, housing subsidies, pensions, and business loans, but may never discover them because government support is fragmented across multiple portals, ministries, departments, and state systems.

In traditional search (e.g. standard UMANG filters), the citizen is asked 10 generic category questions and often ends with:
> **"No schemes found based on your preference"**

**Mera Haq reverses this model:**
1. **Lightweight Profile (60s):** Citizen enters minimal demographics (optionally linked to DigiLocker / APAAR ID).
2. **Deterministic Discovery:** A client-side deterministic engine maps opportunities across Central ministries, State schemes, and Premier institutions.
3. **Personalized Opportunity Map:** Grouped by match strength (⭐ Strong matches, 🔍 Verification needed, ⏱ Future opportunities, 🌐 Open to All).
4. **Signature "Why Do I Match?":** Rule-by-rule published criteria vs. citizen profile audit with plain-language explanations.
5. **Document Readiness with DigiLocker:** One-tap digital collection of marksheets, caste/income certificates, and academic credentials before safe handoff to official portals.

---

## 🚀 Instant 60-Second Demo Path

Open the live URL or `index.html` in any browser:

1. **Launch:** Open `https://devneeraj15.github.io/Mera-Haq/`
2. **Auto-Populate Demo:** Click the orange **"60s Demo (Neeraj)"** floating button.
3. **Matching Radar:** Watch the scanning animation cross-evaluate 39 opportunities across 9 government sectors.
4. **Opportunity Map:** View curated matches with estimated potential value (e.g., ₹1.35L+).
5. **"Why Do I Match?" Matrix:** Click **"Why do I match?"** on *PM-VIKAS AI Technocrat — IIT Dharwad* to inspect the rule audit table.
6. **Application Readiness & DigiLocker:** Click **"Check Application Readiness"** and press **"Fetch all from DigiLocker"** to witness simulated digital credential verification.
7. **Problem Contrast:** Click **Schemes** in the left sidebar to experience the traditional UMANG filter flow that produces the *"No schemes found"* state.
8. **Automated Verification:** Click **"Run Automated Tests"** (or visit `#/mera-haq/tests`) to execute all 14 unit test cases live in the browser.

---

## 📁 Verifiable Mock Files & Dataset Architecture

All mock data and schema files are organized under the [`data/`](./data) directory for easy reviewer inspection:

| File | Description | Link |
|---|---|---|
| [`data/opportunities.json`](./data/opportunities.json) | Complete verified 39-scheme dataset with eligibility rules, financial benefits, required documents, and official source URLs. | [View JSON](./data/opportunities.json) |
| [`data/mock_profiles.json`](./data/mock_profiles.json) | 6 diverse synthetic citizen personas (Graduate, Rural Student, Farmer, Expectant Mother, Street Vendor, Specially Abled). | [View Personas](./data/mock_profiles.json) |
| [`data/mock_digilocker.json`](./data/mock_digilocker.json) | Synthetic DigiLocker & Academic Bank of Credits (ABC) vault records and mock API handshakes. | [View DigiLocker Vault](./data/mock_digilocker.json) |
| [`SUBMISSION.md`](./SUBMISSION.md) | Official challenge submission brief, 250-word summary, and 2-minute video script. | [View Submission](./SUBMISSION.md) |
| [`VERIFICATION.md`](./VERIFICATION.md) | Test suite verification steps, benchmark personas, and government source references. | [View Verification](./VERIFICATION.md) |

---

## 📋 Comprehensive 39-Scheme Dataset (All 9 Support Sectors)

1. **Health Insurance:** PM-JAY Ayushman Bharat (₹5L/yr cashless), ESIC Health Insurance
2. **Food Security:** PM Garib Kalyan Anna Yojana (Free grains), NFSA PDS Subsidised Ration
3. **Housing:** PMAY-Urban CLSS (₹2.67L subsidy), PMAY-Gramin (₹1.3L construction grant)
4. **Agriculture:** PM-KISAN (₹6,000/yr), Kisan Credit Card (4% interest), PM Fasal Bima Yojana
5. **Utilities:** PM Ujjwala Yojana (Free LPG connection), Saubhagya Free Electricity
6. **Women & Child:** Janani Suraksha Yojana, PM Matru Vandana Yojana (PMMVY), Sukanya Samriddhi (8.2% tax-free)
7. **Employment & Credit:** PM SVANidhi (₹50k micro-credit), Startup India (3-yr tax holiday), PM MUDRA Yojana (₹10L), PMEGP (₹50L subsidy), MGNREGA (100 days work)
8. **Pensions:** PM Shram Yogi Maan-dhan (₹3,000/mo), Atal Pension Yojana (₹1k-5k/mo), PM Kisan Maan-dhan
9. **Education & Skills:** IIT Dharwad AI Technocrat, Maha Minority Higher Edu, PMKVY 4.0 Future Tech, PM-Vidyalaxmi (₹10L loan + 3% subvention), CSIS, NSP CSSS, AICTE Pragati / Saksham / Swanath, Maharashtra PMKUVA, NAPS-2 Apprenticeship, ADIP Assistive Devices

---

## 🧪 Live Automated Test Harness (14 Test Cases)

1. `Neeraj demo profile → IIT Dharwad AI Technocrat = Strong Match`
2. `Underage citizen (13 yrs) → Age-restricted training = Not Eligible`
3. `Male profile → AICTE Pragati (Female only) = Not Eligible with reason`
4. `Missing income profile → Income-capped support = Needs Verification`
5. `Non-Maharashtra state (Karnataka) → MahaDBT Support = Not Eligible`
6. `Minority requirement + Jain community = Match recognized accurately`
7. `Graduated citizen → Current student scheme = Future Opportunity flag`
8. `Income boundary test (> ₹8L) → Capped scheme = Not Eligible`
9. `Multi-opportunity dataset volume = 39 schemes (all tiers)`
10. `Saved opportunity persistence via localStorage`
11. `Universal opportunity filter (openToAll) accurately isolates non-quota schemes`
12. `DigiLocker & APAAR ID Academic Registry verification`
13. `PM-JAY correctly fails for above-BPL income profile (₹5–8L)`
14. `Life Situation farmer tag correctly matches PM-KISAN for farmer profile`

---

## 🛡️ Honesty & Safe Architecture

- **Privacy by Design:** Zero sensitive citizen PII is stored. All matching logic executes client-side on the user's device.
- **Official Destination Handshaking:** Mera Haq acts purely as an empowering discovery layer and hands off to verified government portals.
- **Synthetic Data:** Strictly synthetic credentials and demo personas are used in accordance with hackathon rules.
