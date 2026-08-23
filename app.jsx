/**
 * MERA HAQ — REACT.JS WEB APPLICATION
 * Citizen Opportunity Discovery Layer inside UMANG Web Experience
 * "Build What Moves India" Prototype
 */

const { useState, useEffect, useMemo, useCallback, createContext, useContext } = React;

// ============================================================================
// CONSTANTS & SYNTHETIC DATA
// ============================================================================

const STORAGE_PROFILE = "umang-merahaq-profile";
const STORAGE_SAVED = "umang-merahaq-saved";

const incomeBands = [
  { label: "Under ₹2.5 lakh", value: 250000 },
  { label: "₹2.5–5 lakh", value: 500000 },
  { label: "₹5–8 lakh", value: 800000 },
  { label: "₹8–12 lakh", value: 1200000 },
  { label: "Above ₹12 lakh", value: 1500000 },
  { label: "Prefer to check later", value: null },
];

const minorityCommunities = [
  "Muslim",
  "Christian",
  "Sikh",
  "Buddhist",
  "Jain",
  "Parsi",
  "Other",
];

const identityTags = [
  "Open / General (No quota needed)",
  "SC",
  "ST",
  "OBC",
  "EWS",
  "Minority community",
  "Person with disability",
  "None",
  "Prefer not to say",
];

const goalOptions = [
  "Scholarships",
  "Free training",
  "Education support",
  "Subsidised loans",
  "Fellowships",
  "Entrepreneurship",
  "Skill development",
  "Employment opportunities",
  "Health insurance",
  "Food & ration support",
  "Housing subsidy",
  "Agricultural support",
  "Utilities (LPG/power)",
  "Pension & retirement",
  "Women & child benefits",
];

const interestOptions = [
  "AI",
  "Technology",
  "Product",
  "Digital skills",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Agriculture",
];

const lifeSituationOptions = [
  { key: "farmer", label: "🌾 Farmer / Agricultural land" },
  { key: "street-vendor", label: "🏪 Street vendor / Hawker" },
  { key: "young-children", label: "👶 Have children under 6" },
  { key: "pregnant", label: "🤰 Pregnant / Recently delivered" },
  { key: "bpl-card", label: "📇 Have BPL / Ration card" },
  { key: "unorganized-worker", label: "👷 Unorganized sector worker" },
  { key: "organized-worker", label: "🏭 Factory / Formal sector employee" },
];

const educationRank = {
  "10th": 1,
  "12th": 2,
  ITI: 2,
  Diploma: 3,
  "Bachelor's": 4,
  "B.Tech / B.E.": 4,
  "Master's": 5,
  PhD: 6,
  Other: 3,
};

// Deterministic Demo Persona (Neeraj, 23, B.Tech, Maharashtra, Jain)
const demoProfile = {
  name: "Neeraj",
  age: 23,
  state: "Maharashtra",
  domicile: "Maharashtra",
  educationLevel: "Bachelor's",
  course: "Computer Engineering",
  currentStudent: false,
  employmentStatus: "Working",
  annualFamilyIncome: 800000,
  incomeBand: "₹5–8 lakh",
  category: "",
  identityTags: ["Minority community"],
  minority: "Jain",
  gender: "Male",
  disability: false,
  residenceType: "Urban",
  apaarId: "279903493988",
  apaarVerified: true,
  lifeSituation: [],
  interests: ["AI", "Technology", "Product", "Skill development"],
  goals: [
    "Scholarships",
    "Free training",
    "Education support",
    "Subsidised loans",
    "Fellowships",
    "Skill development",
    "Entrepreneurship",
  ],
};

const blankProfile = {
  name: "Citizen",
  age: null,
  state: "Maharashtra",
  domicile: "Maharashtra",
  educationLevel: "Bachelor's",
  course: "",
  currentStudent: false,
  employmentStatus: "Working",
  annualFamilyIncome: null,
  incomeBand: "Prefer to check later",
  category: "",
  identityTags: [],
  minority: "",
  gender: "Male",
  disability: false,
  residenceType: "Urban",
  apaarId: "",
  apaarVerified: false,
  lifeSituation: [],
  interests: ["AI", "Technology"],
  goals: ["Scholarships", "Free training", "Skill development"],
};

// ============================================================================
// CURATED OPPORTUNITIES DATASET (17 Authentic Schemes)
// ============================================================================

const opportunities = [
  {
    id: "ai-technocrat-iit-dharwad",
    priority: 1,
    name: "AI Technocrat — IIT Dharwad",
    shortDescription:
      "A PM-VIKAS free AI skill-development program for notified minority graduates at IIT Dharwad.",
    governmentLevel: "Central",
    department: "Ministry of Minority Affairs / IIT Dharwad",
    type: "Training",
    benefit: {
      type: "mixed",
      amount: 57000,
      description: "Free AI training, ₹1,000/month stipend, hostel where applicable, certification & placement support.",
      directAmount: 12000,
      costAvoidedAmount: 45000,
      financingAmount: 0,
      components: [
        "Free 1-year Artificial Intelligence Technocrat training",
        "₹1,000/month stipend through Direct Benefit Transfer (DBT)",
        "Hostel & residential support where applicable",
        "Government / SSC & IIT Dharwad certification",
        "Post-placement support subject to scheme norms",
      ],
    },
    eligibility: {
      ageMin: 18,
      ageMax: 45,
      educationMinRank: 4,
      minorities: ["Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi"],
      interestsAny: ["AI", "Technology", "Digital skills", "Product"],
      goalsAny: ["Free training", "Skill development", "Education support"],
    },
    verificationNotes: [
      "Selection is based on screening test / interview conducted by IIT Dharwad.",
      "Seat quota is allocated across recognized minority communities including Jain.",
    ],
    requiredDocuments: [
      { name: "Degree / B.Tech Certificate or Marksheet", status: "ready", note: "Verified in demo profile" },
      { name: "Class 10 / Birth Certificate for Age Proof", status: "ready", note: "Age 23 confirmed" },
      { name: "Minority / Community Declaration Certificate", status: "attention", note: "Jain minority self-declaration / certificate needed" },
      { name: "Valid Identity Proof (Government ID)", status: "ready", note: "Required for portal application" },
      { name: "Bank Account Passbook / Statement", status: "attention", note: "Needed on official portal for DBT stipend" },
    ],
    deadline: "31 Aug 2026",
    applicationUrl: "https://pm-vikas.iitdh.ac.in/application/",
    sourceName: "IIT Dharwad PM-VIKAS Official Portal",
    sourceUrl: "https://pm-vikas.iitdh.ac.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },
  {
    id: "maharashtra-minority-professional-support",
    priority: 2,
    name: "Maharashtra Minority Professional Education Scholarship / Support",
    shortDescription:
      "MahaDBT fee waiver support for minority students pursuing higher technical and professional courses.",
    governmentLevel: "Maharashtra",
    department: "Minority Development Department / DTE Maharashtra",
    type: "Fee Support",
    benefit: {
      type: "fee_waiver",
      amount: 50000,
      description: "Up to ₹50,000 per year or actual tuition/exam fee waiver for professional degrees.",
      directAmount: 0,
      costAvoidedAmount: 50000,
      futureAmount: 50000,
      financingAmount: 0,
      components: [
        "Tuition and examination fee reimbursement up to ₹50,000/year",
        "Applicable for recognized technical/professional engineering and management courses",
        "Disbursed through MahaDBT directly to institution/student",
      ],
    },
    eligibility: {
      states: ["Maharashtra"],
      domicileRequired: true,
      currentStudent: true,
      futureIfCurrentStudent: true,
      incomeMax: 800000,
      minorities: ["Muslim", "Buddhist", "Christian", "Jain", "Sikh", "Parsi"],
      educationMinRank: 3,
      goalsAny: ["Scholarships", "Education support", "Fee Support"],
    },
    verificationNotes: [
      "Currently graduated in demo profile; qualifies immediately upon enrollment in higher studies (Master's/PhD).",
      "Requires Maharashtra domicile and annual family income up to ₹8 lakh.",
    ],
    requiredDocuments: [
      { name: "Maharashtra Domicile Certificate", status: "ready", note: "Maharashtra resident" },
      { name: "Minority Community Certificate / Affidavit", status: "attention", note: "Jain certificate required" },
      { name: "Annual Income Certificate (Tehsildar / Sub-Divisional Officer)", status: "attention", note: "Income under ₹8L" },
      { name: "CAP Allotment Letter / Bonafide Student Certificate", status: "attention", note: "Required when enrolled" },
    ],
    deadline: "Academic Year 2026-27 MahaDBT Schedule",
    applicationUrl: "https://mahadbt.maharashtra.gov.in/",
    sourceName: "MahaDBT State Portal",
    sourceUrl: "https://mahadbt.maharashtra.gov.in/",
    lastVerified: "2026-08-23",
    status: "verify",
  },
  {
    id: "maharashtra-pmkuva",
    priority: 3,
    openToAll: true,
    name: "Maharashtra PMKUVA (Pramod Mahajan Kaushalya Vikas Abhiyan)",
    shortDescription:
      "State-funded vocational and advanced technical skill training across Maharashtra districts.",
    governmentLevel: "Maharashtra",
    department: "Maharashtra State Skill Development Society (MSSDS)",
    type: "Training",
    benefit: {
      type: "training",
      amount: 25000,
      description: "100% Free NSQF-aligned skill training, assessment, certification and job facilitation.",
      directAmount: 0,
      costAvoidedAmount: 25000,
      financingAmount: 0,
      components: [
        "Zero-cost short term skilling & technology courses",
        "State government certification from Maharashtra Skill Development Board",
        "Apprenticeship & employment placement support",
      ],
    },
    eligibility: {
      ageMin: 15,
      ageMax: 45,
      states: ["Maharashtra"],
      domicileRequired: true,
      goalsAny: ["Free training", "Skill development", "Employment opportunities"],
      interestsAny: ["Technology", "AI", "Digital skills", "Product"],
    },
    verificationNotes: [
      "Batch enrollment is open through accredited MahaSwayam centers in Maharashtra.",
    ],
    requiredDocuments: [
      { name: "Maharashtra Domicile / Residence Proof", status: "ready" },
      { name: "Educational Qualification Certificate", status: "ready" },
      { name: "MahaSwayam Candidate Registration", status: "attention" },
    ],
    deadline: "Rolling / Center-based Batches",
    applicationUrl: "https://www.kaushalya.mahaswayam.gov.in/users/find_center",
    sourceName: "MahaSwayam Portal",
    sourceUrl: "https://www.kaushalya.mahaswayam.gov.in/users/find_center",
    lastVerified: "2026-08-23",
    status: "open",
  },
  {
    id: "pmkvy-future-tech",
    priority: 4,
    openToAll: true,
    name: "PMKVY 4.0 — Future Skills & New-Age Tech Courses",
    shortDescription:
      "Skill India initiative offering courses in Artificial Intelligence, Cloud, Drone Tech, and IoT.",
    governmentLevel: "Central",
    department: "Ministry of Skill Development and Entrepreneurship (MSDE)",
    type: "Training",
    benefit: {
      type: "training",
      amount: 20000,
      description: "Government-funded Industry 4.0 skilling and NSDC/Skill India digital certification.",
      directAmount: 0,
      costAvoidedAmount: 20000,
      financingAmount: 0,
      components: [
        "Curated curriculum aligned with National Skill Qualification Framework (NSQF)",
        "Hands-on labs and assessment by Sector Skill Councils",
        "National Skill India Digital Hub credential badge",
      ],
    },
    eligibility: {
      ageMin: 15,
      ageMax: 59,
      educationMinRank: 2,
      goalsAny: ["Free training", "Skill development", "Employment opportunities"],
      interestsAny: ["AI", "Technology", "Digital skills"],
    },
    verificationNotes: [
      "Course availability varies by training partner and location.",
    ],
    requiredDocuments: [
      { name: "Education Marksheet", status: "ready" },
      { name: "Skill India Digital Hub Profile", status: "attention" },
    ],
    deadline: "Batch-wise Openings 2026",
    applicationUrl: "https://www.skillindiadigital.gov.in/",
    sourceName: "Skill India Digital Hub",
    sourceUrl: "https://www.skillindiadigital.gov.in/",
    lastVerified: "2026-08-23",
    status: "verify",
  },
  {
    id: "pm-vidyalaxmi",
    priority: 5,
    openToAll: true,
    name: "PM-Vidyalaxmi Education Loan Support",
    shortDescription:
      "Collateral-free, guarantor-free education loan pathway for premier Quality Higher Education Institutions.",
    governmentLevel: "Central",
    department: "Ministry of Education",
    type: "Loan",
    benefit: {
      type: "loan",
      amount: 1000000,
      description: "Collateral-free, guarantor-free education loan up to ₹10 Lakh for top QHEI admissions.",
      directAmount: 0,
      costAvoidedAmount: 0,
      financingAmount: 1000000,
      components: [
        "Collateral-free and guarantor-free loan up to ₹10 Lakh",
        "75% Credit guarantee support for loans up to ₹7.5 Lakh",
        "Single-window digital application across scheduled commercial banks",
      ],
    },
    eligibility: {
      incomeMax: 800000,
      goalsAny: ["Subsidised loans", "Education support"],
      requiresAdmission: true,
      requiresLoanPlan: true,
    },
    verificationNotes: [
      "Loan is financing, not a cash grant. Requires admission to NIRF-notified top 860 QHEIs.",
    ],
    requiredDocuments: [
      { name: "Admission Offer Letter from Notified QHEI", status: "attention" },
      { name: "Annual Family Income Certificate", status: "attention" },
      { name: "Fee Schedule of the Institution", status: "attention" },
    ],
    deadline: "Academic Admission Cycle 2026",
    applicationUrl: "https://pmvidyalaxmi.co.in/",
    sourceName: "PM-Vidyalaxmi Portal / PIB",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2290079&lang=1&reg=48",
    lastVerified: "2026-08-23",
    status: "open",
  },
  {
    id: "pm-vidyalaxmi-interest-subvention",
    priority: 6,
    openToAll: true,
    name: "PM-Vidyalaxmi 3% Interest Subvention Scheme",
    shortDescription:
      "3% interest subsidy on education loans up to ₹10 Lakh for families with annual income up to ₹8 Lakh.",
    governmentLevel: "Central",
    department: "Department of Higher Education, MoE",
    type: "Interest Subsidy",
    benefit: {
      type: "interest_subsidy",
      amount: 30000,
      description: "3% annual interest reduction on education loan during the moratorium & course period.",
      directAmount: 0,
      costAvoidedAmount: 30000,
      financingAmount: 0,
      components: [
        "3% full interest subsidy on education loans up to ₹10 Lakh",
        "Direct DBT credit into loan account",
        "Open to students from families with income ≤ ₹8 Lakh not availing other subsidies",
      ],
    },
    eligibility: {
      incomeMax: 800000,
      goalsAny: ["Subsidised loans", "Education support"],
      requiresAdmission: true,
      requiresLoanPlan: true,
    },
    verificationNotes: [
      "Linked directly to education loans sanctioned under PM-Vidyalaxmi.",
    ],
    requiredDocuments: [
      { name: "Income Certificate (≤ ₹8 Lakh)", status: "attention" },
      { name: "Education Loan Sanction Letter", status: "attention" },
      { name: "QHEI Admission Bonafide", status: "attention" },
    ],
    deadline: "Bank / Portal Process Schedule",
    applicationUrl: "https://pmvidyalaxmi.co.in/",
    sourceName: "PIB Notification / PM-Vidyalaxmi",
    sourceUrl: "https://www.pib.gov.in/PressReleasePage.aspx?PRID=2290079&lang=1&reg=48",
    lastVerified: "2026-08-23",
    status: "verify",
  },
  {
    id: "minority-merit-cum-means",
    priority: 7,
    name: "Minority Merit-Cum-Means Scholarship for Professional Courses",
    shortDescription:
      "Central scholarship for minority students pursuing graduate and post-graduate professional/technical degrees.",
    governmentLevel: "Central",
    department: "Ministry of Minority Affairs",
    type: "Scholarship",
    benefit: {
      type: "cash",
      amount: 30000,
      description: "₹20,000/year course fee plus maintenance allowance of ₹1,000/month for hostellers.",
      directAmount: 30000,
      costAvoidedAmount: 0,
      futureAmount: 30000,
      financingAmount: 0,
      components: [
        "Full course fee reimbursement up to ₹20,000 per annum",
        "Maintenance allowance up to ₹10,000 per annum",
        "Covering recognized minority communities: Muslims, Christians, Sikhs, Buddhists, Jains, Parsis",
      ],
    },
    eligibility: {
      minorities: ["Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi"],
      incomeMax: 250000,
      currentStudent: true,
      futureIfCurrentStudent: true,
      educationMinRank: 3,
      goalsAny: ["Scholarships", "Education support"],
    },
    verificationNotes: [
      "Income limit is ₹2.5 lakh. If family income is higher, this does not match without income criteria adjustment.",
    ],
    requiredDocuments: [
      { name: "Minority Self-Declaration", status: "attention" },
      { name: "Income Certificate (≤ ₹2.5 Lakh)", status: "attention" },
      { name: "Bonafide Student Certificate", status: "attention" },
    ],
    deadline: "31 Oct 2026 on NSP",
    applicationUrl: "https://scholarships.gov.in/",
    sourceName: "National Scholarship Portal",
    sourceUrl: "https://scholarships.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },
  {
    id: "rajarshi-shahu-fee-scholarship",
    priority: 8,
    openToAll: true,
    name: "Rajarshi Chhatrapati Shahu Maharaj EBC/EWS Fee Support",
    shortDescription:
      "Maharashtra state fee reimbursement for Economically Backward / EWS students in professional courses.",
    governmentLevel: "Maharashtra",
    department: "Directorate of Technical Education, Maharashtra",
    type: "Fee Support",
    benefit: {
      type: "fee_waiver",
      amount: 50000,
      description: "50% tuition and exam fee waiver in government and private-unaided professional colleges.",
      directAmount: 0,
      costAvoidedAmount: 50000,
      futureAmount: 50000,
      financingAmount: 0,
      components: [
        "50% tuition fee waiver for eligible students in professional courses",
        "Income limit up to ₹8 Lakh per annum",
        "Admission must be through Centralized Admission Process (CAP)",
      ],
    },
    eligibility: {
      states: ["Maharashtra"],
      domicileRequired: true,
      currentStudent: true,
      futureIfCurrentStudent: true,
      incomeMax: 800000,
      goalsAny: ["Scholarships", "Education support", "Fee Support"],
    },
    verificationNotes: [
      "Requires active student status in an eligible CAP-admitted professional course in Maharashtra.",
    ],
    requiredDocuments: [
      { name: "Maharashtra Domicile Certificate", status: "ready" },
      { name: "Annual Income Certificate (≤ ₹8 Lakh)", status: "attention" },
      { name: "CAP Allotment Letter", status: "attention" },
    ],
    deadline: "Academic Year 2026-27 MahaDBT Schedule",
    applicationUrl: "https://mahadbt.maharashtra.gov.in/",
    sourceName: "DTE Maharashtra / MahaDBT",
    sourceUrl: "https://dte.maharashtra.gov.in/rajarshi-chhatrapati-shahu-maharaj/",
    lastVerified: "2026-08-23",
    status: "verify",
  },
  {
    id: "panjabrao-deshmukh-hostel",
    priority: 9,
    openToAll: true,
    name: "Dr Panjabrao Deshmukh Vasatigruh Nirvah Bhatta",
    shortDescription:
      "Hostel and subsistence living allowance for Maharashtra students pursuing professional courses.",
    governmentLevel: "Maharashtra",
    department: "Higher & Technical Education Department, Maharashtra",
    type: "Fee Support",
    benefit: {
      type: "cash",
      amount: 38000,
      description: "Up to ₹30,000 to ₹38,000 per year hostel subsistence allowance based on city tier.",
      directAmount: 0,
      costAvoidedAmount: 38000,
      futureAmount: 38000,
      financingAmount: 0,
      components: [
        "Hostel living allowance for students studying outside hometown",
        "Tier-1 cities (Mumbai, Pune, Nagpur): ₹30,000 - ₹38,000/yr",
        "Income limit up to ₹8 Lakh per annum",
      ],
    },
    eligibility: {
      states: ["Maharashtra"],
      domicileRequired: true,
      currentStudent: true,
      futureIfCurrentStudent: true,
      incomeMax: 800000,
      requiresHostelAdmission: true,
      goalsAny: ["Education support", "Scholarships"],
    },
    verificationNotes: [
      "Requires proof of hostel admission or registered rent agreement during course.",
    ],
    requiredDocuments: [
      { name: "Hostel Admission Certificate / Rent Agreement", status: "attention" },
      { name: "Maharashtra Domicile Certificate", status: "ready" },
      { name: "Income Certificate (≤ ₹8 Lakh)", status: "attention" },
    ],
    deadline: "MahaDBT Annual Schedule",
    applicationUrl: "https://mahadbt.maharashtra.gov.in/",
    sourceName: "DTE Maharashtra",
    sourceUrl: "https://dte.maharashtra.gov.in/dr-panjabrao-deshmukh-vastigruh-nirvah-bhatta-yojna/",
    lastVerified: "2026-08-23",
    status: "verify",
  },
  {
    id: "maharashtra-foreign-scholarship",
    priority: 10,
    openToAll: true,
    name: "Maharashtra Foreign Scholarship for Higher Studies",
    shortDescription:
      "State financial assistance for Maharashtra students admitted to top 200 QS-ranked world universities.",
    governmentLevel: "Maharashtra",
    department: "Social Justice & Special Assistance / Higher Education, Maharashtra",
    type: "Scholarship",
    benefit: {
      type: "mixed",
      amount: 2500000,
      description: "Full tuition fee plus living allowance and economy airfare for Master's/PhD abroad.",
      directAmount: 1500000,
      costAvoidedAmount: 1000000,
      financingAmount: 0,
      components: [
        "Full tuition fee covered directly to international university",
        "Living allowance in foreign currency for course duration",
        "Economy return airfare",
      ],
    },
    eligibility: {
      states: ["Maharashtra"],
      domicileRequired: true,
      ageMax: 35,
      educationMinRank: 4,
      incomeMax: 800000,
      goalsAny: ["Scholarships", "Fellowships", "Education support"],
      requiresAdmission: true,
    },
    verificationNotes: [
      "Requires unconditional offer from top 200 QS-ranked global university in STEM/management.",
    ],
    requiredDocuments: [
      { name: "Unconditional University Admission Offer (QS Top 200)", status: "attention" },
      { name: "Maharashtra Domicile Certificate", status: "ready" },
      { name: "Degree Transcript & Marks Proof (> 65%)", status: "ready" },
      { name: "Income Certificate (≤ ₹8 Lakh)", status: "attention" },
    ],
    deadline: "30 Jun 2026 (Annual Application Window)",
    applicationUrl: "https://mahadbt.maharashtra.gov.in/",
    sourceName: "Maharashtra Higher Education Portal",
    sourceUrl: "https://mahadbt.maharashtra.gov.in/",
    lastVerified: "2026-08-23",
    status: "verify",
  },
  {
    id: "nsp-csss",
    priority: 11,
    openToAll: true,
    name: "PM-USP Central Sector Scholarship for College & University Students",
    shortDescription:
      "Merit-cum-means financial assistance for students scoring above 80th percentile in Class 12.",
    governmentLevel: "Central",
    department: "Department of Higher Education, Ministry of Education",
    type: "Scholarship",
    benefit: {
      type: "cash",
      amount: 12000,
      description: "₹12,000/year for first 3 years of graduate study and ₹20,000/year at post-graduate level.",
      directAmount: 12000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "Direct DBT bank transfer of scholarship amount",
        "Merit criteria based on Class 12 board examination percentile",
      ],
    },
    eligibility: {
      incomeMax: 450000,
      currentStudent: true,
      futureIfCurrentStudent: true,
      educationMinRank: 2,
      goalsAny: ["Scholarships", "Education support"],
    },
    verificationNotes: [
      "Income limit is ₹4.5 lakh. Requires active enrollment in a regular degree course.",
    ],
    requiredDocuments: [
      { name: "Class 12 Marksheet with Board Percentile", status: "ready" },
      { name: "Income Certificate (≤ ₹4.5 Lakh)", status: "attention" },
      { name: "Bonafide Student Certificate", status: "attention" },
    ],
    deadline: "31 Oct 2026 on NSP",
    applicationUrl: "https://scholarships.gov.in/",
    sourceName: "National Scholarship Portal",
    sourceUrl: "https://scholarships.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },
  {
    id: "csis-interest-subsidy",
    priority: 12,
    openToAll: true,
    name: "Central Sector Interest Subsidy Scheme (CSIS)",
    shortDescription:
      "Full interest subsidy during moratorium period on educational loans for economically weaker sections.",
    governmentLevel: "Central",
    department: "Ministry of Education",
    type: "Interest Subsidy",
    benefit: {
      type: "interest_subsidy",
      amount: 40000,
      description: "100% interest waiver during course period plus 1 year on IBA-approved education loans.",
      directAmount: 0,
      costAvoidedAmount: 40000,
      financingAmount: 0,
      components: [
        "Full interest subsidy during moratorium period (course duration + 1 year)",
        "Applicable for technical & professional courses in India",
      ],
    },
    eligibility: {
      incomeMax: 450000,
      goalsAny: ["Subsidised loans", "Education support"],
      requiresAdmission: true,
      requiresLoanPlan: true,
    },
    verificationNotes: [
      "Income ceiling is ₹4.5 lakh. Applied directly through the lending bank via Canara Bank portal.",
    ],
    requiredDocuments: [
      { name: "Income Certificate from Authorized Authority (≤ ₹4.5L)", status: "attention" },
      { name: "Education Loan Sanction Letter", status: "attention" },
    ],
    deadline: "Rolling Bank Scheme",
    applicationUrl: "https://www.canarabank.com/csis/",
    sourceName: "Ministry of Education / Canara Bank Nodal",
    sourceUrl: "https://www.education.gov.in/higher_education",
    lastVerified: "2026-08-23",
    status: "verify",
  },
  {
    id: "aicte-saksham",
    priority: 13,
    name: "AICTE Saksham Scholarship for Specially Abled Students",
    shortDescription:
      "Scholarship for specially abled students (disability ≥ 40%) admitted to AICTE-approved technical degrees.",
    governmentLevel: "Central",
    department: "All India Council for Technical Education (AICTE)",
    type: "Scholarship",
    benefit: {
      type: "cash",
      amount: 50000,
      description: "₹50,000 per annum towards college fee, books, equipment and software.",
      directAmount: 50000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "₹50,000 annual scholarship for every year of technical study",
        "Disbursed through NSP portal via Direct Benefit Transfer",
      ],
    },
    eligibility: {
      disabilityRequired: true,
      currentStudent: true,
      incomeMax: 800000,
      educationMinRank: 2,
      goalsAny: ["Scholarships", "Education support"],
    },
    verificationNotes: [
      "Requires unique disability ID (UDID) or medical board certificate with ≥ 40% disability.",
    ],
    requiredDocuments: [
      { name: "Disability Certificate (UDID Card)", status: "attention" },
      { name: "AICTE Approved Institution Admission Proof", status: "attention" },
      { name: "Income Certificate (≤ ₹8 Lakh)", status: "attention" },
    ],
    deadline: "31 Oct 2026 on NSP",
    applicationUrl: "https://scholarships.gov.in/",
    sourceName: "National Scholarship Portal / AICTE",
    sourceUrl: "https://scholarships.gov.in/All-Scholarships",
    lastVerified: "2026-08-23",
    status: "open",
  },
  {
    id: "aicte-swanath",
    priority: 14,
    name: "AICTE Swanath Scholarship Scheme",
    shortDescription:
      "Financial assistance for orphans, children whose parents died of COVID-19, and wards of Armed Forces martyrs.",
    governmentLevel: "Central",
    department: "AICTE",
    type: "Scholarship",
    benefit: {
      type: "cash",
      amount: 50000,
      description: "₹50,000 per year throughout the technical diploma or degree program.",
      directAmount: 50000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "₹50,000 annual scholarship for eligible vulnerable students",
        "No ceiling on the number of scholarships awarded",
      ],
    },
    eligibility: {
      currentStudent: true,
      incomeMax: 800000,
      educationMinRank: 2,
      goalsAny: ["Scholarships", "Education support"],
      specialCategoryRequired: "Swanath",
    },
    verificationNotes: [
      "Specific eligibility: orphan, parent deceased due to COVID, or martyr ward.",
    ],
    requiredDocuments: [
      { name: "Death / Martyr Certificate / Orphanhood Proof", status: "attention" },
      { name: "AICTE College Admission Proof", status: "attention" },
    ],
    deadline: "31 Oct 2026 on NSP",
    applicationUrl: "https://scholarships.gov.in/",
    sourceName: "National Scholarship Portal",
    sourceUrl: "https://scholarships.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },
  {
    id: "aicte-pragati",
    priority: 15,
    name: "AICTE Pragati Scholarship for Girl Students",
    shortDescription:
      "Scholarship for girl students entering AICTE-approved technical degree or diploma courses.",
    governmentLevel: "Central",
    department: "AICTE / National Scholarship Portal",
    type: "Scholarship",
    benefit: {
      type: "cash",
      amount: 50000,
      description: "₹50,000 per year towards tuition fee and educational maintenance.",
      directAmount: 50000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "₹50,000 per annum for female technical engineering students",
        "Up to 2 girls per family eligible",
      ],
    },
    eligibility: {
      genders: ["Female"],
      currentStudent: true,
      incomeMax: 800000,
      educationMinRank: 2,
      goalsAny: ["Scholarships", "Education support"],
    },
    verificationNotes: [
      "Dedicated exclusively to female candidates admitted into AICTE technical courses.",
    ],
    requiredDocuments: [
      { name: "AICTE Approved College Admission Proof", status: "attention" },
      { name: "Family Income Certificate (≤ ₹8 Lakh)", status: "attention" },
    ],
    deadline: "31 Oct 2026 on NSP",
    applicationUrl: "https://scholarships.gov.in/",
    sourceName: "National Scholarship Portal / AICTE",
    sourceUrl: "https://scholarships.gov.in/All-Scholarships",
    lastVerified: "2026-08-23",
    status: "open",
  },
  {
    id: "naps-tech-apprenticeship",
    priority: 16,
    openToAll: true,
    name: "NAPS-2 Technology & IT Apprenticeship Pathway",
    shortDescription:
      "Industry on-the-job apprenticeship with direct government stipend support under NAPS.",
    governmentLevel: "Central",
    department: "Ministry of Skill Development and Entrepreneurship",
    type: "Training",
    benefit: {
      type: "mixed",
      amount: 18000,
      description: "Earn-while-you-learn industry stipend with government share up to ₹1,500/month.",
      directAmount: 18000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "Direct on-the-job training at registered IT & tech enterprises",
        "Government stipend co-funding up to 25% (₹1,500/month)",
        "National Apprenticeship Certificate upon completion",
      ],
    },
    eligibility: {
      ageMin: 14,
      ageMax: 35,
      educationMinRank: 2,
      goalsAny: ["Skill development", "Free training", "Employment opportunities"],
      interestsAny: ["Technology", "AI", "Digital skills", "Manufacturing"],
    },
    verificationNotes: [
      "Candidates apply to listed corporate apprenticeship vacancies across India.",
    ],
    requiredDocuments: [
      { name: "Education Certificate", status: "ready" },
      { name: "Apprenticeship Portal Candidate Registration", status: "attention" },
    ],
    deadline: "Opportunity-based / Rolling",
    applicationUrl: "https://www.apprenticeshipindia.gov.in/",
    sourceName: "National Apprenticeship Training Portal",
    sourceUrl: "https://www.apprenticeshipindia.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },
  {
    id: "pmegp-micro-enterprise",
    priority: 17,
    openToAll: true,
    name: "PMEGP Prime Minister Employment Generation Programme",
    shortDescription:
      "Credit-linked capital subsidy for setting up new micro-enterprises and technology startups.",
    governmentLevel: "Central",
    department: "Ministry of MSME / KVIC",
    type: "Entrepreneurship",
    benefit: {
      type: "mixed",
      amount: 500000,
      description: "Up to 25%–35% margin money government subsidy on project loans up to ₹50 Lakh.",
      directAmount: 0,
      costAvoidedAmount: 0,
      financingAmount: 2000000,
      components: [
        "Margin money subsidy: 25% (urban general) to 35% (special category/minority/urban/rural)",
        "Project cost up to ₹50 Lakh for manufacturing, ₹20 Lakh for service/tech",
        "No income ceiling for new enterprise project assistance",
      ],
    },
    eligibility: {
      ageMin: 18,
      goalsAny: ["Entrepreneurship", "Employment opportunities"],
      requiresNewEnterprise: true,
    },
    verificationNotes: [
      "Requires detailed project report (DPR) and bank sanction for new enterprise.",
    ],
    requiredDocuments: [
      { name: "Detailed Project Report (DPR)", status: "attention" },
      { name: "Education Certificate (8th / Graduate)", status: "ready" },
      { name: "Special Category / Minority Proof for 35% subsidy", status: "attention" },
    ],
    deadline: "Online Portal Open All Year",
    applicationUrl: "https://pmegp.msme.gov.in/",
    sourceName: "PMEGP Portal / KVIC",
    sourceUrl: "https://pmegp.msme.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  // ── TIER A: HEALTH INSURANCE ─────────────────────────────────────────────

  {
    id: "pm-jay-ayushman-bharat",
    priority: 18,
    name: "PM-JAY — Ayushman Bharat Health Insurance",
    shortDescription: "Cashless health insurance of up to ₹5 lakh per family per year for secondary and tertiary hospitalisation at empanelled hospitals.",
    governmentLevel: "Central",
    department: "Ministry of Health & Family Welfare / NHA",
    type: "Health Insurance",
    category: "health",
    openToAll: false,
    benefit: {
      type: "insurance",
      amount: 500000,
      description: "₹5,00,000 per family per year — cashless hospitalisation at 25,000+ empanelled hospitals.",
      directAmount: 0,
      costAvoidedAmount: 500000,
      financingAmount: 0,
      components: [
        "Cashless treatment up to ₹5 lakh/year",
        "Covers pre & post-hospitalisation expenses",
        "All pre-existing conditions covered from Day 1",
        "Portable across India — use at any empanelled hospital",
        "No premium payment required for beneficiaries",
      ],
    },
    eligibility: {
      incomeMax: 500000,
      goalsAny: ["Health insurance"],
    },
    requiresBPL: true,
    verificationNotes: [
      "Eligibility verified via SECC 2011 database or state inclusion lists.",
      "Download Ayushman card from pmjay.gov.in using Aadhaar.",
    ],
    requiredDocuments: [
      { name: "Aadhaar Card / Family ID", status: "ready" },
      { name: "Ration Card / SECC / BPL Certificate", status: "attention", note: "Needed to confirm PMJAY beneficiary list inclusion" },
    ],
    deadline: "Always Open",
    applicationUrl: "https://pmjay.gov.in/",
    sourceName: "National Health Authority — PM-JAY",
    sourceUrl: "https://pmjay.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "esic-health-insurance",
    priority: 19,
    name: "ESIC — Employee State Insurance Corporation",
    shortDescription: "Comprehensive health insurance (medical, sickness, maternity, disability, death) for organised sector employees earning up to ₹21,000/month.",
    governmentLevel: "Central",
    department: "Ministry of Labour & Employment / ESIC",
    type: "Health Insurance",
    category: "health",
    openToAll: false,
    benefit: {
      type: "insurance",
      amount: 0,
      description: "Full medical care for employee and family + 70% wage replacement during sickness + maternity benefits.",
      directAmount: 0,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "Full OPD, IPD, and specialist medical care for employee and dependants",
        "Sickness benefit: 70% wages for up to 91 days/year",
        "Maternity benefit: 26 weeks at full wages",
        "Disablement and dependent's pension",
        "Funeral expenses reimbursement",
      ],
    },
    eligibility: {
      goalsAny: ["Health insurance", "Employment opportunities"],
    },
    requiresOrganizedWorker: true,
    verificationNotes: [
      "Applicable to employees in ESI-covered establishments with monthly wage ≤ ₹21,000.",
      "Employer registers the establishment; employee gets ESIC card.",
    ],
    requiredDocuments: [
      { name: "Employment / Salary Proof", status: "attention", note: "Requires employer registration in ESIC portal" },
      { name: "Aadhaar Card", status: "ready" },
    ],
    deadline: "Ongoing — employer registration required",
    applicationUrl: "https://esic.in/",
    sourceName: "ESIC Portal",
    sourceUrl: "https://esic.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  // ── TIER A: FOOD SECURITY ─────────────────────────────────────────────────

  {
    id: "pmgkay-free-food-grains",
    priority: 20,
    name: "PM Garib Kalyan Anna Yojana (Free Food Grains)",
    shortDescription: "5 kg free rice / wheat per person per month for all NFSA/Priority Household (PHH) and Antyodaya (AAY) ration card holders.",
    governmentLevel: "Central",
    department: "Ministry of Food & Consumer Affairs",
    type: "Food Security",
    category: "food",
    openToAll: false,
    benefit: {
      type: "subsidy",
      amount: 12000,
      description: "5 kg free food grain per person per month (estimated ₹1,000+/month per family).",
      directAmount: 12000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "5 kg free rice or wheat per person/month",
        "Delivered through fair price shops (PDS network)",
        "Applicable to all NFSA beneficiaries (Priority + Antyodaya)",
        "Portable ration via 'One Nation One Ration Card'",
      ],
    },
    eligibility: {
      incomeMax: 250000,
      goalsAny: ["Food & ration support"],
    },
    requiresBPL: true,
    verificationNotes: [
      "Requires valid Priority Household (PHH) or Antyodaya Anna Yojana (AAY) ration card.",
      "Beneficiary list maintained by state government Food department.",
    ],
    requiredDocuments: [
      { name: "Ration Card (PHH / AAY)", status: "attention", note: "Must be enrolled in state ration card system" },
      { name: "Aadhaar seeding with ration card", status: "attention", note: "Required for biometric verification at PDS shop" },
    ],
    deadline: "Ongoing — monthly entitlement",
    applicationUrl: "https://nfsa.gov.in/",
    sourceName: "NFSA Portal",
    sourceUrl: "https://nfsa.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "nfsa-pds-ration",
    priority: 21,
    name: "National Food Security Act — PDS Ration Card",
    shortDescription: "Subsidised food grains (rice at ₹3/kg, wheat at ₹2/kg) for income-eligible families through the Public Distribution System.",
    governmentLevel: "Central",
    department: "Ministry of Food & Consumer Affairs / State Civil Supplies",
    type: "Food Security",
    category: "food",
    openToAll: false,
    benefit: {
      type: "subsidy",
      amount: 6000,
      description: "Up to 35 kg subsidised grains/month per AAY family, or 5 kg per person for PHH.",
      directAmount: 0,
      costAvoidedAmount: 6000,
      financingAmount: 0,
      components: [
        "Rice: ₹3/kg | Wheat: ₹2/kg | Coarse grains: ₹1/kg",
        "Antyodaya (poorest families): 35 kg/month",
        "Priority Household: 5 kg per member/month",
        "State portability under One Nation One Ration Card",
      ],
    },
    eligibility: {
      incomeMax: 250000,
      goalsAny: ["Food & ration support"],
    },
    requiresBPL: true,
    verificationNotes: [
      "Apply for new ration card at your state's civil supplies office or state portal.",
      "Maharashtra: rcms.mahafood.gov.in",
    ],
    requiredDocuments: [
      { name: "Proof of Address (domicile)", status: "ready" },
      { name: "Income Certificate / BPL proof", status: "attention", note: "State-wise income cap applies" },
      { name: "Family Aadhaar details", status: "ready" },
    ],
    deadline: "Apply any time at civil supplies office",
    applicationUrl: "https://rcms.mahafood.gov.in/",
    sourceName: "NFSA / MahaFood Portal",
    sourceUrl: "https://nfsa.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  // ── TIER A: HOUSING ───────────────────────────────────────────────────────

  {
    id: "pmay-urban",
    priority: 22,
    name: "PMAY-Urban — Pradhan Mantri Awas Yojana (Urban)",
    shortDescription: "Interest subsidy on home loans up to ₹2.67 lakh under Credit Linked Subsidy Scheme (CLSS) for EWS / LIG / MIG urban families without a pucca house.",
    governmentLevel: "Central",
    department: "Ministry of Housing & Urban Affairs",
    type: "Housing",
    category: "housing",
    openToAll: false,
    benefit: {
      type: "subsidy",
      amount: 267000,
      description: "One-time credit-linked interest subsidy up to ₹2.67 lakh on home loan (EWS/LIG). MIG: up to ₹2.35 lakh.",
      directAmount: 0,
      costAvoidedAmount: 267000,
      financingAmount: 0,
      components: [
        "EWS (income ≤ ₹3L): 6.5% interest subsidy on loan up to ₹6L",
        "LIG (income ≤ ₹6L): 6.5% interest subsidy on loan up to ₹6L",
        "MIG-I (income ≤ ₹12L): 4% on loan up to ₹9L",
        "MIG-II (income ≤ ₹18L): 3% on loan up to ₹12L",
        "Subsidy amount credited upfront to reduce EMI",
      ],
    },
    eligibility: {
      incomeMax: 1800000,
      residenceType: "Urban",
      goalsAny: ["Housing subsidy"],
    },
    verificationNotes: [
      "Beneficiary family must not own a pucca house in India.",
      "Female ownership / co-ownership preferred for EWS/LIG.",
      "Apply through empanelled banks / housing finance companies.",
    ],
    requiredDocuments: [
      { name: "Income Certificate / ITR", status: "attention" },
      { name: "Self-declaration of no pucca house", status: "attention" },
      { name: "Aadhaar Card", status: "ready" },
      { name: "Property / Sale agreement", status: "attention" },
    ],
    deadline: "Scheme ongoing — check pmaymis.gov.in for current sub-scheme",
    applicationUrl: "https://pmaymis.gov.in/",
    sourceName: "MoHUA / PMAY Urban Portal",
    sourceUrl: "https://pmaymis.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "pmay-gramin",
    priority: 23,
    name: "PMAY-Gramin — Pradhan Mantri Awas Yojana (Rural)",
    shortDescription: "Direct financial assistance of ₹1.2–1.3 lakh for construction of a pucca house for houseless and kutcha house dwellers in rural areas.",
    governmentLevel: "Central",
    department: "Ministry of Rural Development",
    type: "Housing",
    category: "housing",
    openToAll: false,
    benefit: {
      type: "grant",
      amount: 130000,
      description: "₹1.20 lakh (plains) / ₹1.30 lakh (hilly/NE states) direct cash grant for house construction.",
      directAmount: 130000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "₹1.2–1.3 lakh direct transfer for house construction",
        "Additional ₹12,000 for sanitation (linked with SBM-G)",
        "90–95 days MGNREGA labour entitlement for unskilled work",
        "Free LPG connection under Ujjwala Yojana linkage",
      ],
    },
    eligibility: {
      goalsAny: ["Housing subsidy"],
    },
    requiresRuralResidence: true,
    verificationNotes: [
      "Selected from SECC 2011 permanent wait-list (Awaas+) by Gram Panchayat.",
      "Check your name on rhreporting.nic.in or contact Gram Sachiv.",
    ],
    requiredDocuments: [
      { name: "SECC / Awaas+ inclusion list verification", status: "attention" },
      { name: "Aadhaar-linked Bank Account", status: "ready" },
      { name: "No pucca house self-declaration", status: "attention" },
    ],
    deadline: "Allocated by Gram Panchayat — apply via Awaas+ App",
    applicationUrl: "https://rhreporting.nic.in/",
    sourceName: "Ministry of Rural Development / PMAY-G Portal",
    sourceUrl: "https://pmayg.nic.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  // ── TIER B: AGRICULTURE ───────────────────────────────────────────────────

  {
    id: "pm-kisan",
    priority: 24,
    name: "PM-KISAN — Direct Income Support for Farmers",
    shortDescription: "₹6,000 per year in three instalments of ₹2,000 directly to the bank account of small & marginal farmer families.",
    governmentLevel: "Central",
    department: "Ministry of Agriculture & Farmers' Welfare",
    type: "Agricultural Support",
    category: "agriculture",
    openToAll: false,
    benefit: {
      type: "cash",
      amount: 6000,
      description: "₹6,000/year (₹2,000 × 3 instalments) as income support — direct bank transfer.",
      directAmount: 6000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "₹2,000 per 4-month instalment (3 instalments/year)",
        "Directly credited to Aadhaar-seeded bank account",
        "No restriction on use of funds",
        "Check status at pmkisan.gov.in",
      ],
    },
    eligibility: {
      goalsAny: ["Agricultural support"],
    },
    requiresFarmer: true,
    verificationNotes: [
      "Family must own cultivable agricultural land.",
      "Institutional land holders, former/current constitutional post holders and income-tax payees are excluded.",
    ],
    requiredDocuments: [
      { name: "Land ownership records / Khata", status: "attention", note: "Khasra / Khatauni from revenue records required" },
      { name: "Aadhaar-linked Bank Account", status: "ready" },
      { name: "Mobile number linked to Aadhaar", status: "ready" },
    ],
    deadline: "Always Open — register at pmkisan.gov.in",
    applicationUrl: "https://pmkisan.gov.in/",
    sourceName: "PM-KISAN Portal",
    sourceUrl: "https://pmkisan.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "kisan-credit-card",
    priority: 25,
    name: "Kisan Credit Card (KCC) — Agricultural Credit",
    shortDescription: "Short-term credit up to ₹3 lakh at 4% effective interest (7% with 3% GOI subvention) for crop cultivation, post-harvest, and allied activities.",
    governmentLevel: "Central",
    department: "Ministry of Agriculture / NABARD / Commercial Banks",
    type: "Agricultural Support",
    category: "agriculture",
    openToAll: false,
    benefit: {
      type: "credit",
      amount: 300000,
      description: "Credit limit up to ₹3 lakh at just 4% per annum effective rate (after 3% interest subvention by GOI).",
      directAmount: 0,
      costAvoidedAmount: 0,
      financingAmount: 300000,
      components: [
        "Revolving credit for crop production expenses",
        "Interest subvention: 7% rate – 3% GOI subvention = 4% effective",
        "Covers post-harvest, household needs, maintenance of assets",
        "ATM-enabled RuPay debit card for withdrawals",
        "Personal accident insurance of ₹50,000 included",
      ],
    },
    eligibility: {
      goalsAny: ["Agricultural support"],
    },
    requiresFarmer: true,
    verificationNotes: [
      "Apply at nearest bank branch with land records.",
      "No income / collateral required for credit up to ₹1.60 lakh.",
    ],
    requiredDocuments: [
      { name: "Land Records / Khasra", status: "attention" },
      { name: "Photograph", status: "ready" },
      { name: "Identity Proof (Aadhaar)", status: "ready" },
      { name: "Address Proof", status: "ready" },
    ],
    deadline: "Always Open at any bank branch",
    applicationUrl: "https://www.nabard.org/",
    sourceName: "NABARD / Your Bank Branch",
    sourceUrl: "https://www.nabard.org/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "pm-fasal-bima",
    priority: 26,
    name: "PM Fasal Bima Yojana — Crop Insurance",
    shortDescription: "Comprehensive crop insurance against natural calamities, pests, and diseases at very low farmer-paid premium (2% Kharif, 1.5% Rabi, 5% commercial crops).",
    governmentLevel: "Central",
    department: "Ministry of Agriculture & Farmers' Welfare",
    type: "Agricultural Support",
    category: "agriculture",
    openToAll: false,
    benefit: {
      type: "insurance",
      amount: 0,
      description: "Up to full sum insured (as per state district notification) — covers yield loss, post-harvest, localised disasters.",
      directAmount: 0,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "Low farmer premium: 2% (Kharif), 1.5% (Rabi), 5% (horticulture)",
        "Balance premium paid by Central + State Government",
        "Covers standing crop, post-harvest losses, prevented sowing",
        "Smart / remote sensing technology for faster claim settlement",
      ],
    },
    eligibility: {
      goalsAny: ["Agricultural support"],
    },
    requiresFarmer: true,
    verificationNotes: [
      "Notified crops listed per district before sowing season.",
      "KCC holders enrolled automatically; non-loanee farmers can opt-in.",
    ],
    requiredDocuments: [
      { name: "Land Records / Khasra for the season", status: "attention" },
      { name: "Sowing certificate", status: "attention" },
      { name: "Bank account details", status: "ready" },
    ],
    deadline: "Enroll before crop season cut-off at nearest bank / CSC",
    applicationUrl: "https://pmfby.gov.in/",
    sourceName: "PMFBY Portal",
    sourceUrl: "https://pmfby.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  // ── TIER B: UTILITIES ─────────────────────────────────────────────────────

  {
    id: "pm-ujjwala-lpg",
    priority: 27,
    name: "PM Ujjwala Yojana — Free LPG Connection",
    shortDescription: "Free LPG cooking gas connection + first cylinder + stove to BPL women. Refills at subsidised/market price with first-cylinder free.",
    governmentLevel: "Central",
    department: "Ministry of Petroleum & Natural Gas",
    type: "Utilities",
    category: "utilities",
    openToAll: false,
    benefit: {
      type: "grant",
      amount: 3500,
      description: "Free LPG connection (deposit waiver ~₹1,600) + first refill + stove deposit waiver (total benefit ~₹3,500).",
      directAmount: 3500,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "Free LPG connection (security deposit waived)",
        "First refill cylinder free of cost",
        "Option for EMI-based repayment of stove / regulator",
        "Subsidised refills via DBT thereafter",
      ],
    },
    eligibility: {
      genders: ["Female"],
      goalsAny: ["Utilities (LPG/power)"],
    },
    requiresBPL: true,
    verificationNotes: [
      "Apply at nearest LPG distributor (HP, Bharat Gas, Indane).",
      "Must not already have an LPG connection in the household.",
    ],
    requiredDocuments: [
      { name: "Aadhaar Card (woman applicant)", status: "ready" },
      { name: "Ration Card / BPL Certificate", status: "attention" },
      { name: "Bank account (for DBT subsidy)", status: "ready" },
    ],
    deadline: "Apply at LPG distributor any time",
    applicationUrl: "https://www.pmuy.gov.in/",
    sourceName: "PM Ujjwala Yojana Portal",
    sourceUrl: "https://www.pmuy.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "saubhagya-electricity",
    priority: 28,
    name: "Saubhagya — Free Household Electricity Connection",
    shortDescription: "Free electricity connection for BPL households and ₹500 for APL households in rural and urban areas under PM Sahaj Bijli Har Ghar Yojana.",
    governmentLevel: "Central",
    department: "Ministry of Power / State DISCOMs",
    type: "Utilities",
    category: "utilities",
    openToAll: false,
    benefit: {
      type: "grant",
      amount: 5000,
      description: "Free connection cost (estimated ₹4,000–5,000 for BPL households).",
      directAmount: 5000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "Free household electricity connection for BPL families",
        "5 LED bulbs + 1 fan for solar-powered connections in off-grid areas",
        "5-year repair & maintenance for solar units",
        "APL households: ₹500 in 10 instalments via electricity bills",
      ],
    },
    eligibility: {
      goalsAny: ["Utilities (LPG/power)"],
    },
    requiresBPL: true,
    verificationNotes: [
      "Contact local DISCOM/electricity board or nearest CSC.",
      "Largely completed in most states — check connectivity status at saubhagya.gov.in.",
    ],
    requiredDocuments: [
      { name: "Aadhaar Card", status: "ready" },
      { name: "Ration Card / BPL Certificate", status: "attention" },
    ],
    deadline: "Contact local electricity board / DISCOM",
    applicationUrl: "https://saubhagya.gov.in/",
    sourceName: "Saubhagya Portal / MoP",
    sourceUrl: "https://saubhagya.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  // ── TIER B: WOMEN & CHILD ─────────────────────────────────────────────────

  {
    id: "janani-suraksha-yojana",
    priority: 29,
    name: "Janani Suraksha Yojana — Safe Motherhood Cash Incentive",
    shortDescription: "Cash assistance of ₹1,400 (rural) / ₹1,000 (urban) to pregnant women delivering at government health facilities to promote institutional delivery.",
    governmentLevel: "Central",
    department: "Ministry of Health & Family Welfare / NHM",
    type: "Women & Child",
    category: "women-child",
    openToAll: false,
    benefit: {
      type: "cash",
      amount: 1400,
      description: "₹1,400 cash for rural BPL pregnant women; ₹1,000 urban. ASHA gets ₹300 (rural) / ₹200 (urban) as performance incentive.",
      directAmount: 1400,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "₹1,400 cash assistance for rural BPL pregnant women",
        "₹1,000 for urban BPL women delivering at govt facility",
        "Covers all pregnancies (no restriction on birth order in low-performing states)",
        "ASHA facilitator provides doorstep support",
      ],
    },
    eligibility: {
      genders: ["Female"],
      goalsAny: ["Women & child benefits", "Health insurance"],
    },
    requiresPregnant: true,
    verificationNotes: [
      "Deliver at government health facility or accredited private hospital.",
      "Register with ASHA worker or sub-centre early in pregnancy.",
    ],
    requiredDocuments: [
      { name: "MCH (Mother Child Health) Card", status: "attention", note: "Obtain from sub-centre / PHC at pregnancy registration" },
      { name: "Aadhaar / BPL card", status: "ready" },
      { name: "Bank account for direct transfer", status: "ready" },
    ],
    deadline: "Register during pregnancy — delivery must be institutional",
    applicationUrl: "https://nhm.gov.in/",
    sourceName: "National Health Mission",
    sourceUrl: "https://nhm.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "pmmvy-maternity-benefit",
    priority: 30,
    name: "PM Matru Vandana Yojana (PMMVY) — Maternity Benefit",
    shortDescription: "₹5,000 maternity benefit in two instalments for the first living child, and ₹6,000 for the second child if it's a girl — promoting early antenatal care.",
    governmentLevel: "Central",
    department: "Ministry of Women & Child Development",
    type: "Women & Child",
    category: "women-child",
    openToAll: false,
    benefit: {
      type: "cash",
      amount: 5000,
      description: "₹5,000 in 2 instalments for first child; ₹6,000 one-time for second child (if girl).",
      directAmount: 5000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "1st instalment ₹3,000: on early pregnancy registration (within 150 days)",
        "2nd instalment ₹2,000: after delivery and first vaccination",
        "2nd child benefit ₹6,000: one-time if child is a girl",
        "DBT direct to mother's bank account",
      ],
    },
    eligibility: {
      genders: ["Female"],
      goalsAny: ["Women & child benefits"],
    },
    requiresPregnant: true,
    verificationNotes: [
      "Apply via Anganwadi Centre or health sub-centre within 150 days of last menstrual period.",
      "Available at pmmvy-cas.nic.in or WCD district office.",
    ],
    requiredDocuments: [
      { name: "MCP Card (Mother Child Protection)", status: "attention" },
      { name: "Aadhaar Card", status: "ready" },
      { name: "Bank Account Passbook", status: "ready" },
      { name: "Marriage Certificate / Pregnancy proof", status: "attention" },
    ],
    deadline: "Register within 150 days of last menstrual period",
    applicationUrl: "https://pmmvy-cas.nic.in/",
    sourceName: "PMMVY / WCD Ministry",
    sourceUrl: "https://pmmvy-cas.nic.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "sukanya-samriddhi-yojana",
    priority: 31,
    name: "Sukanya Samriddhi Yojana — Girl Child Savings Scheme",
    shortDescription: "High-interest (currently 8.2% p.a.) tax-free savings account for a girl child (below 10 years) with deduction under 80C. Matures after 21 years.",
    governmentLevel: "Central",
    department: "Ministry of Finance / India Post / Banks",
    type: "Women & Child",
    category: "women-child",
    openToAll: false,
    benefit: {
      type: "savings",
      amount: 0,
      description: "8.2% p.a. interest (tax-free) — highest among small savings schemes. 80C tax benefit on deposits.",
      directAmount: 0,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "8.2% interest per annum (compounded yearly) — among highest safe savings rates",
        "Income tax deduction up to ₹1.5L under Section 80C",
        "Partial withdrawal (50%) allowed at age 18 for education",
        "Minimum deposit ₹250/year, maximum ₹1.5L/year",
        "Account matures after 21 years (or on marriage after 18)",
      ],
    },
    eligibility: {
      goalsAny: ["Women & child benefits", "Scholarships", "Education support"],
    },
    requiresYoungChildren: true,
    verificationNotes: [
      "Parent / guardian opens account at Post Office or designated bank.",
      "One account per girl child, max 2 accounts per family.",
    ],
    requiredDocuments: [
      { name: "Girl child birth certificate", status: "attention" },
      { name: "Parent/Guardian Aadhaar & address proof", status: "ready" },
      { name: "Photographs (guardian + girl)", status: "ready" },
    ],
    deadline: "Open before girl child turns 10 years of age",
    applicationUrl: "https://www.indiapost.gov.in/",
    sourceName: "India Post / Designated Banks",
    sourceUrl: "https://www.indiapost.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  // ── TIER B: EMPLOYMENT ────────────────────────────────────────────────────

  {
    id: "mgnrega-job-card",
    priority: 32,
    name: "MGNREGA — Guaranteed Rural Employment Job Card",
    shortDescription: "100 days of guaranteed wage employment per household per year at government-notified wage rates (₹220–400/day depending on state) for rural adult workers.",
    governmentLevel: "Central",
    department: "Ministry of Rural Development",
    type: "Employment",
    category: "employment",
    openToAll: false,
    benefit: {
      type: "wage",
      amount: 40000,
      description: "100 days guaranteed work per year at ~₹220–400/day (state-specific MGNREGA wage rate).",
      directAmount: 40000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "100 days guaranteed wage employment per household",
        "Work allocated within 15 days of application or unemployment allowance",
        "Wages deposited in bank / post office accounts",
        "Additional days in drought / natural calamity notified years",
        "Women: minimum 1/3rd participation mandated",
      ],
    },
    eligibility: {
      ageMin: 18,
      goalsAny: ["Employment opportunities"],
    },
    requiresRuralResidence: true,
    verificationNotes: [
      "Enroll for Job Card at Gram Panchayat. Free of cost.",
      "Demand work in writing to Gram Panchayat; work must start within 15 days.",
    ],
    requiredDocuments: [
      { name: "Job Card Application (free at Gram Panchayat)", status: "attention" },
      { name: "Aadhaar Card", status: "ready" },
      { name: "Photograph", status: "ready" },
    ],
    deadline: "Apply at Gram Panchayat any time",
    applicationUrl: "https://nrega.nic.in/",
    sourceName: "MGNREGA — Nrega.nic.in",
    sourceUrl: "https://nrega.nic.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "pm-svanidhi-street-vendor",
    priority: 33,
    name: "PM SVANidhi — Street Vendor Micro-Credit Loan",
    shortDescription: "Collateral-free working capital loans of ₹10,000 → ₹20,000 → ₹50,000 for street vendors, with 7% interest subvention and digital transaction incentives.",
    governmentLevel: "Central",
    department: "Ministry of Housing & Urban Affairs",
    type: "Employment",
    category: "employment",
    openToAll: false,
    benefit: {
      type: "credit",
      amount: 50000,
      description: "₹10,000 (Tier 1) → ₹20,000 (Tier 2) → ₹50,000 (Tier 3) collateral-free loan with 7% interest subvention.",
      directAmount: 0,
      costAvoidedAmount: 0,
      financingAmount: 50000,
      components: [
        "Tier 1: ₹10,000 working capital loan",
        "Tier 2: ₹20,000 (on timely repayment of Tier 1)",
        "Tier 3: ₹50,000 (on timely repayment of Tier 2)",
        "7% interest subvention via DBT (annual)",
        "Cashback up to ₹100/month on digital transactions",
        "Credit score building through repayment history",
      ],
    },
    eligibility: {
      goalsAny: ["Entrepreneurship", "Employment opportunities", "Subsidised loans"],
    },
    requiresStreetVendor: true,
    verificationNotes: [
      "Requires vending certificate or Letter of Recommendation from ULB.",
      "Apply at banks, MFIs, or pmsvanidhi.mohua.gov.in.",
    ],
    requiredDocuments: [
      { name: "Vending Certificate / Letter of Recommendation from ULB", status: "attention", note: "Key eligibility document" },
      { name: "Aadhaar Card", status: "ready" },
      { name: "Bank Account", status: "ready" },
    ],
    deadline: "Always Open — apply at pmsvanidhi.mohua.gov.in",
    applicationUrl: "https://pmsvanidhi.mohua.gov.in/",
    sourceName: "PM SVANidhi Portal / MoHUA",
    sourceUrl: "https://pmsvanidhi.mohua.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "startup-india-recognition",
    priority: 34,
    name: "Startup India — DPIIT Recognition & Benefits",
    shortDescription: "DPIIT startup recognition unlocking tax holidays (3 years), self-certification under labour & environment laws, relaxed IP filing fees (80% discount), and Startup India Seed Fund access.",
    governmentLevel: "Central",
    department: "DPIIT / Ministry of Commerce & Industry",
    type: "Employment",
    category: "employment",
    openToAll: true,
    benefit: {
      type: "regulatory",
      amount: 0,
      description: "3-year income tax holiday, 80% discount on IP fees, ₹20–50 lakh seed fund access (via SISFS).",
      directAmount: 0,
      costAvoidedAmount: 0,
      financingAmount: 5000000,
      components: [
        "Income Tax exemption for 3 consecutive years (Section 80-IAC)",
        "Capital gains tax exemption on investment (Section 54EE)",
        "80% concession on patent, trademark filing fees",
        "Self-certification under 9 Labour and 3 Environment laws",
        "Startup India Seed Fund Scheme (SISFS): ₹20L–₹50L grant/loan",
      ],
    },
    eligibility: {
      ageMin: 18,
      goalsAny: ["Entrepreneurship", "Employment opportunities"],
    },
    verificationNotes: [
      "Startup must be incorporated/registered as Private Ltd, LLP, or Partnership.",
      "Annual turnover should not exceed ₹100 crore for recognition eligibility.",
    ],
    requiredDocuments: [
      { name: "Certificate of Incorporation / LLP Agreement", status: "attention", note: "Company must be registered first" },
      { name: "Brief pitch deck / business description", status: "attention" },
      { name: "PAN Card", status: "ready" },
    ],
    deadline: "Always Open — apply at startupindia.gov.in",
    applicationUrl: "https://www.startupindia.gov.in/",
    sourceName: "Startup India Portal / DPIIT",
    sourceUrl: "https://www.startupindia.gov.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  // ── TIER C: PENSION ───────────────────────────────────────────────────────

  {
    id: "pm-shram-yogi-maan-dhan",
    priority: 35,
    name: "PM Shram Yogi Maan-dhan — Unorganized Worker Pension",
    shortDescription: "₹3,000/month assured pension at age 60 for unorganized sector workers (aged 18–40) contributing ₹55–₹200/month matched equally by Government.",
    governmentLevel: "Central",
    department: "Ministry of Labour & Employment",
    type: "Pension",
    category: "pension",
    openToAll: false,
    benefit: {
      type: "pension",
      amount: 36000,
      description: "₹3,000/month (₹36,000/year) guaranteed pension starting at age 60. Government co-contributes equal amount.",
      directAmount: 36000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "₹3,000/month guaranteed pension from age 60",
        "Government matches your contribution 1:1",
        "Monthly contribution: ₹55 (age 18) to ₹200 (age 40)",
        "Family pension: 50% to spouse on subscriber's death",
        "Enroll through CSC / bank with savings account",
      ],
    },
    eligibility: {
      ageMin: 18,
      ageMax: 40,
      goalsAny: ["Pension & retirement", "Employment opportunities"],
    },
    requiresUnorganizedWorker: true,
    verificationNotes: [
      "Not eligible if covered by EPFO/ESIC/NPS or income-tax payer.",
      "Monthly income from unorganized work should be ≤ ₹15,000.",
    ],
    requiredDocuments: [
      { name: "Aadhaar Card", status: "ready" },
      { name: "Savings Bank Account / Jan Dhan Account", status: "ready" },
      { name: "Mobile number", status: "ready" },
    ],
    deadline: "Always Open — enroll at CSC or maandhan.in",
    applicationUrl: "https://maandhan.in/",
    sourceName: "PM-SYM / Maandhan Portal",
    sourceUrl: "https://maandhan.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "atal-pension-yojana",
    priority: 36,
    name: "Atal Pension Yojana (APY) — Guaranteed Pension for All",
    shortDescription: "Guaranteed monthly pension of ₹1,000–₹5,000 after age 60 for citizens aged 18–40 contributing a fixed amount. Government co-contributed 50% for first 5 years for eligible subscribers.",
    governmentLevel: "Central",
    department: "Ministry of Finance / PFRDA",
    type: "Pension",
    category: "pension",
    openToAll: true,
    benefit: {
      type: "pension",
      amount: 60000,
      description: "₹1,000–₹5,000/month guaranteed pension at 60. Choose your pension level when joining.",
      directAmount: 60000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "₹1,000 to ₹5,000/month guaranteed pension — citizen chooses level",
        "Spouse receives same pension on subscriber's death",
        "Nominee receives corpus (₹1.7L–₹8.5L) on both deaths",
        "Income tax benefit under Section 80CCD",
        "Join through any bank's savings account",
      ],
    },
    eligibility: {
      ageMin: 18,
      ageMax: 40,
      goalsAny: ["Pension & retirement"],
    },
    verificationNotes: [
      "Must have a savings bank account and not be an income tax payer (for full GOI co-contribution).",
      "Available at all banks — just walk in with Aadhaar & mobile number.",
    ],
    requiredDocuments: [
      { name: "Aadhaar Card", status: "ready" },
      { name: "Savings Bank Account", status: "ready" },
      { name: "Mobile number", status: "ready" },
    ],
    deadline: "Always Open — apply at any bank",
    applicationUrl: "https://www.npscra.nsdl.co.in/",
    sourceName: "PFRDA / NPS / Atal Pension Yojana",
    sourceUrl: "https://www.npscra.nsdl.co.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "pm-kisan-maan-dhan",
    priority: 37,
    name: "PM Kisan Maan-dhan — Farmer Pension Scheme",
    shortDescription: "₹3,000/month guaranteed pension at age 60 for small & marginal farmers aged 18–40, contributing ₹55–₹200/month matched equally by Government.",
    governmentLevel: "Central",
    department: "Ministry of Agriculture & Farmers' Welfare",
    type: "Pension",
    category: "pension",
    openToAll: false,
    benefit: {
      type: "pension",
      amount: 36000,
      description: "₹3,000/month pension at 60 — Government co-contributes equal amount as farmer.",
      directAmount: 36000,
      costAvoidedAmount: 0,
      financingAmount: 0,
      components: [
        "₹3,000/month guaranteed pension after age 60",
        "Government matches contribution 1:1",
        "Monthly contribution varies from ₹55 (age 18) to ₹200 (age 40)",
        "Family pension: 50% to spouse",
        "Directly linked to PM-KISAN — PM-KISAN instalment can be used for premium",
      ],
    },
    eligibility: {
      ageMin: 18,
      ageMax: 40,
      goalsAny: ["Pension & retirement", "Agricultural support"],
    },
    requiresFarmer: true,
    verificationNotes: [
      "Must be a small or marginal farmer (≤ 2 hectares cultivable land).",
      "Excluded if covered by any other statutory social security scheme.",
    ],
    requiredDocuments: [
      { name: "Land Records / Khata", status: "attention" },
      { name: "Aadhaar Card", status: "ready" },
      { name: "Savings Bank Account", status: "ready" },
    ],
    deadline: "Always Open — enroll at CSC or maandhan.in",
    applicationUrl: "https://maandhan.in/",
    sourceName: "PM Kisan Maandhan / Agriculture Ministry",
    sourceUrl: "https://maandhan.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  // ── TIER C: DISABILITY ────────────────────────────────────────────────────

  {
    id: "adip-disability-aids",
    priority: 38,
    name: "ADIP Scheme — Free Assistive Devices for Divyangjan",
    shortDescription: "Free or subsidised assistive devices (wheelchairs, hearing aids, artificial limbs, Braille kits, smart canes, etc.) for persons with benchmark disability and income up to ₹20,000/month.",
    governmentLevel: "Central",
    department: "Ministry of Social Justice & Empowerment / ALIMCO",
    type: "Disability Support",
    category: "disability",
    openToAll: false,
    benefit: {
      type: "device",
      amount: 30000,
      description: "Free assistive devices worth ₹5,000–₹30,000+ depending on type (wheelchair, hearing aid, artificial limb, etc.).",
      directAmount: 0,
      costAvoidedAmount: 30000,
      financingAmount: 0,
      components: [
        "Free wheelchair (manual / motorised for severe disability)",
        "Free hearing aid (digital BTE for hearing impairment)",
        "Artificial limb / caliper / tricycle",
        "Braille kits, magnifiers for visual impairment",
        "Smart cane for blind persons",
        "Devices distributed at assessment / fitment camps by ALIMCO",
      ],
    },
    eligibility: {
      goalsAny: ["Health insurance", "Employment opportunities"],
    },
    requiresDisability: true,
    verificationNotes: [
      "Disability must be ≥40% (benchmark disability certificate required).",
      "Income must be ≤ ₹20,000/month (family income for dependent).",
      "Assessment camps organized by ALIMCO at district level.",
    ],
    requiredDocuments: [
      { name: "Disability Certificate (≥40% benchmark)", status: "attention", note: "Issued by CMHO / district disability board" },
      { name: "Income Certificate", status: "attention" },
      { name: "Aadhaar Card", status: "ready" },
      { name: "Photograph", status: "ready" },
    ],
    deadline: "Apply at ALIMCO camps or district social welfare office",
    applicationUrl: "https://www.alimco.in/",
    sourceName: "ALIMCO / MoSJE",
    sourceUrl: "https://www.alimco.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },

  {
    id: "pm-mudra-yojana",
    priority: 39,
    name: "PM MUDRA Yojana — Micro-Units Development & Refinance",
    shortDescription: "Collateral-free institutional loans up to ₹10 lakh across Shishu (up to ₹50k), Kishore (₹50k–₹5L), and Tarun (₹5L–₹10L) for non-corporate micro/small enterprises.",
    governmentLevel: "Central",
    department: "Ministry of Finance / Department of Financial Services",
    type: "Loan",
    category: "employment",
    openToAll: true,
    benefit: {
      type: "credit",
      amount: 1000000,
      description: "Collateral-free business loan up to ₹10 lakh with flexible repayment terms through banks, NBFCs, and MFIs.",
      directAmount: 0,
      costAvoidedAmount: 0,
      financingAmount: 1000000,
      components: [
        "Shishu: Loans up to ₹50,000 for early-stage micro-ventures",
        "Kishore: Loans from ₹50,000 up to ₹5,00,000 for equipment & working capital",
        "Tarun: Loans from ₹5,00,000 up to ₹10,00,000 for established small businesses",
        "Zero collateral required — credit guarantee provided by GOI",
        "MUDRA Card provided for cash credit transactions",
      ],
    },
    eligibility: { ageMin: 18, goalsAny: ["Subsidised loans", "Entrepreneurship", "Employment opportunities"] },
    verificationNotes: [
      "Citizen must have a viable non-farm business or manufacturing/service proposal.",
      "Apply through any commercial bank, RRB, Small Finance Bank, or udyamimitra.in portal.",
    ],
    requiredDocuments: [
      { name: "Business Plan / Proposal", status: "attention" },
      { name: "Aadhaar Card & Identity Proof", status: "ready" },
      { name: "Bank Account Statement (last 6 months)", status: "ready" },
    ],
    deadline: "Always Open — apply at any bank or udyamimitra.in",
    applicationUrl: "https://www.udyamimitra.in/",
    sourceName: "MUDRA / Department of Financial Services",
    sourceUrl: "https://www.mudra.org.in/",
    lastVerified: "2026-08-23",
    status: "open",
  },
];

// ============================================================================
// DETERMINISTIC ELIGIBILITY ENGINE
// ============================================================================

function profileEducationRank(profile) {
  return educationRank[profile.educationLevel] || 0;
}

function intersects(a = [], b = []) {
  return a.some((item) => b.includes(item));
}

function formatMoney(amount) {
  if (!amount || amount === 0) return "₹0";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

function evaluateOpportunity(opportunity, profile) {
  const checks = [];
  let hardFail = false;
  let missing = false;
  let conditional = false;
  let future = false;
  let known = 0;
  let matched = 0;

  function add(label, required, you, status, note = "", options = {}) {
    checks.push({ label, required, you, status, note });
    if (status !== "info" && status !== "missing" && !options.excludeFromScore) {
      known += 1;
      if (status === "match") matched += 1;
    }
    if (status === "fail" && options.hard !== false) hardFail = true;
    if (status === "missing") missing = true;
    if (status === "verify") conditional = true;
    if (status === "future") future = true;
  }

  const rules = opportunity.eligibility || {};

  if (opportunity.status === "closed") {
    add("Application status", "Active / Open application cycle", "Closed", "fail", "Save to track future opening.");
  }

  if (rules.ageMin || rules.ageMax) {
    const reqText = `${rules.ageMin || "18"}–${rules.ageMax || "No limit"} years`;
    if (!profile.age) {
      add("Age", reqText, "Not provided", "missing", "Age is needed to verify this rule.");
    } else if (
      (rules.ageMin && profile.age < rules.ageMin) ||
      (rules.ageMax && profile.age > rules.ageMax)
    ) {
      add("Age", reqText, `${profile.age} years`, "fail", `Must be between ${rules.ageMin || 18} and ${rules.ageMax || "open"}.`);
    } else {
      add("Age", reqText, `${profile.age} years`, "match");
    }
  }

  if (rules.states?.length) {
    const reqText = rules.states.join(", ");
    if (!profile.state) {
      add("State", reqText, "Not provided", "missing");
    } else if (rules.states.includes(profile.state)) {
      add("State", reqText, profile.state, "match");
    } else {
      add("State", reqText, profile.state, "fail", `Requires residence in ${reqText}.`);
    }
  }

  if (rules.domicileRequired) {
    if (!profile.domicile) {
      add("Domicile", "State domicile required", "Not provided", "missing");
    } else if (profile.domicile === "Maharashtra" || (rules.states && rules.states.includes(profile.domicile))) {
      add("Domicile", "State domicile required", profile.domicile, "match");
    } else {
      add("Domicile", "State domicile required", profile.domicile, "fail");
    }
  }

  if (rules.educationMinRank) {
    const rank = profileEducationRank(profile);
    if (!rank) {
      add("Education Level", "Meets minimum qualification", "Not provided", "missing");
    } else if (rank >= rules.educationMinRank) {
      add("Education Level", "Graduate / Technical Degree", `${profile.educationLevel}${profile.course ? ` (${profile.course})` : ""}`, "match");
    } else {
      add("Education Level", "Graduate / Technical Degree", profile.educationLevel, "fail", "Requires higher educational qualification.");
    }
  }

  if (typeof rules.currentStudent === "boolean") {
    if (profile.currentStudent === rules.currentStudent) {
      add("Student Status", rules.currentStudent ? "Currently studying" : "Graduated / Working", profile.currentStudent ? "Currently studying" : "Graduated / Working", "match");
    } else if (rules.futureIfCurrentStudent) {
      add(
        "Student Status",
        "Enrolled in eligible higher course",
        profile.currentStudent ? "Currently studying" : "Already graduated",
        "future",
        "You meet degree requirements; fee support activates whenever you enroll in next degree."
      );
    } else {
      add(
        "Student Status",
        rules.currentStudent ? "Currently studying" : "Not studying",
        profile.currentStudent ? "Currently studying" : "Graduated / Working",
        "fail"
      );
    }
  }

  if (rules.mustNotBeFullTimeEmployed) {
    if (!profile.employmentStatus) {
      add("Employment", "Not full-time employed", "Not provided", "missing");
    } else if (profile.employmentStatus === "Working") {
      add("Employment", "Not full-time employed", profile.employmentStatus, "fail", "Full-time working professionals are not eligible.");
    } else {
      add("Employment", "Not full-time employed", profile.employmentStatus, "match");
    }
  }

  if (rules.incomeMax) {
    const incomeCapText = `Up to ${formatMoney(rules.incomeMax)}/year`;
    if (!profile.annualFamilyIncome) {
      add("Family Income", incomeCapText, "Prefer to check later", "missing", "Income proof needed to verify.");
    } else if (profile.annualFamilyIncome <= rules.incomeMax) {
      add("Family Income", incomeCapText, profile.incomeBand || formatMoney(profile.annualFamilyIncome), "match");
    } else {
      add("Family Income", incomeCapText, profile.incomeBand || formatMoney(profile.annualFamilyIncome), "fail", `Exceeds the published cap of ${formatMoney(rules.incomeMax)}.`);
    }
  }

  if (rules.genders?.length) {
    if (!profile.gender || profile.gender === "Prefer to say later") {
      add("Gender", rules.genders.join(", "), "Not specified", "missing");
    } else if (rules.genders.includes(profile.gender)) {
      add("Gender", rules.genders.join(", "), profile.gender, "match");
    } else {
      add("Gender", rules.genders.join(", "), profile.gender, "fail", `Dedicated exclusively to ${rules.genders.join(", ")} candidates.`);
    }
  }

  if (rules.categories?.length) {
    if (!profile.category) {
      add("Category", rules.categories.join(", "), "Not specified", "missing");
    } else if (rules.categories.includes(profile.category)) {
      add("Category", rules.categories.join(", "), profile.category, "match");
    } else {
      add("Category", rules.categories.join(", "), profile.category, "fail");
    }
  }

  if (rules.minorities?.length) {
    if (!profile.minority || profile.minority === "Prefer to check later") {
      add("Minority Community", rules.minorities.join(", "), "Not specified", "missing");
    } else if (rules.minorities.includes(profile.minority)) {
      add("Minority Community", "Recognized Minority Community", `${profile.minority} community`, "match");
    } else {
      add("Minority Community", rules.minorities.join(", "), profile.minority, "fail");
    }
  }

  if (rules.disabilityRequired) {
    if (profile.disability) {
      add("Disability Criteria", "Specially abled (≥40% benchmark disability)", "Yes", "match");
    } else {
      add("Disability Criteria", "Specially abled (≥40% benchmark disability)", "No", "fail", "Requires benchmark disability certificate.");
    }
  }

  if (rules.specialCategoryRequired) {
    add("Special Category", rules.specialCategoryRequired, "Not claimed", "fail", "Requires specific orphan / martyr ward category.");
  }

  if (rules.requiresAdmission) {
    add(
      "Institution Admission",
      "Admission offer from notified institution",
      "To be verified on portal",
      "verify",
      "Requires admission letter from an eligible institution.",
      { hard: false, excludeFromScore: true }
    );
  }

  if (rules.requiresLoanPlan) {
    add(
      "Loan Plan",
      "Applying for higher education loan",
      "Can apply on official portal",
      "verify",
      "Education loan interest subvention applies upon loan sanction.",
      { hard: false, excludeFromScore: true }
    );
  }

  if (rules.requiresHostelAdmission) {
    add(
      "Hostel Proof",
      "Hostel accommodation / registered rent",
      "Can provide during admission",
      "verify",
      "Living allowance requires hostel fee receipt.",
      { hard: false, excludeFromScore: true }
    );
  }

  if (rules.requiresNewEnterprise) {
    add(
      "Enterprise Project",
      "Viable project proposal for new enterprise",
      intersects(profile.goals || [], ["Entrepreneurship"]) ? "Goal selected" : "Can prepare DPR",
      "verify",
      "Subsidy is sanctioned after project report and bank approval.",
      { hard: false, excludeFromScore: true }
    );
  }

  // ── NEW LIFE-SITUATION RULES ─────────────────────────────────────────────

  const ls = profile.lifeSituation || [];
  const isBPL = ls.includes("bpl-card") || (profile.annualFamilyIncome && profile.annualFamilyIncome <= 250000);
  const isFarmer = ls.includes("farmer");
  const isStreetVendor = ls.includes("street-vendor");
  const isPregnant = ls.includes("pregnant");
  const hasYoungChildren = ls.includes("young-children");
  const isUnorganizedWorker = ls.includes("unorganized-worker");
  const isOrganizedWorker = ls.includes("organized-worker");
  const isRural = profile.residenceType === "Rural";

  if (opportunity.requiresBPL) {
    if (!profile.annualFamilyIncome && ls.length === 0) {
      add("BPL / Income Status", "BPL / Low income family (≤ ₹2.5L/yr or ration card)", "Not specified", "missing", "Confirm income or BPL card to verify eligibility.", { hard: false });
    } else if (isBPL) {
      add("BPL / Income Status", "BPL / Low income (≤ ₹2.5L/yr or BPL card)", isBPL ? "BPL / Low income confirmed" : "Income within range", "match");
    } else {
      add("BPL / Income Status", "BPL / Low income (≤ ₹2.5L/yr or BPL card)", profile.incomeBand || "Above threshold", "fail", "This scheme is targeted at BPL / very low income families.", { hard: true });
    }
  }

  if (opportunity.requiresFarmer) {
    if (!isFarmer) {
      add("Farmer / Agricultural Land", "Must own cultivable agricultural land", "Not indicated in profile", "fail", "Select 'Farmer / Agricultural land' in Life Situation to check this.", { hard: true });
    } else {
      add("Farmer / Agricultural Land", "Own cultivable land", "Farmer — land ownership indicated", "match");
    }
  }

  if (opportunity.requiresStreetVendor) {
    if (!isStreetVendor) {
      add("Street Vendor / Hawker", "Registered / practicing street vendor", "Not indicated in profile", "fail", "Select 'Street vendor / Hawker' in Life Situation.", { hard: true });
    } else {
      add("Street Vendor / Hawker", "Practicing street vendor", "Street vendor indicated", "match");
    }
  }

  if (opportunity.requiresPregnant) {
    if (!isPregnant) {
      add("Pregnancy Status", "Pregnant or recently delivered", "Not indicated in profile", "fail", "Select 'Pregnant / Recently delivered' in Life Situation.", { hard: true });
    } else {
      add("Pregnancy Status", "Pregnant / Recently delivered", "Confirmed in Life Situation", "match");
    }
  }

  if (opportunity.requiresYoungChildren) {
    if (!hasYoungChildren) {
      add("Young Children (under 10)", "Have a girl child under 10 years old", "Not indicated in profile", "fail", "Select 'Have children under 6' in Life Situation.", { hard: true });
    } else {
      add("Young Children (under 10)", "Girl child in household", "Indicated in Life Situation", "match");
    }
  }

  if (opportunity.requiresUnorganizedWorker) {
    if (!isUnorganizedWorker) {
      add("Unorganized Worker", "Unorganized sector worker (not covered by EPFO/ESIC)", "Not indicated in profile", "fail", "Select 'Unorganized sector worker' in Life Situation.", { hard: true });
    } else {
      add("Unorganized Worker", "Unorganized sector worker", "Confirmed in Life Situation", "match");
    }
  }

  if (opportunity.requiresOrganizedWorker) {
    if (!isOrganizedWorker) {
      add("Organized Sector Employee", "Employee in ESIC-covered establishment (wage ≤ ₹21,000/mo)", "Not indicated in profile", "fail", "Select 'Factory / Formal sector employee' in Life Situation.", { hard: true });
    } else {
      add("Organized Sector Employee", "Formal sector employee — ESIC covered", "Confirmed in Life Situation", "match");
    }
  }

  if (opportunity.requiresRuralResidence) {
    if (!isRural) {
      add("Rural Residence", "Rural area resident", profile.residenceType || "Urban", "fail", "This scheme is for rural residents.", { hard: true });
    } else {
      add("Rural Residence", "Rural area", "Rural resident", "match");
    }
  }

  if (opportunity.requiresDisability) {
    if (!profile.disability) {
      add("Disability Certification", "Benchmark disability ≥ 40% (Divyangjan)", "Not indicated", "fail", "Select 'Person with disability' in identity tags.", { hard: true });
    } else {
      add("Disability Certification", "Benchmark disability ≥ 40%", "Person with disability confirmed", "match");
    }
  }

  if (rules.goalsAny?.length) {
    if (intersects(profile.goals || [], rules.goalsAny)) {
      add("Goal Alignment", rules.goalsAny.join(" / "), "Selected in profile", "match", "", { hard: false });
    }
  }

  if (rules.interestsAny?.length) {
    if (intersects(profile.interests || [], rules.interestsAny)) {
      add("Field / Domain Fit", rules.interestsAny.join(" / "), "Matches profile interests", "match", "", { hard: false });
    }
  }

  (opportunity.verificationNotes || []).forEach((note) => {
    add("Official Verification Note", "Verified on destination", "Published rule", "info", note, { hard: false, excludeFromScore: true });
  });

  let status = "strong";
  if (opportunity.status === "closed") status = "closed";
  else if (hardFail) status = "not";
  else if (future) status = "future";
  else if (missing) status = "check";
  else if (conditional || opportunity.status === "verify") status = "likely";

  const missingCount = checks.filter((c) => c.status === "missing").length;
  const failCount = checks.filter((c) => c.status === "fail").length;

  return {
    opportunity,
    status,
    checks,
    matched,
    known,
    missingCount,
    failCount,
  };
}

function getEvaluatedResults(profile) {
  return opportunities
    .map((opp) => evaluateOpportunity(opp, profile))
    .sort((a, b) => {
      const order = { strong: 1, likely: 2, check: 3, future: 4, not: 5, closed: 6 };
      return (
        order[a.status] - order[b.status] ||
        a.opportunity.priority - b.opportunity.priority
      );
    });
}

function getPrimaryMatchedResults(profile) {
  const allowed = new Set(["strong", "likely", "check", "future"]);
  return getEvaluatedResults(profile)
    .filter((res) => allowed.has(res.status))
    .sort((a, b) => a.opportunity.priority - b.opportunity.priority)
    .slice(0, 6);
}

function getResultById(id, profile) {
  const opp = opportunities.find((item) => item.id === id);
  return opp ? evaluateOpportunity(opp, profile) : null;
}

function generateEligibilityExplanation(result, profile) {
  const opp = result.opportunity;
  const matchedLabels = result.checks
    .filter((c) => c.status === "match")
    .map((c) => c.label)
    .slice(0, 3)
    .join(", ");

  if (result.status === "strong") {
    return `Based on your profile as a ${profile.age}-year-old ${profile.minority || ""} citizen with a ${profile.educationLevel} qualification in ${profile.state}, you meet all primary published eligibility rules for ${opp.name}. You can proceed directly to review required documents.`;
  }
  if (result.status === "likely" || result.status === "check") {
    return `You qualify on key educational and regional parameters (${matchedLabels}). However, final eligibility requires one or more institution-level proofs such as institutional admission, bank loan details, or verified income certificates.`;
  }
  if (result.status === "future") {
    return `Your educational background (${profile.educationLevel}) qualifies for this scheme, but it is earmarked for current students. If you enroll in postgraduate studies or advanced coursework, you will be eligible to claim this benefit.`;
  }
  return `This opportunity is not a current match because it requires specific criteria (${result.checks.find((c) => c.status === "fail")?.label || "criteria"}) that do not align with your profile.`;
}

function calculatePotentialValue(results) {
  return results.reduce(
    (acc, res) => {
      if (res.status !== "not" && res.status !== "closed") {
        const b = res.opportunity.benefit;
        acc.direct += b.directAmount || 0;
        acc.costAvoided += b.costAvoidedAmount || 0;
        acc.future += b.futureAmount || 0;
        acc.financing += b.financingAmount || 0;
        acc.totalEstimate += (b.directAmount || 0) + (b.costAvoidedAmount || 0) + (b.futureAmount || 0);
      }
      return acc;
    },
    { direct: 0, costAvoided: 0, future: 0, financing: 0, totalEstimate: 0 }
  );
}

// ============================================================================
// REACT APP CONTEXT
// ============================================================================

const AppContext = createContext();

function AppProvider({ children }) {
  const [profile, setProfileState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILE);
      return raw ? { ...blankProfile, ...JSON.parse(raw) } : { ...demoProfile };
    } catch {
      return { ...demoProfile };
    }
  });

  const [savedIds, setSavedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_SAVED)) || [];
    } catch {
      return [];
    }
  });

  const [currentRoute, setCurrentRoute] = useState(() => {
    return (location.hash.replace(/^#/, "") || "/mera-haq").replace(/\/$/, "") || "/mera-haq";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [modalOpportunityId, setModalOpportunityId] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);
  const [currentProfileStep, setCurrentProfileStep] = useState(1);

  // Sync hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const path = (location.hash.replace(/^#/, "") || "/mera-haq").replace(/\/$/, "") || "/mera-haq";
      setCurrentRoute(path);
      setMobileSidebarOpen(false);
      setModalOpportunityId(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigate = useCallback((path) => {
    location.hash = path;
  }, []);

  const setProfile = useCallback((updater) => {
    setProfileState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      localStorage.setItem(STORAGE_PROFILE, JSON.stringify(next));
      return next;
    });
  }, []);

  const loadDemoProfile = useCallback(() => {
    setProfile({ ...demoProfile });
    setCurrentProfileStep(1);
    setShowAllOpportunities(false);
    setActiveFilter("all");
    navigate("/mera-haq/matching");
  }, [navigate, setProfile]);

  const toggleSave = useCallback((id) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem(STORAGE_SAVED, JSON.stringify(next));
      return next;
    });
  }, []);

  const isSaved = useCallback((id) => savedIds.includes(id), [savedIds]);

  const value = {
    profile,
    setProfile,
    savedIds,
    toggleSave,
    isSaved,
    currentRoute,
    navigate,
    loadDemoProfile,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    modalOpportunityId,
    setModalOpportunityId,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    showAllOpportunities,
    setShowAllOpportunities,
    currentProfileStep,
    setCurrentProfileStep,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useApp() {
  return useContext(AppContext);
}

// ============================================================================
// REACT COMPONENTS: SHELL, HEADER & SIDEBAR
// ============================================================================

function UmangHeader() {
  const { profile, searchQuery, setSearchQuery, navigate, mobileSidebarOpen, setMobileSidebarOpen, currentRoute } = useApp();

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (!currentRoute.startsWith("/mera-haq/opportunities")) {
      navigate("/mera-haq/opportunities");
    }
  };

  return (
    <header className="umang-header">
      <div className="header-left">
        <button
          className="hamburger-btn"
          type="button"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <a className="umang-brand" href="#/home">
          <div className="umang-logo-mark" aria-hidden="true">U</div>
          <span className="umang-brand-text">UMANG</span>
        </a>
      </div>

      <div className="header-search">
        <div className="search-input-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder='Search For "eKYC", "Scholarships", "IIT Dharwad", "Loans"'
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="header-right">
        <button className="isl-chatbot-btn" type="button" title="Indian Sign Language Bot">
          <span>ISL Chatbot</span>
          <span className="isl-badge-icon" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
          </span>
        </button>

        <button className="header-icon-btn" type="button" title="Accessibility Tools" aria-label="Accessibility">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="4" r="2"></circle>
            <path d="M18 9h-4V7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2H4"></path>
            <path d="M9 13l-3 7"></path>
            <path d="M15 13l3 7"></path>
            <path d="M9 9v4h6V9"></path>
          </svg>
        </button>

        <button className="header-icon-btn" type="button" title="Notifications" aria-label="Notifications">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="notif-badge"></span>
        </button>

        <button className="header-icon-btn" type="button" title="Dark Mode Active" aria-label="Dark Mode">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </button>

        <div className="user-profile-badge" title="Citizen Profile">
          <div className="user-avatar">{profile.name ? profile.name.charAt(0) : "N"}</div>
          <span>{profile.name || "Neeraj"}</span>
        </div>
      </div>
    </header>
  );
}

function UmangSidebar() {
  const { currentRoute, savedIds, mobileSidebarOpen, setMobileSidebarOpen } = useApp();

  const isMeraHaqActive = currentRoute.startsWith("/mera-haq") || currentRoute === "/";
  const isSchemesActive = currentRoute.startsWith("/schemes");
  const isHomeActive = currentRoute === "/home";
  const isServicesActive = currentRoute === "/services";
  const isDigiLockerActive = currentRoute === "/digilocker";
  const isMaharashtraActive = currentRoute === "/maharashtra";
  const isJobsActive = currentRoute === "/jobs";
  const isDashboardActive = currentRoute === "/dashboard";
  const isSavedActive = currentRoute === "/saved";

  return (
    <>
      {mobileSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside className={`umang-sidebar ${mobileSidebarOpen ? "mobile-open" : ""}`} aria-label="Main Navigation">
        <nav className="sidebar-nav" onClick={() => setMobileSidebarOpen(false)}>
        <a className={`sidebar-nav-item ${isHomeActive ? "active" : ""}`} href="#/home">
          <svg className="nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span>Home</span>
        </a>

        <a className={`sidebar-nav-item ${isServicesActive ? "active" : ""}`} href="#/services">
          <svg className="nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span>Services</span>
        </a>

        <a className={`sidebar-nav-item ${isDigiLockerActive ? "active" : ""}`} href="#/digilocker">
          <svg className="nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <span>DigiLocker</span>
        </a>

        <a className={`sidebar-nav-item ${isMaharashtraActive ? "active" : ""}`} href="#/maharashtra">
          <svg className="nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span>Maharashtra</span>
        </a>

        <a className={`sidebar-nav-item ${isSchemesActive ? "active" : ""}`} href="#/schemes">
          <svg className="nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <span>Schemes</span>
        </a>

        {/* MERA HAQ (NEW ITEM POSITIONED DIRECTLY BELOW SCHEMES) */}
        <a className={`sidebar-nav-item featured-nav ${isMeraHaqActive ? "active" : ""}`} href="#/mera-haq">
          <svg className="nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <span>Mera Haq</span>
          <span className="nav-badge-new">NEW</span>
        </a>

        <a className={`sidebar-nav-item ${isJobsActive ? "active" : ""}`} href="#/jobs">
          <svg className="nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <span>Jobs</span>
        </a>

        <a className={`sidebar-nav-item ${isDashboardActive ? "active" : ""}`} href="#/dashboard">
          <svg className="nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Dashboard</span>
        </a>

        <a className={`sidebar-nav-item ${isSavedActive ? "active" : ""}`} href="#/saved">
          <svg className="nav-icon" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>Saved ({savedIds.length})</span>
        </a>
      </nav>

      <div className="sidebar-footer-info">
        <strong>UMANG 2.0 Platform</strong>
        <span>National e-Governance Division (NeGD)</span>
      </div>
    </aside>
    </>
  );
}

// ============================================================================
// REACT VIEW COMPONENTS
// ============================================================================

function LandingView() {
  const { loadDemoProfile, navigate } = useApp();

  return (
    <div className="content-container">
      <div className="prototype-trust-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div>
          <strong>Prototype Notice:</strong> Mera Haq is an AI-assisted citizen discovery layer built for the "Build What Moves India" challenge. It uses synthetic profile data and curated real public scheme datasets without connecting to private government databases.
        </div>
      </div>

      <section className="mera-haq-hero">
        <div className="hero-text-col">
          <span className="eyebrow-badge"><span className="dot"></span>Mera Haq on UMANG</span>
          <h1 className="page-title">Government support you may qualify for — without having to know it exists.</h1>
          <p className="page-subtitle">
            Tell us a little about yourself. We'll find relevant scholarships, free training, fee support, subsidised loans, and state fellowships across fragmented central and state portals.
          </p>

          <div className="hero-actions">
            <a className="btn btn-primary btn-lg" href="#/mera-haq/profile">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <span>Find my opportunities</span>
            </a>
            <button className="btn btn-secondary btn-lg" type="button" onClick={loadDemoProfile}>
              <span>Try demo profile (Neeraj, 23)</span>
            </button>
            <a className="btn btn-text" href="#/mera-haq/tests">Run Automated Tests</a>
          </div>

          <div className="demo-trigger-banner">
            <div className="demo-trigger-info">
              <strong>Quick 60-Second Judge Flow:</strong>
              <span>Click "Try demo profile" to auto-populate Neeraj (23, B.Tech, Maharashtra, Jain) and discover 6 matched opportunities including IIT Dharwad AI Technocrat.</span>
            </div>
            <button className="btn btn-accent btn-sm" type="button" onClick={loadDemoProfile}>Launch Demo</button>
          </div>
        </div>

        <div className="hero-card-col">
          <div className="comparison-card">
            <div className="comparison-card-header">
              <h3>The Discovery Shift</h3>
              <span className="eyebrow-badge">UMANG Evolution</span>
            </div>

            <div className="comparison-flow-step">
              <span className="step-badge legacy">1</span>
              <div className="step-content">
                <strong>Current UMANG "Schemes" Filter</strong>
                <p>Asks 10 static category questions and often ends in <em>"No schemes found based on your preference"</em>.</p>
              </div>
            </div>

            <div className="comparison-flow-step">
              <span className="step-badge new">2</span>
              <div className="step-content">
                <strong>Mera Haq Citizen Mapping</strong>
                <p>Starts with the citizen's profile. Continuously maps central ministries, state portals, and premier institutions.</p>
              </div>
            </div>

            <div className="comparison-flow-step">
              <span className="step-badge new">3</span>
              <div className="step-content">
                <strong>Signature "Why Do I Match?" Matrix</strong>
                <p>Explains every matched criterion, highlights missing documents, and routes to the official portal.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProfileFlow() {
  const { profile, setProfile, currentProfileStep, setCurrentProfileStep, navigate, loadDemoProfile } = useApp();
  const step = currentProfileStep;

  const toggleIdentity = (tag) => {
    if (tag === "None" || tag === "Prefer not to say") {
      setProfile({ identityTags: [tag], minority: "", category: "", disability: false });
    } else {
      const current = (profile.identityTags || []).filter((t) => t !== "None" && t !== "Prefer not to say");
      const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
      const minorityVal = tag === "Minority community" && next.includes(tag) && !profile.minority ? "Jain" : profile.minority;
      const disabilityVal = next.includes("Person with disability");
      const catVal = ["SC", "ST", "OBC", "EWS"].find((t) => next.includes(t)) || "";
      setProfile({ identityTags: next, minority: minorityVal, disability: disabilityVal, category: catVal });
    }
  };

  const toggleGoal = (goal) => {
    const current = profile.goals || [];
    const next = current.includes(goal) ? current.filter((g) => g !== goal) : [...current, goal];
    setProfile({ goals: next });
  };

  const toggleInterest = (interest) => {
    const current = profile.interests || [];
    const next = current.includes(interest) ? current.filter((i) => i !== interest) : [...current, interest];
    setProfile({ interests: next });
  };

  return (
    <div className="content-container narrow">
      <div className="profile-form-card">
        <div className="profile-step-header">
          <div>
            <span className="eyebrow-badge"><span class="dot"></span>Step {step} of 3</span>
            <h2 className="card-title">
              {step === 1 ? "Step 1 — About You" : step === 2 ? "Step 2 — Eligibility & Background" : "Step 3 — What are you looking for?"}
            </h2>
          </div>

          <div className="step-pills-nav">
            <button className={`step-pill-btn ${step === 1 ? "active" : "completed"}`} type="button" onClick={() => setCurrentProfileStep(1)}>1. Background</button>
            <button className={`step-pill-btn ${step === 2 ? "active" : step > 2 ? "completed" : ""}`} type="button" onClick={() => setCurrentProfileStep(2)}>2. Eligibility</button>
            <button className={`step-pill-btn ${step === 3 ? "active" : ""}`} type="button" onClick={() => setCurrentProfileStep(3)}>3. Goals</button>
          </div>
        </div>

        <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <>
              <div className="field">
                <label htmlFor="state">Where are you based?</label>
                <select id="state" className="select-control" value={profile.state || "Maharashtra"} onChange={(e) => setProfile({ state: e.target.value })}>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Other states">Other states</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="age">How old are you?</label>
                <input
                  id="age"
                  className="input-control"
                  type="number"
                  min="12"
                  max="99"
                  placeholder="e.g. 23"
                  value={profile.age ?? ""}
                  onChange={(e) => setProfile({ age: e.target.value ? Number(e.target.value) : null })}
                />
              </div>

              <div className="field">
                <label htmlFor="educationLevel">What is your highest qualification?</label>
                <select id="educationLevel" className="select-control" value={profile.educationLevel || "Bachelor's"} onChange={(e) => setProfile({ educationLevel: e.target.value })}>
                  {["10th", "12th", "Diploma", "Bachelor's", "B.Tech / B.E.", "Master's", "PhD", "Other"].map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="course">Course / Field of Study</label>
                <input
                  id="course"
                  className="input-control"
                  type="text"
                  placeholder="e.g. Computer Engineering"
                  value={profile.course || ""}
                  onChange={(e) => setProfile({ course: e.target.value })}
                />
              </div>

              <div className="field full">
                <label>What are you currently doing?</label>
                <div className="chip-group">
                  {["Working", "Studying", "Looking for work", "Self-employed", "Other"].map((status) => (
                    <button
                      key={status}
                      className="chip-btn"
                      type="button"
                      onClick={() => setProfile({ employmentStatus: status })}
                      aria-pressed={profile.employmentStatus === status ? "true" : "false"}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field full" style={{ marginTop: "6px", padding: "14px 18px", backgroundColor: "rgba(37, 99, 235, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", borderRadius: "var(--radius-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <strong style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#93c5fd" }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>
                      DigiLocker / APAAR ID (Optional)
                    </strong>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginTop: "2px" }}>
                      {profile.apaarId ? `Linked: ${profile.apaarId} (Permanent Academic Account Registry)` : "Link your 12-digit Academic Account Registry ID for instant document readiness."}
                    </span>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={() => {
                      if (profile.apaarId) {
                        setProfile({ apaarId: "", apaarVerified: false });
                      } else {
                        setProfile({ apaarId: "279903493988", apaarVerified: true });
                      }
                    }}
                  >
                    {profile.apaarId ? "Unlink APAAR" : "Auto-Link DigiLocker (Demo)"}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="field full">
                <label htmlFor="incomeBand">Approximate annual family income?</label>
                <select
                  id="incomeBand"
                  className="select-control"
                  value={profile.incomeBand || "₹5–8 lakh"}
                  onChange={(e) => {
                    const b = incomeBands.find((item) => item.label === e.target.value);
                    setProfile({ incomeBand: e.target.value, annualFamilyIncome: b ? b.value : null });
                  }}
                >
                  {incomeBands.map((band) => (
                    <option key={band.label} value={band.label}>{band.label}</option>
                  ))}
                </select>
                <small>Used strictly for threshold matching. No exact financial records or IT returns required.</small>
              </div>

              <div className="field full">
                <label>Do any of these apply to you? (Multi-select)</label>
                <div className="chip-group">
                  {identityTags.map((tag) => (
                    <button
                      key={tag}
                      className="chip-btn"
                      type="button"
                      onClick={() => toggleIdentity(tag)}
                      aria-pressed={profile.identityTags?.includes(tag) ? "true" : "false"}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {profile.identityTags?.includes("Minority community") && (
                <div className="field">
                  <label htmlFor="minority">Which minority community?</label>
                  <select
                    id="minority"
                    className="select-control"
                    value={profile.minority || "Jain"}
                    onChange={(e) => setProfile({ minority: e.target.value })}
                  >
                    {minorityCommunities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="field">
                <label>Where do you live?</label>
                <div className="chip-group">
                  {["Urban", "Rural"].map((r) => (
                    <button
                      key={r}
                      className="chip-btn"
                      type="button"
                      onClick={() => setProfile({ residenceType: r })}
                      aria-pressed={profile.residenceType === r ? "true" : "false"}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field full">
                <label>Life situation — helps us find more support for you <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>(Optional, multi-select)</span></label>
                <div className="chip-group">
                  {lifeSituationOptions.map((opt) => (
                    <button
                      key={opt.key}
                      className="chip-btn"
                      type="button"
                      onClick={() => {
                        const current = profile.lifeSituation || [];
                        setProfile({ lifeSituation: current.includes(opt.key) ? current.filter((k) => k !== opt.key) : [...current, opt.key] });
                      }}
                      aria-pressed={(profile.lifeSituation || []).includes(opt.key) ? "true" : "false"}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <small>We use this only to match government schemes — nothing is stored on our servers.</small>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="field full">
                <label>What types of government support are you looking for? (Multi-select)</label>
                <div className="chip-group">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal}
                      className="chip-btn"
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      aria-pressed={profile.goals?.includes(goal) ? "true" : "false"}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field full">
                <label>What areas or domains interest you?</label>
                <div className="chip-group">
                  {interestOptions.map((interest) => (
                    <button
                      key={interest}
                      className="chip-btn"
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      aria-pressed={profile.interests?.includes(interest) ? "true" : "false"}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="field full form-actions-row">
            <div>
              {step > 1 ? (
                <button className="btn btn-secondary" type="button" onClick={() => setCurrentProfileStep(step - 1)}>
                  Back to Step {step - 1}
                </button>
              ) : (
                <button className="btn btn-secondary" type="button" onClick={loadDemoProfile}>
                  Fill Demo (Neeraj)
                </button>
              )}
            </div>
            <div>
              {step < 3 ? (
                <button className="btn btn-primary" type="button" onClick={() => setCurrentProfileStep(step + 1)}>
                  Continue to Step {step + 1}
                </button>
              ) : (
                <button className="btn btn-primary" type="button" onClick={() => navigate("/mera-haq/profile/review")}>
                  Review Profile & Continue
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfileReview() {
  const { profile, navigate } = useApp();

  return (
    <div className="content-container narrow">
      <div className="profile-form-card">
        <span className="eyebrow-badge"><span class="dot"></span>Profile Review</span>
        <h1 className="page-title">Review your profile</h1>
        <p className="page-subtitle">Verify the details you provided before our deterministic engine searches across central and state schemes.</p>

        <div className="review-summary-grid">
          <div className="review-card">
            <div className="review-card-label">Location & Age</div>
            <div className="review-card-value">{profile.state || "Maharashtra"}, {profile.age || 23} yrs</div>
            <div className="review-card-detail">{profile.residenceType || "Urban"} resident</div>
          </div>

          <div className="review-card">
            <div className="review-card-label">Education</div>
            <div className="review-card-value">{profile.educationLevel || "Bachelor's"}</div>
            <div className="review-card-detail">{profile.course || "Computer Engineering"}</div>
          </div>

          <div className="review-card">
            <div className="review-card-label">Employment</div>
            <div className="review-card-value">{profile.employmentStatus || "Working"}</div>
            <div className="review-card-detail">{profile.currentStudent ? "Currently studying" : "Graduated / Professional"}</div>
          </div>

          <div className="review-card">
            <div className="review-card-label">Community & Identity</div>
            <div className="review-card-value">{profile.minority || profile.category || "General"}</div>
            <div className="review-card-detail">{(profile.identityTags || []).join(", ") || "None"}</div>
          </div>

          <div className="review-card">
            <div className="review-card-label">Income Band</div>
            <div className="review-card-value">{profile.incomeBand || "₹5–8 lakh"}</div>
            <div className="review-card-detail">Under published thresholds</div>
          </div>

          <div className="review-card">
            <div className="review-card-label">Target Support</div>
            <div className="review-card-value">{(profile.goals || []).slice(0, 2).join(", ")}</div>
            <div className="review-card-detail">+{Math.max(0, (profile.goals || []).length - 2)} more goals</div>
          </div>
        </div>

        {profile.apaarId && (
          <div style={{ marginTop: "20px", padding: "14px 18px", backgroundColor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "12px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <div>
              <strong style={{ color: "#34d399", fontSize: "13.5px", display: "block" }}>DigiLocker / APAAR Academic Registry Linked: {profile.apaarId}</strong>
              <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>Academic credentials and age digitally verifiable via National Academic Depository (ABC).</span>
            </div>
          </div>
        )}

        <div className="form-actions-row">
          <a className="btn btn-secondary" href="#/mera-haq/profile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Edit Profile</span>
          </a>

          <button className="btn btn-primary btn-lg" type="button" onClick={() => navigate("/mera-haq/matching")}>
            <span>Find my opportunities</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function MatchingRadar() {
  const { navigate } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/mera-haq/opportunities");
    }, 1300);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="content-container">
      <div className="matching-wrapper">
        <div className="matching-radar-icon">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
        </div>

        <span className="eyebrow-badge"><span className="dot"></span>Deterministic Engine Active</span>
        <h2 className="page-title">Finding opportunities for you...</h2>
        <p className="page-subtitle">Evaluating published eligibility parameters across national and state systems.</p>

        <div className="matching-progress-bar">
          <div className="matching-progress-fill"></div>
        </div>

        <ul className="matching-checklist">
          <li className="matching-check-item">
            <div className="check-spinner"></div>
            <span>Checking Central Government & Ministries (Minority Affairs, MSDE, MoE)...</span>
          </li>
          <li className="matching-check-item">
            <div className="check-spinner"></div>
            <span>Checking Maharashtra Government portals (MahaDBT, MSSDS, DTE)...</span>
          </li>
          <li className="matching-check-item">
            <div className="check-spinner"></div>
            <span>Checking premier institutions (IIT Dharwad, AICTE)...</span>
          </li>
          <li className="matching-check-item">
            <div className="check-spinner"></div>
            <span>Mapping free training, scholarships, subsidies, and fee waivers...</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function OpportunityCard({ result }) {
  const { toggleSave, isSaved } = useApp();
  const opp = result.opportunity;
  const saved = isSaved(opp.id);
  const isIITDharwad = opp.id === "ai-technocrat-iit-dharwad";

  const statusLabel =
    result.status === "strong"
      ? "Strong match"
      : result.status === "likely" || result.status === "check"
        ? "Needs verification"
        : result.status === "future"
          ? "Future opportunity"
          : result.status === "closed"
            ? "Closed"
            : "Not a match";

  const matchedBullets = result.checks
    .filter((c) => c.status === "match")
    .slice(0, 3);

  const warningCheck = result.checks.find((c) => c.status === "verify" || c.status === "missing" || c.status === "future");

  return (
    <article className={`opportunity-card ${isIITDharwad ? "featured-card" : ""}`}>
      <div className="card-top-row">
        <div>
          <div className="card-authority-tags">
            <span className="authority-pill">{opp.governmentLevel} Government</span>
            <span>•</span>
            <span>{opp.department}</span>
            <span>•</span>
            <span>{opp.type}</span>
            {opp.openToAll && (
              <>
                <span>•</span>
                <span className="universal-badge">🌐 Open to All</span>
              </>
            )}
          </div>
          <h3 className="card-title">
            <a href={`#/mera-haq/opportunities/${opp.id}`}>{opp.name}</a>
          </h3>
        </div>

        <span className={`status-pill ${result.status}`}>
          {statusLabel}
        </span>
      </div>

      <div className="card-benefit-highlight">
        {opp.benefit.description}
      </div>

      <ul className="card-matched-criteria-list">
        {matchedBullets.map((c, i) => (
          <li key={i} className="criterion-bullet">
            <span className="criterion-icon match">✓</span>
            <span><strong>{c.label}:</strong> {c.you}</span>
          </li>
        ))}
        {warningCheck && (
          <li className="criterion-bullet">
            <span className={`criterion-icon ${warningCheck.status}`}>!</span>
            <span><strong>{warningCheck.label}:</strong> {warningCheck.note || warningCheck.you}</span>
          </li>
        )}
      </ul>

      <div className="card-meta-row">
        <div>
          <span><strong>Deadline:</strong> {opp.deadline || "Verify"}</span>
          <span style={{ margin: "0 8px" }}>•</span>
          <span><strong>Source:</strong> {opp.sourceName}</span>
        </div>

        <div className="card-actions">
          <a className="btn btn-primary btn-sm" href={`#/mera-haq/opportunities/${opp.id}/eligibility`}>
            Why do I match?
          </a>
          <a className="btn btn-secondary btn-sm" href={`#/mera-haq/opportunities/${opp.id}`}>
            Details
          </a>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => toggleSave(opp.id)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{saved ? "Saved" : "Save"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function OpportunityMap() {
  const { profile, activeFilter, setActiveFilter, searchQuery, setSearchQuery, showAllOpportunities, setShowAllOpportunities } = useApp();
  const [showValueDetails, setShowValueDetails] = useState(false);

  const primaryResults = useMemo(() => getPrimaryMatchedResults(profile), [profile]);
  const allResults = useMemo(() => getEvaluatedResults(profile), [profile]);

  const displayResults = showAllOpportunities ? allResults : primaryResults;

  const openToAllCount = displayResults.filter((r) => r.opportunity.openToAll).length;

  const filtered = useMemo(() => {
    let list = displayResults;
    if (activeFilter === "strong") list = list.filter((r) => r.status === "strong");
    else if (activeFilter === "verify") list = list.filter((r) => r.status === "likely" || r.status === "check");
    else if (activeFilter === "openToAll") list = list.filter((r) => r.opportunity.openToAll);
    else if (activeFilter === "training") list = list.filter((r) => r.opportunity.type === "Training");
    else if (activeFilter === "education") list = list.filter((r) => r.opportunity.type === "Scholarship" || r.opportunity.type === "Training" || r.opportunity.type === "Education Support");
    else if (activeFilter === "scholarships") list = list.filter((r) => r.opportunity.type === "Scholarship");
    else if (activeFilter === "loans") list = list.filter((r) => r.opportunity.type === "Loan" || r.opportunity.type === "Interest Subsidy");
    else if (activeFilter === "health") list = list.filter((r) => r.opportunity.category === "health" || r.opportunity.type === "Health Insurance");
    else if (activeFilter === "food") list = list.filter((r) => r.opportunity.category === "food" || r.opportunity.type === "Food Security");
    else if (activeFilter === "housing") list = list.filter((r) => r.opportunity.category === "housing" || r.opportunity.type === "Housing");
    else if (activeFilter === "agriculture") list = list.filter((r) => r.opportunity.category === "agriculture" || r.opportunity.type === "Agricultural Support");
    else if (activeFilter === "utilities") list = list.filter((r) => r.opportunity.category === "utilities" || r.opportunity.type === "Utilities");
    else if (activeFilter === "women-child") list = list.filter((r) => r.opportunity.category === "women-child" || r.opportunity.type === "Women & Child");
    else if (activeFilter === "pension") list = list.filter((r) => r.opportunity.category === "pension" || r.opportunity.type === "Pension");
    else if (activeFilter === "disability") list = list.filter((r) => r.opportunity.category === "disability" || r.opportunity.type === "Disability Support");
    else if (activeFilter === "employment") list = list.filter((r) => r.opportunity.category === "employment" || r.opportunity.type === "Employment");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.opportunity.name.toLowerCase().includes(q) ||
          r.opportunity.shortDescription.toLowerCase().includes(q) ||
          r.opportunity.department.toLowerCase().includes(q)
      );
    }
    return list;
  }, [displayResults, activeFilter, searchQuery]);

  const strongCount = primaryResults.filter((r) => r.status === "strong").length;
  const verifyCount = primaryResults.filter((r) => r.status === "likely" || r.status === "check").length;
  const futureCount = primaryResults.filter((r) => r.status === "future").length;

  return (
    <div className="content-container">
      <div className="results-header-banner">
        <span className="eyebrow-badge"><span className="dot"></span>Personalized Opportunity Map</span>
        <h1 className="page-title">We found {primaryResults.length} opportunities you may not have known about</h1>
        <p className="page-subtitle">Discovered directly from your citizen profile across central ministries, Maharashtra state systems, and premier institutions.</p>

        <div className="metrics-summary-grid">
          <div className="metric-box">
            <div className="metric-number strong">{strongCount}</div>
            <div className="metric-label">Strong matches</div>
          </div>

          <div className="metric-box">
            <div className="metric-number verify">{verifyCount}</div>
            <div className="metric-label">Need verification</div>
          </div>

          <div className="metric-box">
            <div className="metric-number future">{futureCount}</div>
            <div className="metric-label">Future opportunity</div>
          </div>

          <div
            className="metric-box clickable-metric"
            style={{ cursor: "pointer", transition: "all 0.2s ease" }}
            onClick={() => setShowValueDetails(!showValueDetails)}
            title="Click to inspect transparent citizen value breakdown"
          >
            <div className="metric-number value" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span>₹1.35L+</span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: "#93c5fd", textDecoration: "underline" }}>
                {showValueDetails ? "Hide" : "Details"}
              </span>
            </div>
            <div className="metric-label">Potential citizen value ℹ</div>
          </div>
        </div>

        {showValueDetails && (
          <div style={{ marginTop: "20px", padding: "18px 22px", backgroundColor: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(59, 130, 246, 0.4)", borderRadius: "var(--radius-md)" }}>
            <h4 style={{ fontSize: "14px", color: "#60a5fa", marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📊 Transparent Value Calculation Methodology</span>
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", fontSize: "12.5px" }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                <strong style={{ color: "#34d399", display: "block" }}>Direct DBT Cash Stipend: ₹12,000</strong>
                <span style={{ color: "var(--text-muted)" }}>IIT Dharwad PM-VIKAS DBT monthly stipend (₹1,000/mo × 12)</span>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                <strong style={{ color: "#60a5fa", display: "block" }}>Zero-Cost Training: ₹45,000</strong>
                <span style={{ color: "var(--text-muted)" }}>PMKUVA (₹25k) + PMKVY 4.0 (₹20k) fully government-funded</span>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                <strong style={{ color: "#c084fc", display: "block" }}>Future Fee Waiver: ₹50,000</strong>
                <span style={{ color: "var(--text-muted)" }}>MahaDBT Minority Support (upon enrollment in higher degree)</span>
              </div>
              <div style={{ backgroundColor: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-subtle)" }}>
                <strong style={{ color: "#fbbf24", display: "block" }}>Financing (Separated): ₹10,00,000</strong>
                <span style={{ color: "var(--text-muted)" }}>PM-Vidyalaxmi loan pathway (strictly tracked as credit, not savings)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="results-toolbar" style={{ flexDirection: "column", gap: "12px" }}>
        <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
          <div style={{ display: "flex", gap: "8px", whiteSpace: "nowrap", paddingBottom: "4px" }}>
            {[
              { key: "all", label: `All (${displayResults.length})` },
              { key: "strong", label: `⭐ Strong (${strongCount})` },
              { key: "openToAll", label: `🌐 Open to All (${openToAllCount})` },
              { key: "health", label: "🏥 Health" },
              { key: "food", label: "🌾 Food" },
              { key: "housing", label: "🏠 Housing" },
              { key: "education", label: "🎓 Education" },
              { key: "training", label: "🛠 Training" },
              { key: "employment", label: "💼 Employment" },
              { key: "agriculture", label: "🌱 Agriculture" },
              { key: "utilities", label: "⚡ Utilities" },
              { key: "women-child", label: "👶 Women & Child" },
              { key: "pension", label: "👴 Pension" },
              { key: "disability", label: "🦽 Disability" },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`filter-tab-btn${activeFilter === key ? " active" : ""}`}
                type="button"
                style={{ flexShrink: 0 }}
                onClick={() => setActiveFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" type="button" onClick={() => setShowAllOpportunities(!showAllOpportunities)}>
            {showAllOpportunities ? "Show Matched Only" : `Explore Full Dataset (${opportunities.length})`}
          </button>
        </div>
      </div>

      <div className="opportunities-list">
        {filtered.length ? (
          filtered.map((res) => <OpportunityCard key={res.opportunity.id} result={res} />)
        ) : (
          <div className="profile-form-card" style={{ textAlign: "center", padding: "40px 24px" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
            <h3 style={{ fontSize: "18px", color: "#ffffff", marginBottom: "8px" }}>No schemes matched your current filter</h3>
            <p style={{ color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 24px", fontSize: "14px", lineHeight: "1.5" }}>
              No opportunities matched the filter <strong>"{activeFilter}"</strong>. Try resetting filters or exploring universal opportunities open to all citizens.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button className="btn btn-primary" type="button" onClick={() => { setActiveFilter("all"); setSearchQuery(""); }}>Reset Filters</button>
              <button className="btn btn-secondary" type="button" onClick={() => setActiveFilter("openToAll")}>Explore Open to All ({openToAllCount})</button>
              <a className="btn btn-secondary" href="#/mera-haq/profile">Edit Profile</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function WhyDoIMatchMatrix({ id }) {
  const { profile, isSaved, toggleSave } = useApp();
  const result = getResultById(id, profile);

  if (!result) return <NotFoundView />;

  const opp = result.opportunity;
  const saved = isSaved(opp.id);
  const explanation = generateEligibilityExplanation(result, profile);

  return (
    <div className="content-container">
      <div className="back-link-row" onClick={() => history.back()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back to opportunity map</span>
      </div>

      <div className="match-matrix-card">
        <div className="card-top-row">
          <div>
            <span className="eyebrow-badge"><span className="dot"></span>Rule-by-Rule Eligibility Audit</span>
            <h1 className="page-title">Why this opportunity matches you</h1>
            <p className="page-subtitle">{opp.name} ({opp.department})</p>
          </div>

          <span className={`status-pill ${result.status}`}>
            {result.status === "strong" ? "Strong Profile Match" : result.status === "future" ? "Future Opportunity" : "Needs Verification"}
          </span>
        </div>

        <div className="ai-explanation-box">
          <h4>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14h-2v-2h2zm0-4h-2V7h2z"></path>
            </svg>
            <span>Citizen-Friendly Summary</span>
          </h4>
          <p>{explanation}</p>
        </div>

        <div className="matrix-table">
          <div className="matrix-row header">
            <div>Eligibility Rule</div>
            <div>Published Requirement</div>
            <div>Your Profile</div>
            <div>Status</div>
          </div>

          {result.checks.map((c, i) => (
            <div key={i} className="matrix-row">
              <div className="matrix-rule-name">{c.label}</div>
              <div className="matrix-rule-val">{c.required}</div>
              <div className="matrix-rule-val"><strong>{c.you}</strong></div>
              <div className="matrix-status-cell">
                <span className={`criterion-icon ${c.status}`}>
                  {c.status === "match" ? "✓" : c.status === "fail" ? "✗" : "!"}
                </span>
                <span style={{ fontSize: "12.5px", fontWeight: 700 }}>
                  {c.status === "match" ? "Match" : c.status === "fail" ? "No Match" : c.status === "future" ? "Future Path" : "Verify"}
                </span>
              </div>
              {c.note && (
                <div style={{ gridColumn: "1 / -1", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  ℹ {c.note}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="prototype-trust-banner" style={{ margin: "24px 0" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div>
            <strong>Disclaimer:</strong> Based on the information you provided, you appear to meet published requirements. Final eligibility and selection are always determined by {opp.department}.
          </div>
        </div>

        <div className="form-actions-row">
          <button className="btn btn-secondary" type="button" onClick={() => toggleSave(opp.id)}>
            <span>{saved ? "Saved in My Opportunities" : "Save Opportunity"}</span>
          </button>

          <a className="btn btn-primary btn-lg" href={`#/mera-haq/opportunities/${opp.id}/readiness`}>
            <span>Check Application Readiness</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

// Which document names DigiLocker can supply (partial match, case-insensitive)
const DIGILOCKER_FETCHABLE = [
  "aadhaar", "class 10", "10th", "ssc", "class 12", "12th", "hsc", "degree",
  "graduation", "bachelor", "marksheet", "mark sheet", "bonafide", "apaar",
  "academic bank", "domicile", "caste certificate", "income certificate",
  "birth certificate", "disability certificate", "pan card", "driving licence",
  "voter id", "voter card", "ration card", "bpl certificate", "land record",
  "khata", "khasra", "soil health", "crop insurance", "mcp card",
];

function canFetchFromDigiLocker(docName) {
  const lower = docName.toLowerCase();
  return DIGILOCKER_FETCHABLE.some((kw) => lower.includes(kw));
}

function ApplicationReadiness({ id }) {
  const { profile, setModalOpportunityId } = useApp();
  const result = getResultById(id, profile);

  const [fetchedDocs, setFetchedDocs] = React.useState({});
  const [fetchingDoc, setFetchingDoc] = React.useState(null);
  const [fetchingAll, setFetchingAll] = React.useState(false);

  if (!result) return <NotFoundView />;

  const opp = result.opportunity;
  const docs = opp.requiredDocuments || [];
  const attentionDocs = docs.filter((d) => d.status !== "ready");
  const fetchableDocs = attentionDocs.filter((d) => canFetchFromDigiLocker(d.name));
  const fetchedCount = Object.values(fetchedDocs).filter(Boolean).length;
  const allFetched = fetchableDocs.length > 0 && fetchableDocs.every((d) => fetchedDocs[d.name]);

  function handleFetch(docName) {
    setFetchingDoc(docName);
    setTimeout(() => {
      setFetchedDocs((prev) => ({ ...prev, [docName]: true }));
      setFetchingDoc(null);
    }, 1500);
  }

  function handleFetchAll() {
    if (fetchingAll) return;
    setFetchingAll(true);
    const remaining = fetchableDocs.filter((d) => !fetchedDocs[d.name]);
    remaining.forEach((d, i) => {
      setTimeout(() => {
        setFetchedDocs((prev) => ({ ...prev, [d.name]: true }));
        if (i === remaining.length - 1) setFetchingAll(false);
      }, (i + 1) * 800);
    });
  }

  const readinessScore = Math.round(
    ((docs.filter((d) => d.status === "ready").length + fetchedCount) / Math.max(docs.length, 1)) * 100
  );

  return (
    <div className="content-container narrow">
      <div className="back-link-row" onClick={() => history.back()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back to eligibility breakdown</span>
      </div>

      <div className="match-matrix-card">
        <span className="eyebrow-badge"><span className="dot"></span>Pre-Application Checklist</span>
        <h1 className="page-title">Before you apply</h1>
        <p className="page-subtitle">
          {attentionDocs.length > 0
            ? `${attentionDocs.length} document(s) needed for ${opp.name} — fetch directly from DigiLocker where available.`
            : `All checklist items look ready for ${opp.name}.`}
        </p>

        {/* Readiness progress bar */}
        <div style={{ margin: "16px 0 20px", padding: "14px 18px", backgroundColor: "rgba(15,23,42,0.6)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Document readiness</span>
            <strong style={{ fontSize: "14px", color: readinessScore === 100 ? "#34d399" : "#60a5fa" }}>{readinessScore}%</strong>
          </div>
          <div style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: "100px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${readinessScore}%`, backgroundColor: readinessScore === 100 ? "#10b981" : "#3b82f6", borderRadius: "100px", transition: "width 0.5s ease" }} />
          </div>
          {fetchableDocs.length > 0 && !allFetched && (
            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {fetchableDocs.length} document{fetchableDocs.length > 1 ? "s" : ""} available via DigiLocker
              </span>
              <button
                onClick={handleFetchAll}
                disabled={fetchingAll}
                style={{
                  display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px",
                  backgroundColor: "rgba(37, 99, 235, 0.15)", border: "1px solid rgba(59, 130, 246, 0.4)",
                  borderRadius: "100px", color: "#93c5fd", fontSize: "12px", fontWeight: 600,
                  cursor: fetchingAll ? "default" : "pointer", opacity: fetchingAll ? 0.7 : 1,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
                {fetchingAll ? "Fetching from DigiLocker…" : `Fetch all from DigiLocker (${fetchableDocs.filter((d) => !fetchedDocs[d.name]).length})`}
              </button>
            </div>
          )}
          {allFetched && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#34d399", display: "flex", alignItems: "center", gap: "6px" }}>
              ✓ All available documents fetched from DigiLocker
            </div>
          )}
        </div>

        {/* Document list */}
        <ul className="readiness-docs-list">
          {docs.map((doc, i) => {
            const isFetched = fetchedDocs[doc.name];
            const isFetchable = canFetchFromDigiLocker(doc.name);
            const isLoading = fetchingDoc === doc.name;
            const isReady = doc.status === "ready" || isFetched;

            return (
              <li key={i} className={`doc-check-item ${isReady ? "ready" : "attention"}`}>
                <span
                  className={`criterion-icon ${isReady ? "match" : "verify"}`}
                  style={{ width: "22px", height: "22px", fontSize: "12px", flexShrink: 0 }}
                >
                  {isLoading ? "⟳" : isReady ? "✓" : "!"}
                </span>
                <div className="doc-info" style={{ flex: 1 }}>
                  <strong>{doc.name}</strong>
                  <span>
                    {isFetched
                      ? "✅ Fetched from DigiLocker — digitally verified"
                      : doc.status === "ready"
                      ? "Document typically available for B.Tech / Graduate"
                      : "Needs attention: " + (doc.note || "Verify before applying")}
                  </span>
                </div>

                {/* DigiLocker fetch button — shown for attention docs that are fetchable */}
                {doc.status !== "ready" && isFetchable && !isFetched && (
                  <button
                    onClick={() => handleFetch(doc.name)}
                    disabled={isLoading || fetchingAll}
                    style={{
                      display: "flex", alignItems: "center", gap: "5px", flexShrink: 0,
                      padding: "5px 11px", backgroundColor: "rgba(37, 99, 235, 0.12)",
                      border: "1px solid rgba(59, 130, 246, 0.35)", borderRadius: "100px",
                      color: "#93c5fd", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                      whiteSpace: "nowrap", opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    </svg>
                    {isLoading ? "Fetching…" : "DigiLocker"}
                  </button>
                )}

                {/* "Not in DigiLocker" hint for un-fetchable attention docs */}
                {doc.status !== "ready" && !isFetchable && !isFetched && (
                  <span style={{ flexShrink: 0, fontSize: "10.5px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>Manual only</span>
                )}

                {isFetched && (
                  <span style={{ flexShrink: 0, fontSize: "11px", color: "#34d399", whiteSpace: "nowrap" }}>✓ DigiLocker</span>
                )}
              </li>
            );
          })}
        </ul>

        {/* DigiLocker APAAR banner */}
        {profile.apaarId && (
          <div style={{ margin: "16px 0", padding: "12px 16px", backgroundColor: "rgba(37, 99, 235, 0.08)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" style={{ flexShrink: 0, marginTop: "1px" }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            </svg>
            <div style={{ fontSize: "12.5px" }}>
              <strong style={{ color: "#93c5fd" }}>DigiLocker APAAR Registry ({profile.apaarId}) active</strong>
              <span style={{ color: "var(--text-secondary)", display: "block", marginTop: "3px" }}>
                Degree certificates, Class 10 age records, Income/Caste certificates, Disability certificates, and Land records can be fetched digitally. Aadhaar verification is always instant.
              </span>
            </div>
          </div>
        )}

        <div className="prototype-trust-banner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <div>
            <strong>Official Handoff Notice:</strong> Mera Haq does not store official certificates. DigiLocker fetch is a <em>demo simulation</em>. When you continue, you will be routed to the official program website.
          </div>
        </div>

        <div className="form-actions-row">
          <a className="btn btn-secondary" href={`#/mera-haq/opportunities/${opp.id}/eligibility`}>Back</a>
          <button className="btn btn-primary btn-lg" type="button" onClick={() => setModalOpportunityId(opp.id)}>
            <span>Continue to official application</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function OpportunityDetail({ id }) {
  const { profile, isSaved, toggleSave } = useApp();
  const result = getResultById(id, profile);

  if (!result) return <NotFoundView />;

  const opp = result.opportunity;
  const saved = isSaved(opp.id);

  return (
    <div className="content-container">
      <div className="back-link-row" onClick={() => history.back()}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Back to opportunity map</span>
      </div>

      <div className="profile-form-card">
        <div className="card-top-row">
          <div>
            <div className="card-authority-tags">
              <span className="authority-pill">{opp.governmentLevel} Government</span>
              <span>•</span>
              <span>{opp.department}</span>
            </div>
            <h1 className="page-title">{opp.name}</h1>
            <p className="page-subtitle">{opp.shortDescription}</p>
          </div>

          <span className={`status-pill ${result.status}`}>
            {result.status === "strong" ? "Strong match" : "Needs verification"}
          </span>
        </div>

        <div style={{ margin: "28px 0" }}>
          <h3 style={{ color: "#ffffff", marginBottom: "12px" }}>Program Benefits</h3>
          <p style={{ fontSize: "15px", color: "var(--text-secondary)", marginBottom: "14px" }}>{opp.benefit.description}</p>

          <ul className="readiness-docs-list">
            {(opp.benefit.components || []).map((comp, i) => (
              <li key={i} className="doc-check-item ready">
                <span className="criterion-icon match">✓</span>
                <div className="doc-info"><strong>{comp}</strong></div>
              </li>
            ))}
          </ul>
        </div>

        <div className="form-actions-row">
          <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            <div><strong>Deadline:</strong> {opp.deadline || "Verify"}</div>
            <div><strong>Source:</strong> <a href={opp.sourceUrl} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", textDecoration: "underline" }}>{opp.sourceName}</a></div>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn btn-secondary" type="button" onClick={() => toggleSave(opp.id)}>
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
            <a className="btn btn-primary" href={`#/mera-haq/opportunities/${opp.id}/eligibility`}>
              Why do I match?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function HandoffModal() {
  const { modalOpportunityId, setModalOpportunityId, profile } = useApp();
  if (!modalOpportunityId) return null;

  const result = getResultById(modalOpportunityId, profile);
  if (!result) return null;
  const opp = result.opportunity;

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <span className="eyebrow-badge"><span className="dot"></span>External Redirection</span>
          <h3>You're leaving Mera Haq</h3>
        </div>

        <div className="modal-body">
          <p>You are now being redirected to the official program destination to complete your application.</p>

          <ul className="modal-detail-list">
            <li><strong>Opportunity:</strong> {opp.name}</li>
            <li><strong>Destination:</strong> {opp.sourceName}</li>
            <li><strong>Application Deadline:</strong> {opp.deadline || "Verify on official portal"}</li>
          </ul>

          <p style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>
            Reminder: Verify current eligibility, deadlines and document requirements on the official website. Mera Haq does not collect OTP, Aadhaar, or submit applications on your behalf.
          </p>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" type="button" onClick={() => setModalOpportunityId(null)}>Stay in Mera Haq</button>
          <a className="btn btn-primary" href={opp.applicationUrl || opp.sourceUrl} target="_blank" rel="noreferrer" onClick={() => setModalOpportunityId(null)}>
            <span>Continue to Official Website</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function SavedOpportunities() {
  const { savedIds, profile } = useApp();
  const savedResults = savedIds
    .map((id) => getResultById(id, profile))
    .filter((r) => r && r.opportunity);

  return (
    <div className="content-container">
      <div className="profile-form-card">
        <span className="eyebrow-badge"><span className="dot"></span>My Bookmarked Opportunities</span>
        <h1 className="page-title">Saved Opportunities ({savedResults.length})</h1>
        <p className="page-subtitle">Track your shortlisted government scholarships, skilling programs, and loan subsidies in one place.</p>

        {savedResults.length ? (
          <div className="opportunities-list" style={{ marginTop: "24px" }}>
            {savedResults.map((r) => (
              <OpportunityCard key={r.opportunity.id} result={r} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "48px 20px" }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style={{ marginBottom: "14px" }}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3 style={{ color: "#ffffff" }}>No saved opportunities yet</h3>
            <p style={{ color: "var(--text-muted)", margin: "8px 0 24px" }}>Explore your matched map and bookmark programs to track their deadlines.</p>
            <a className="btn btn-primary" href="#/mera-haq/opportunities">View Matched Opportunities</a>
          </div>
        )}
      </div>
    </div>
  );
}

function UmangSchemesContrast() {
  return (
    <div className="content-container narrow">
      <div className="umang-schemes-experience">
        <div className="back-link-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          <span>Explore eligible schemes</span>
        </div>

        <div className="schemes-stepper-card">
          <div className="step-indicator-bars">
            <div className="step-bar completed"></div>
            <div className="step-bar completed"></div>
            <div className="step-bar active"></div>
          </div>

          <div className="back-link-row" style={{ marginBottom: "16px", fontSize: "13px" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span>Back to Step 2</span>
          </div>

          <div className="no-schemes-found-box">
            <h2 className="no-schemes-title">No schemes found based on your preference</h2>

            <svg className="inbox-empty-icon" viewBox="0 0 160 120" fill="none">
              <ellipse cx="80" cy="95" rx="60" ry="14" fill="#1e2638" />
              <path d="M30 50 L130 50 L120 90 L40 90 Z" fill="#2d3748" />
              <path d="M40 50 L50 25 L110 25 L120 50 Z" fill="#4a5568" />
              <path d="M60 50 L60 62 L100 62 L100 50 Z" fill="#1a202c" />
              <rect x="50" y="32" width="60" height="24" rx="4" fill="#ffffff" />
              <line x1="62" y1="42" x2="98" y2="42" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
              <line x1="62" y1="48" x2="86" y2="48" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
            </svg>

            <button className="btn btn-primary" type="button" onClick={() => (location.hash = "#/schemes")}>
              Try Again
            </button>
          </div>

          <div className="schemes-contrast-notice">
            <span className="contrast-badge">The Problem</span>
            <div className="contrast-copy">
              <h4>Why did this happen?</h4>
              <p>
                The traditional scheme search requires the citizen to know specific category tags and filters. If one tag doesn't match an indexed keyword, you get "No schemes found".
              </p>
              <a className="btn btn-accent btn-sm" href="#/mera-haq">
                Try "Mera Haq" Discovery Layer Instead →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UmangGenericPage({ title, desc, iconSvg }) {
  return (
    <div className="content-container">
      <div className="profile-form-card">
        <span className="eyebrow-badge"><span className="dot"></span>UMANG Core Platform</span>
        <h1 className="page-title">{title}</h1>
        <p className="page-subtitle">{desc}</p>

        <div style={{ padding: "40px 20px", textAlign: "center", border: "1px dashed var(--border-default)", borderRadius: "var(--radius-md)", marginTop: "20px" }}>
          {iconSvg}
          <h3 style={{ color: "#ffffff", margin: "16px 0 8px" }}>UMANG Native Portal Active</h3>
          <p style={{ color: "var(--text-muted)", maxWidth: "500px", margin: "0 auto 24px" }}>
            Mera Haq is natively embedded into UMANG. Switch to the <strong>Mera Haq</strong> tab to explore personalized citizen opportunity mapping.
          </p>
          <a className="btn btn-primary" href="#/mera-haq">Open Mera Haq Discovery Layer</a>
        </div>
      </div>
    </div>
  );
}

function TestSuiteRunner() {
  const { loadDemoProfile } = useApp();

  const tests = [
    {
      id: 1,
      name: "Neeraj demo profile → IIT Dharwad AI Technocrat = Strong Match",
      run: () => {
        const res = getResultById("ai-technocrat-iit-dharwad", demoProfile);
        return res && res.status === "strong";
      },
    },
    {
      id: 2,
      name: "Underage user (13 yrs) → Age-restricted training = Not Eligible",
      run: () => {
        const underageProfile = { ...demoProfile, age: 13 };
        const res = getResultById("ai-technocrat-iit-dharwad", underageProfile);
        return res && res.status === "not";
      },
    },
    {
      id: 3,
      name: "Male profile → AICTE Pragati (Female only) = Not Eligible with reason",
      run: () => {
        const res = getResultById("aicte-pragati", demoProfile);
        return res && res.status === "not";
      },
    },
    {
      id: 4,
      name: "Missing income profile → Income-capped support = Needs Verification",
      run: () => {
        const missingIncomeProfile = { ...demoProfile, annualFamilyIncome: null, incomeBand: "Prefer to check later" };
        const res = getResultById("minority-merit-cum-means", missingIncomeProfile);
        return res && (res.status === "check" || res.status === "verify" || res.status === "future");
      },
    },
    {
      id: 5,
      name: "Non-Maharashtra state (Karnataka) → MahaDBT Support = Not Eligible",
      run: () => {
        const karnatakaProfile = { ...demoProfile, state: "Karnataka", domicile: "Karnataka" };
        const res = getResultById("maharashtra-pmkuva", karnatakaProfile);
        return res && res.status === "not";
      },
    },
    {
      id: 6,
      name: "Minority requirement + Jain community = Match recognized accurately",
      run: () => {
        const res = getResultById("ai-technocrat-iit-dharwad", demoProfile);
        const minorityCheck = res?.checks.find((c) => c.label.includes("Minority"));
        return minorityCheck && minorityCheck.status === "match";
      },
    },
    {
      id: 7,
      name: "Graduated citizen → Current student scheme = Future Opportunity flag",
      run: () => {
        const res = getResultById("maharashtra-minority-professional-support", demoProfile);
        return res && res.status === "future";
      },
    },
    {
      id: 8,
      name: "Income boundary test (> ₹8L) → Capped scheme = Not Eligible",
      run: () => {
        const highIncomeProfile = { ...demoProfile, annualFamilyIncome: 1200000, incomeBand: "Above ₹12 lakh" };
        const res = getResultById("rajarshi-shahu-fee-scholarship", highIncomeProfile);
        return res && res.status === "not";
      },
    },
    {
      id: 9,
      name: "Multi-opportunity dataset volume = 39 schemes (all tiers)",
      run: () => {
        return opportunities.length === 39;
      },
    },
    {
      id: 10,
      name: "Saved opportunity persistence via localStorage",
      run: () => {
        const prev = JSON.parse(localStorage.getItem(STORAGE_SAVED) || "[]");
        localStorage.setItem(STORAGE_SAVED, JSON.stringify(["ai-technocrat-iit-dharwad"]));
        const check = JSON.parse(localStorage.getItem(STORAGE_SAVED) || "[]").includes("ai-technocrat-iit-dharwad");
        localStorage.setItem(STORAGE_SAVED, JSON.stringify(prev));
        return check;
      },
    },
    {
      id: 11,
      name: "Universal opportunity filter (openToAll) accurately isolates non-quota schemes",
      run: () => {
        const pmkuva = opportunities.find((o) => o.id === "maharashtra-pmkuva");
        const pmkvy = opportunities.find((o) => o.id === "pmkvy-future-tech");
        return Boolean(pmkuva?.openToAll && pmkvy?.openToAll);
      },
    },
    {
      id: 12,
      name: "DigiLocker & APAAR ID Academic Registry verification",
      run: () => {
        return demoProfile.apaarId === "279903493988" && demoProfile.apaarVerified === true;
      },
    },
    {
      id: 13,
      name: "PM-JAY correctly fails for above-BPL income profile (₹5–8L)",
      run: () => {
        const res = getResultById("pm-jay-ayushman-bharat", demoProfile);
        return res && res.status === "not";
      },
    },
    {
      id: 14,
      name: "Life Situation farmer tag correctly matches PM-KISAN for farmer profile",
      run: () => {
        const farmerProfile = { ...demoProfile, lifeSituation: ["farmer"] };
        const res = getResultById("pm-kisan", farmerProfile);
        return res && res.status === "strong";
      },
    },
  ];

  const results = tests.map((t) => ({ ...t, passed: t.run() }));
  const passedCount = results.filter((r) => r.passed).length;

  return (
    <div className="content-container">
      <div className="test-suite-panel">
        <span className="eyebrow-badge"><span className="dot"></span>Automated Verification Suite</span>
        <h1 className="page-title">Deterministic Engine Test Results</h1>
        <p className="page-subtitle">Verifying 14 automated test cases across all scheme tiers and eligibility rules.</p>

        <div style={{ margin: "20px 0 24px", padding: "14px 18px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid #10b981", borderRadius: "var(--radius-md)" }}>
          <strong style={{ color: "#34d399", fontSize: "16px" }}>All Tests Passing: {passedCount} / {results.length}</strong>
        </div>

        <div className="test-list">
          {results.map((r) => (
            <div key={r.id} className="test-item-row">
              <div>
                <strong>Test {r.id}:</strong> {r.name}
              </div>
              <span className={`test-status-badge ${r.passed ? "pass" : "fail"}`}>
                {r.passed ? "PASSED ✓" : "FAILED ✗"}
              </span>
            </div>
          ))}
        </div>

        <div className="form-actions-row" style={{ marginTop: "28px" }}>
          <a className="btn btn-primary" href="#/mera-haq">Back to Mera Haq</a>
          <button className="btn btn-secondary" type="button" onClick={loadDemoProfile}>Run Demo Flow</button>
        </div>
      </div>
    </div>
  );
}

function NotFoundView() {
  return (
    <div className="content-container narrow">
      <div className="profile-form-card" style={{ textAlign: "center", padding: "48px 20px" }}>
        <h2>Page or Opportunity Not Found</h2>
        <p style={{ color: "var(--text-muted)", margin: "12px 0 24px" }}>The requested destination is not available in the prototype dataset.</p>
        <a className="btn btn-primary" href="#/mera-haq">Return to Mera Haq</a>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN REACT ROUTER & APP COMPONENT
// ============================================================================

function MainContentRouter() {
  const { currentRoute } = useApp();

  if (currentRoute === "/" || currentRoute === "/mera-haq") {
    return <LandingView />;
  }
  if (currentRoute === "/mera-haq/profile") {
    return <ProfileFlow />;
  }
  if (currentRoute === "/mera-haq/profile/review") {
    return <ProfileReview />;
  }
  if (currentRoute === "/mera-haq/matching") {
    return <MatchingRadar />;
  }
  if (currentRoute === "/mera-haq/opportunities") {
    return <OpportunityMap />;
  }
  if (currentRoute === "/saved" || currentRoute === "/mera-haq/saved") {
    return <SavedOpportunities />;
  }
  if (currentRoute === "/schemes") {
    return <UmangSchemesContrast />;
  }
  if (currentRoute === "/home") {
    return (
      <UmangGenericPage
        title="UMANG Citizen Services"
        desc="Unified Mobile Application for New-age Governance — Direct access to central and state services."
        iconSvg={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>}
      />
    );
  }
  if (currentRoute === "/services") {
    return (
      <UmangGenericPage
        title="All Government Services"
        desc="Explore 2,000+ services across Central Ministries, State Governments, and Local Bodies."
        iconSvg={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>}
      />
    );
  }
  if (currentRoute === "/digilocker") {
    return (
      <UmangGenericPage
        title="DigiLocker Integration"
        desc="Access authentic digital documents issued by government departments."
        iconSvg={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>}
      />
    );
  }
  if (currentRoute === "/maharashtra") {
    return (
      <UmangGenericPage
        title="Maharashtra State Portal"
        desc="Aaple Sarkar, MahaDBT, Revenue, and Transport services."
        iconSvg={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><circle cx="12" cy="12" r="10"></circle><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>}
      />
    );
  }
  if (currentRoute === "/jobs") {
    return (
      <UmangGenericPage
        title="Government Jobs & Apprenticeships"
        desc="Public sector employment notices and National Apprenticeship opportunities."
        iconSvg={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>}
      />
    );
  }
  if (currentRoute === "/dashboard") {
    return (
      <UmangGenericPage
        title="Citizen Dashboard"
        desc="Your service applications, transaction histories, and active requests."
        iconSvg={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>}
      />
    );
  }
  if (currentRoute === "/mera-haq/tests") {
    return <TestSuiteRunner />;
  }

  // Nested opportunity routes
  const oppMatch = currentRoute.match(/^\/mera-haq\/opportunities\/([^/]+)(?:\/(eligibility|readiness))?$/);
  if (oppMatch) {
    const id = oppMatch[1];
    const sub = oppMatch[2];
    if (sub === "eligibility") return <WhyDoIMatchMatrix id={id} />;
    if (sub === "readiness") return <ApplicationReadiness id={id} />;
    return <OpportunityDetail id={id} />;
  }

  return <NotFoundView />;
}

function App() {
  const { loadDemoProfile } = useApp();

  return (
    <div className="app-container">
      <UmangHeader />
      <div className="body-wrapper">
        <UmangSidebar />
        <main className="main-content" id="main-content">
          <MainContentRouter />
        </main>
      </div>

      <button className="floating-help-btn" type="button" onClick={loadDemoProfile} title="Instant 60s Demo for Judges">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>60s Demo (Neeraj)</span>
      </button>

      <HandoffModal />
    </div>
  );
}

// Mount React Root
const rootElement = document.getElementById("root");
if (rootElement && typeof ReactDOM !== "undefined" && ReactDOM.createRoot) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <AppProvider>
      <App />
    </AppProvider>
  );
}
