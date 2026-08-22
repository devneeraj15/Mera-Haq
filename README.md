# Mera Haq on UMANG

> *"Government support you may qualify for — without having to know it exists."*

A prototype built for the **"Build What Moves India"** challenge.

---

## 🌟 The Core Problem Solved

A citizen can be eligible for government scholarships, training, subsidies, fee support, loans and other programs, but may never discover them because government opportunities are fragmented across multiple portals, ministries, departments, institutions and state systems.

In traditional search (e.g. standard UMANG filters), the citizen is asked 10 category questions and often ends with:
> **"No schemes found based on your preference"**

**Mera Haq reverses the model:**
1. Citizen creates a lightweight profile
2. Deterministic engine continuously maps central, state & institutional opportunities
3. Personalized opportunity map is generated
4. Citizen inspects signature **"Why Do I Match?"** rule-by-rule breakdowns
5. Citizen verifies required documents and proceeds to the official application destination

---

## 🚀 Instant 60-Second Demo Path

Open `index.html` in any modern web browser (Edge, Chrome, Firefox, Safari). No dependencies or build steps required.

1. **Launch**: Open `index.html` (or click **Mera Haq** in the UMANG sidebar).
2. **Auto-Populate Demo**: Click the orange **"60s Demo (Neeraj)"** floating button or **"Try demo profile (Neeraj, 23)"**.
3. **Matching Radar**: Watch the scanning animation cross-evaluate Central ministries, Maharashtra state schemes, and IIT/AICTE opportunities.
4. **Opportunity Map**: View *"We found 6 opportunities for you"* with 3 Strong matches, 2 Need verification, 1 Future opportunity, and estimated potential value (₹1.35L+).
5. **IIT Dharwad AI Technocrat**: Click **"Why do I match?"** on the top card to see the rule-by-rule published criteria vs. citizen profile audit with plain-language AI explanation.
6. **Application Readiness**: Click **"Check Application Readiness"** to view the document readiness checklist.
7. **Official Application Handoff**: Click **"Continue to official application"** to see the disclaimer and safe handoff to the official portal.
8. **Save Opportunity**: Click **"Save"** to bookmark it into the persistent **Saved** section.
9. **Problem Contrast**: Click **Schemes** in the left sidebar to experience the existing UMANG filter flow that produces the *"No schemes found"* state.
10. **Automated Verification**: Click **"Run Automated Tests"** (or visit `#/mera-haq/tests`) to execute all 10 unit test cases live in the browser.

---

## 🏛️ UMANG Shell Integration

- **Exact Dark Theme**: Matching the official UMANG web portal (`web.umang.gov.in`) with deep slate backgrounds (`#0c0f17`), elevated surfaces (`#161b29`), and UMANG blue (`#2563eb`).
- **Sidebar Integration**: Added **Mera Haq** directly underneath **Schemes** in the left navigation sidebar with a `NEW` indicator badge.
- **Top Header**: Complete with hamburger drawer toggle, UMANG logo, search bar, ISL Chatbot button, accessibility controls, notification badge, and citizen avatar.
- **Mobile Responsive**: Full drawer sidebar, touch targets, and responsive card layouts across mobile, tablet, and desktop viewports.

---

## 🧠 AI / OpenAI Pipeline Architecture

```
Government Program Notifications & Gazettes
                ↓
    AI-Assisted Rule Extraction (OpenAI / Codex)
                ↓
    Structured Opportunity Eligibility Schema
                ↓
    Human / Admin Verification & Grounding
                ↓
    Deterministic Client-Side Eligibility Engine
                ↓
    Plain-Language Citizen Explanation (`generateEligibilityExplanation`)
```

- **Deterministic Authority**: Final prototype matching is 100% deterministic (evaluated via pure boolean rule logic). AI is utilized for semantic rule normalization, policy summarization, and translating complex bureaucratic eligibility criteria into clear, citizen-friendly explanations.

---

## 📋 Curated Real Opportunities Dataset (17 Schemes)

1. **PM-VIKAS AI Technocrat — IIT Dharwad** (*Central / Training*)
2. **Maharashtra Minority Professional Education Support** (*Maharashtra / Fee Support*)
3. **Maharashtra PMKUVA (Pramod Mahajan Kaushalya Vikas Abhiyan)** (*Maharashtra / Training*)
4. **PMKVY 4.0 Future-Tech Courses** (*Central / Training*)
5. **PM-Vidyalaxmi Education Loan Support** (*Central / Loan*)
6. **PM-Vidyalaxmi 3% Interest Subvention Scheme** (*Central / Interest Subsidy*)
7. **Minority Merit-Cum-Means Scholarship** (*Central / Scholarship*)
8. **Rajarshi Chhatrapati Shahu Maharaj EBC/EWS Support** (*Maharashtra / Fee Support*)
9. **Dr Panjabrao Deshmukh Vasatigruh Nirvah Bhatta** (*Maharashtra / Fee Support / Hostel*)
10. **Maharashtra Foreign Scholarship for Higher Studies** (*Maharashtra / Scholarship*)
11. **PM-USP Central Sector Scholarship** (*Central / Scholarship*)
12. **Central Sector Interest Subsidy Scheme (CSIS)** (*Central / Interest Subsidy*)
13. **AICTE Saksham Scholarship for Specially Abled Students** (*Central / Scholarship*)
14. **AICTE Swanath Scholarship Scheme** (*Central / Scholarship*)
15. **AICTE Pragati Scholarship for Girls** (*Central / Scholarship*)
16. **NAPS-2 Technology Apprenticeship Pathway** (*Central / Training & Stipend*)
17. **PMEGP Prime Minister Employment Generation Programme** (*Central / Entrepreneurship Subsidy*)

---

## 🧪 Automated Verification Suite (10 Test Cases)

1. `Neeraj demo profile → IIT Dharwad AI Technocrat = Strong Match`
2. `Underage user (13 yrs) → Age-restricted training = Not Eligible`
3. `Male profile → AICTE Pragati (Female only) = Not Eligible with reason`
4. `Missing income profile → Income-capped support = Needs Verification`
5. `Non-Maharashtra state (Karnataka) → MahaDBT Support = Not Eligible`
6. `Minority requirement + Jain community = Match recognized accurately`
7. `Graduated citizen → Current student scheme = Future Opportunity flag`
8. `Income boundary test (> ₹8L) → Capped scheme = Not Eligible`
9. `Multi-opportunity matching returns expected dataset volume (17 schemes)`
10. `Saved opportunity persistence via localStorage`

---

## 🛡️ Honesty & Disclaimers

- Mera Haq is a prototype built for the *Build What Moves India* challenge and is not an official government website.
- Opportunity data is curated from publicly published guidelines and gazettes.
- Synthetic citizen data is used throughout. No Aadhaar, PAN, OTP, or real government logins are requested or accessed.
- Final eligibility, document acceptance, and selection are determined exclusively by the responsible government departments and premier institutions.
