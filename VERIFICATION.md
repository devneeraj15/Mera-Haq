# Mera Haq — Verifiable Mock-Up & Test Documentation

This document provides complete instructions and verifiable reference data for judges and reviewers evaluating the **Mera Haq on UMANG** prototype.

---

## 1. Live Interactive Verification Options

Reviewers can verify the application through three distinct methods:

### Method A: In-Browser Live Test Suite (Zero Setup)
1. Open the live deployment: [https://devneeraj15.github.io/Mera-Haq/#/mera-haq/tests](https://devneeraj15.github.io/Mera-Haq/#/mera-haq/tests)
2. All **14 automated deterministic test cases** execute live in real-time, validating:
   - Full dataset volume integrity (39 schemes across 9 categories)
   - Age boundary conditions (e.g. 13-year-old underage rejection)
   - Gender quota rules (e.g. AICTE Pragati female restriction)
   - Domicile constraints (Maharashtra vs other states)
   - Minority community identification (Jain, Muslim, Buddhist, etc.)
   - Income ceiling thresholds (≤ ₹2.5L BPL vs > ₹8L)
   - Life Situation dynamic matching (Farmer → PM-KISAN, Street Vendor → PM-SVANidhi, Pregnant → PMMVY)
   - localStorage persistence of saved opportunities

### Method B: Interactive 60-Second Demo Walkthrough
1. Visit [https://devneeraj15.github.io/Mera-Haq/](https://devneeraj15.github.io/Mera-Haq/)
2. Click the floating orange button **"60s Demo (Neeraj)"** on any screen.
3. Observe instant deterministic matching across all 39 opportunities.
4. Click **"Why do I match?"** on *PM-VIKAS AI Technocrat — IIT Dharwad*.
5. Click **"Check Application Readiness"** and test the **"Fetch all from DigiLocker"** digital handshake simulation.

### Method C: Offline Local Inspection
1. Clone the repository: `git clone https://github.com/devneeraj15/Mera-Haq.git`
2. Open `index.html` in any browser. No web server, Node.js, or compilation required.

---

## 2. Verifiable Synthetic Persona Benchmarks (`data/mock_profiles.json`)

| Persona ID | Name & Demographic | Income & Category | Life Situation | Expected Primary Matches |
|---|---|---|---|---|
| `persona-neeraj` | Neeraj Karnavat (23M, B.Tech Graduate, Urban MH) | ₹8L (Jain Minority) | Standard | IIT Dharwad AI Technocrat, Maha Minority Higher Edu, PMKVY 4.0, PM-Vidyalaxmi, Startup India, APY |
| `persona-priya` | Priya Patil (19F, 12th Pass Rural Student, MH) | ₹1.8L (EWS) | BPL Card, Farmer family | Panjabrao Deshmukh Hostel Allowance, EBC Freeship, AICTE Pragati, PMGKAY, PM-KISAN |
| `persona-ramesh` | Ramesh Shinde (36M, 10th Pass Farmer, Rural MH) | ₹1.4L (OBC) | Farmer, BPL Card | PM-KISAN, Kisan Credit Card (KCC), PM Fasal Bima Yojana, PM Kisan Maan-dhan, PMGKAY |
| `persona-sunita` | Sunita Devi (24F, 10th Pass Homemaker, Rural MH) | ₹1.2L (SC) | Pregnant, BPL Card | PMMVY Maternity Benefit, Janani Suraksha Yojana, PM-JAY Ayushman Bharat, PM Ujjwala LPG, PMGKAY |
| `persona-manoj` | Manoj Gupta (29M, 12th Pass Urban Self-Employed) | ₹2.2L (General) | Street Vendor, Unorganized Worker | PM SVANidhi Micro-Credit, PM Shram Yogi Maan-dhan, PMKUVA Free Training, APY |
| `persona-anjali` | Anjali Sundaram (21F, Diploma Student, Urban MH) | ₹2.8L (General) | Divyangjan (Disability ≥40%) | AICTE Saksham Scholarship, ADIP Assistive Devices, PMKVY 4.0 Future Tech, PMKUVA |

---

## 3. Scheme Dataset Verification Sources (`data/opportunities.json`)

All 39 opportunities mapped in Mera Haq are derived from active public government gazettes, portal notifications, and premier institute guidelines:

| Category | Schemes Included | Primary Authorizing Department / Official URL |
|---|---|---|
| **Health Insurance** | PM-JAY Ayushman Bharat, ESIC Health Insurance | National Health Authority (`pmjay.gov.in`), ESIC (`esic.in`) |
| **Food Security** | PM Garib Kalyan Anna Yojana, NFSA PDS Ration | Ministry of Consumer Affairs & Food (`nfsa.gov.in`) |
| **Housing** | PMAY-Urban (CLSS), PMAY-Gramin | MoHUA (`pmaymis.gov.in`), MoRD (`pmayg.nic.in`) |
| **Agriculture** | PM-KISAN, Kisan Credit Card (KCC), PM Fasal Bima | Ministry of Agriculture (`pmkisan.gov.in`, `pmfby.gov.in`) |
| **Utilities** | PM Ujjwala LPG, Saubhagya Electricity Scheme | MoPNG (`pmuy.gov.in`), Ministry of Power (`saubhagya.gov.in`) |
| **Women & Child** | Janani Suraksha Yojana, PMMVY Maternity, Sukanya Samriddhi | MoHFW (`nhm.gov.in`), WCD (`pmmvy-cas.nic.in`), India Post |
| **Employment & Credit** | PM SVANidhi, Startup India Recognition, PM MUDRA Yojana, PMEGP, MGNREGA | MoHUA (`pmsvanidhi.mohua.gov.in`), DPIIT, DFS (`mudra.org.in`) |
| **Pensions** | PM Shram Yogi Maan-dhan, Atal Pension Yojana (APY), PM Kisan Maan-dhan | Ministry of Labour (`maandhan.in`), PFRDA (`npscra.nsdl.co.in`) |
| **Education & Scholarships** | IIT Dharwad AI Technocrat, Maha Minority Higher Edu, Rajarshi Shahu EBC, NSP CSSS, AICTE Pragati/Saksham/Swanath | MoMA / IIT Dharwad, MahaDBT (`mahadbt.maharashtra.gov.in`), AICTE |
| **Training & Skills** | PMKVY 4.0 Future Tech, Maharashtra PMKUVA, NAPS-2 Apprenticeship | MSDE / NSDC (`pmkvyofficial.org`), MSSDS (`mahaswayam.gov.in`) |

---

## 4. Verifiable DigiLocker Academic & Identity Mock Vault (`data/mock_digilocker.json`)

The DigiLocker simulation incorporates standard Digital India credential payloads:
- **APAAR ID Registry:** `279903493988` mapped to Academic Bank of Credits account `ABC-2023-MH-994810` (164 credits, SPPU Pune).
- **Verifiable Credentials:**
  1. Degree Certificate: `in.gov.digilocker.sppu-deg-2025-08194`
  2. Class 10 (SSC) Marksheet: `in.gov.digilocker.msbshse-ssc-2019-74819`
  3. Class 12 (HSC) Marksheet: `in.gov.digilocker.msbshse-hsc-2021-39410`
  4. Maharashtra Domicile Certificate: `in.gov.digilocker.maha-dom-2022-849103`
  5. Minority Self-Declaration: `in.gov.digilocker.self-min-jain-2023`
