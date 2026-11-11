/**
 * Mera Haq deterministic eligibility engine.
 *
 * - Rule-based only. No LLM decides eligibility.
 * - Every rule it evaluates comes from a scheme record's `criteria` array.
 *   That array was extracted from an official source, and each criterion
 *   carries an evidence quote (see scripts/pipeline/validate_schemes.py).
 * - A missing profile value is UNKNOWN, never treated as a pass.
 * - Whether the application window is open is reported separately from
 *   whether the person is eligible.
 *
 * Works in the browser (window.MeraHaqEngine) and in Node (require()).
 */
(function (root, factory) {
  const locations = typeof module === "object" && module.exports ? require("./locations.js") : root.MeraHaqLocations;
  const api = factory(locations);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MeraHaqEngine = api;
})(typeof self !== "undefined" ? self : this, function (Locations) {
  "use strict";

  // ---------------------------------------------------------------------------
  // Profile vocabulary
  // ---------------------------------------------------------------------------
  const ENUMS = Object.freeze({
    gender: ["MALE", "FEMALE", "TRANSGENDER"],
    socialCategory: ["GENERAL", "SC", "ST", "OBC", "EWS", "SEBC", "VJNT", "SBC"],
    religion: ["HINDU", "MUSLIM", "CHRISTIAN", "SIKH", "BUDDHIST", "JAIN", "PARSI", "JEWISH", "OTHER"],
    educationLevel: ["NONE", "BELOW_10", "CLASS_10", "CLASS_12", "ITI", "DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE", "DOCTORATE"],
    studentLevel: ["NOT_STUDENT", "SCHOOL", "CLASS_11_12", "ITI", "DIPLOMA", "UNDERGRADUATE", "POSTGRADUATE", "PHD"],
    employmentStatus: ["STUDENT", "EMPLOYED", "SELF_EMPLOYED", "UNEMPLOYED", "RETIRED", "HOMEMAKER"],
    occupation: ["FARMER", "STREET_VENDOR", "ARTISAN_CRAFTSPERSON", "UNORGANISED_WORKER", "SALARIED", "BUSINESS_OWNER", "OTHER"],
    residence: ["RURAL", "URBAN"],
    maritalStatus: ["UNMARRIED", "MARRIED", "WIDOWED", "DIVORCED", "SEPARATED"],
  });

  const EDUCATION_RANK = Object.freeze({ NONE: 0, BELOW_10: 1, CLASS_10: 2, CLASS_12: 3, ITI: 3, DIPLOMA: 3, UNDERGRADUATE: 4, POSTGRADUATE: 5, DOCTORATE: 6 });

  /** Metadata used to ask for missing information and explain why it is needed. */
  const FIELD_META = Object.freeze({
    age: { label: "Age", type: "integer", why: "Many schemes have minimum or maximum age limits.", sensitive: false },
    gender: { label: "Gender", type: "enum", why: "Some schemes are reserved for women or girls.", sensitive: false },
    state: { label: "State / Union Territory", type: "location", why: "State and UT schemes are only offered to residents of that State/UT.", sensitive: false },
    domicileState: { label: "State/UT of domicile", type: "location", why: "State schemes usually require a domicile certificate of that State/UT.", sensitive: false },
    annualFamilyIncome: { label: "Annual family income (₹)", type: "money", why: "Most welfare schemes have an annual family income ceiling.", sensitive: true },
    socialCategory: { label: "Social category", type: "enum", why: "Some schemes are for SC, ST, OBC, EWS or other specified categories.", sensitive: true },
    religion: { label: "Religion (optional)", type: "enum", why: "Asked only for schemes that the government has notified for minority communities.", sensitive: true },
    disability: { label: "Person with disability", type: "boolean", why: "Some schemes are for persons with benchmark disabilities.", sensitive: true },
    disabilityPercent: { label: "Disability percentage", type: "percent", why: "Disability schemes usually need a minimum certified percentage (often 40%).", sensitive: true },
    educationLevel: { label: "Highest qualification", type: "enum", why: "Some schemes need a minimum qualification.", sensitive: false },
    studentLevel: { label: "Currently studying", type: "enum", why: "Scholarships depend on the course you are studying now.", sensitive: false },
    employmentStatus: { label: "Employment status", type: "enum", why: "Some schemes are only for unemployed, self-employed or employed people.", sensitive: false },
    occupation: { label: "Occupation", type: "enum", why: "Some schemes are for farmers, street vendors, artisans or unorganised workers.", sensitive: false },
    residence: { label: "Rural or urban residence", type: "enum", why: "Some schemes apply only to rural or only to urban areas.", sensitive: false },
    maritalStatus: { label: "Marital status", type: "enum", why: "A few schemes are for widows or for unmarried girls.", sensitive: true },
    isIncomeTaxPayer: { label: "Income-tax payer", type: "boolean", why: "Some schemes exclude income-tax payers.", sensitive: false },
  });

  const PROFILE_FIELDS = Object.freeze(Object.keys(FIELD_META).concat(["displayName"]));

  // ---------------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------------
  const MAX_INCOME = 1e10; // ₹1,000 crore. Anything larger is treated as input error

  function isBlank(v) {
    return v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  }

  function toNumber(v) {
    if (typeof v === "number") return v;
    if (typeof v !== "string") return NaN;
    const s = v.trim().replace(/[,\s₹]/g, "");
    if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return Number(s);
  }

  /**
   * Validate and normalise a raw profile (form values / localStorage / URL).
   * Returns { profile, errors }. Invalid fields are dropped (set to null) and
   * reported, so bad input can never become an eligibility claim.
   */
  function validateProfile(raw) {
    const errors = {};
    const profile = {};
    const src = raw && typeof raw === "object" ? raw : {};

    for (const field of PROFILE_FIELDS) {
      const v = src[field];
      profile[field] = null;
      if (isBlank(v)) continue;
      const meta = FIELD_META[field];
      if (field === "displayName") {
        const s = String(v).replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 60);
        profile.displayName = s || null;
        continue;
      }
      switch (meta.type) {
        case "integer": {
          const n = toNumber(v);
          if (!Number.isFinite(n) || !Number.isInteger(n)) errors[field] = "Enter a whole number.";
          else if (n < 0) errors[field] = "Age cannot be negative.";
          else if (n > 120) errors[field] = "Enter an age between 0 and 120.";
          else profile[field] = n;
          break;
        }
        case "money": {
          const n = toNumber(v);
          if (!Number.isFinite(n)) errors[field] = "Enter an amount in rupees using digits only.";
          else if (n < 0) errors[field] = "Income cannot be negative.";
          else if (n > MAX_INCOME) errors[field] = "This amount looks too large. Check the number of zeros.";
          else profile[field] = Math.round(n * 100) / 100;
          break;
        }
        case "percent": {
          const n = toNumber(v);
          if (!Number.isFinite(n) || n < 0 || n > 100) errors[field] = "Enter a percentage between 0 and 100.";
          else profile[field] = n;
          break;
        }
        case "boolean": {
          if (v === true || v === "true" || v === "yes") profile[field] = true;
          else if (v === false || v === "false" || v === "no") profile[field] = false;
          else errors[field] = "Choose Yes or No.";
          break;
        }
        case "location": {
          const code = String(v).trim().toUpperCase();
          if (Locations.isValidLocationCode(code)) profile[field] = code;
          else errors[field] = "Choose a State or Union Territory from the list.";
          break;
        }
        case "enum": {
          const s = String(v).trim().toUpperCase();
          if (ENUMS[field] && ENUMS[field].includes(s)) profile[field] = s;
          else errors[field] = "Choose one of the listed options.";
          break;
        }
        default:
          errors[field] = "Unsupported field.";
      }
    }
    // Cross-field consistency
    if (profile.disability === false && profile.disabilityPercent !== null) profile.disabilityPercent = null;
    return { profile, errors };
  }

  // ---------------------------------------------------------------------------
  // Criterion evaluation
  // ---------------------------------------------------------------------------
  const PASS = "PASS", FAIL = "FAIL", UNKNOWN = "UNKNOWN", MANUAL = "MANUAL";

  function profileValue(profile, field) {
    const v = profile ? profile[field] : undefined;
    return v === undefined ? null : v;
  }

  function evaluateCriterion(c, profile) {
    if (c.op === "manual") return MANUAL;
    if (Array.isArray(c.anyOf)) {
      const results = c.anyOf.map((sub) => evaluateCriterion(sub, profile));
      if (results.includes(PASS)) return PASS;
      if (results.includes(UNKNOWN)) return UNKNOWN;
      if (results.every((r) => r === MANUAL)) return MANUAL;
      return FAIL;
    }
    const v = profileValue(profile, c.field);
    if (v === null) return UNKNOWN;
    switch (c.op) {
      case "gte": return v >= c.value ? PASS : FAIL;
      case "lte": return v <= c.value ? PASS : FAIL;
      case "gt": return v > c.value ? PASS : FAIL;
      case "lt": return v < c.value ? PASS : FAIL;
      case "eq": return v === c.value ? PASS : FAIL;
      case "in": return c.value.includes(v) ? PASS : FAIL;
      case "notIn": return c.value.includes(v) ? FAIL : PASS;
      case "isTrue": return v === true ? PASS : FAIL;
      case "isFalse": return v === false ? PASS : FAIL;
      case "eduGte": {
        const have = EDUCATION_RANK[v], need = EDUCATION_RANK[c.value];
        if (have === undefined || need === undefined) return UNKNOWN;
        return have >= need ? PASS : FAIL;
      }
      default:
        return UNKNOWN; // unsupported operator: never a pass
    }
  }

  function fieldsOf(c) {
    if (Array.isArray(c.anyOf)) return c.anyOf.flatMap(fieldsOf);
    return c.field ? [c.field] : [];
  }

  /** Detect rule sets that no profile could satisfy (e.g. age >= 30 and age <= 18). */
  function findContradictions(criteria) {
    const issues = [];
    const bounds = {};
    for (const c of criteria || []) {
      if (c.mandatory === false || !c.field) continue;
      const b = (bounds[c.field] = bounds[c.field] || { min: -Infinity, max: Infinity, in: null });
      if (c.op === "gte") b.min = Math.max(b.min, c.value);
      if (c.op === "gt") b.min = Math.max(b.min, c.value + 1e-9);
      if (c.op === "lte") b.max = Math.min(b.max, c.value);
      if (c.op === "lt") b.max = Math.min(b.max, c.value - 1e-9);
      if (c.op === "eq") { b.min = Math.max(b.min, c.value); b.max = Math.min(b.max, c.value); }
      if (c.op === "in") b.in = b.in ? b.in.filter((x) => c.value.includes(x)) : c.value.slice();
    }
    for (const [field, b] of Object.entries(bounds)) {
      if (b.min > b.max) issues.push(`Contradictory limits on ${field}: minimum ${b.min} is above maximum ${b.max}.`);
      if (b.in && b.in.length === 0) issues.push(`Contradictory allowed values for ${field}.`);
    }
    return issues;
  }

  // ---------------------------------------------------------------------------
  // Scheme-level evaluation
  // ---------------------------------------------------------------------------
  const OUTCOMES = Object.freeze({
    LIKELY_ELIGIBLE: "LIKELY_ELIGIBLE",
    POTENTIAL_MATCH: "POTENTIAL_MATCH",
    NOT_ELIGIBLE: "NOT_ELIGIBLE",
    INSUFFICIENT_INFORMATION: "INSUFFICIENT_INFORMATION",
    SCHEME_NOT_CURRENTLY_OPEN: "SCHEME_NOT_CURRENTLY_OPEN",
    NEEDS_MANUAL_VERIFICATION: "NEEDS_MANUAL_VERIFICATION",
  });
  const OUTCOME_ORDER = ["LIKELY_ELIGIBLE", "POTENTIAL_MATCH", "NEEDS_MANUAL_VERIFICATION", "INSUFFICIENT_INFORMATION", "SCHEME_NOT_CURRENTLY_OPEN", "NOT_ELIGIBLE"];
  const TRUSTED_STATUSES = ["VERIFIED", "PARTIALLY_VERIFIED"];

  function todayISO(now) {
    const d = now instanceof Date ? now : new Date();
    return d.toISOString().slice(0, 10);
  }

  /** Application availability is independent of personal eligibility. */
  function applicationAvailability(scheme, now) {
    if (scheme.status === "INACTIVE") return "INACTIVE";
    const w = scheme.applicationWindow;
    if (!w || (!w.opens && !w.closes)) return "UNKNOWN";
    const t = todayISO(now);
    if (w.opens && t < w.opens) return "NOT_YET_OPEN";
    if (w.closes && t > w.closes) return "CLOSED";
    return "OPEN";
  }

  function jurisdictionCriterion(scheme) {
    const j = scheme.jurisdictions || [];
    if (j.length === 0 || j.includes("ALL")) return null;
    const names = j.map((c) => Locations.locationName(c) || c).join(", ");
    return { id: "_jurisdiction", field: "state", op: "in", value: j, label: `Offered in ${names}`, mandatory: true, derived: true };
  }

  /**
   * Evaluate one scheme for one profile.
   * Returns a fully explainable result object.
   */
  function evaluateScheme(scheme, rawProfile, options) {
    const opts = options || {};
    const profile = opts.prevalidated ? rawProfile : validateProfile(rawProfile).profile;
    const criteria = (scheme.criteria || []).slice();
    const jc = jurisdictionCriterion(scheme);
    if (jc) criteria.unshift(jc);

    const passed = [], failed = [], unknown = [], manual = [], optional = [];
    for (const c of criteria) {
      const r = evaluateCriterion(c, profile);
      const entry = { id: c.id, label: c.label, field: c.field || null, result: r, evidence: c.evidence || null, gate: c.gate === true };
      if (c.mandatory === false) { optional.push(entry); continue; }
      if (r === PASS) passed.push(entry);
      else if (r === FAIL) failed.push(entry);
      else if (r === UNKNOWN) unknown.push(entry);
      else manual.push(entry);
    }

    const contradictions = findContradictions(criteria);
    const verification = (scheme.verification && scheme.verification.status) || "NEEDS_REVIEW";
    const machineCriteria = passed.length + failed.length + unknown.length;

    // Location matches (State/UT, domicile) and broad "gate" conditions (for example
    // "currently studying") do not count as substantive evidence of eligibility.
    const LOCATION_FIELDS = ["state", "domicileState"];
    const substantivePassed = passed.filter((p) => !p.id.startsWith("_") && !p.gate && !LOCATION_FIELDS.includes(p.field)).length;

    let eligibility;
    if (failed.length) eligibility = OUTCOMES.NOT_ELIGIBLE;
    else if (contradictions.length) eligibility = OUTCOMES.NEEDS_MANUAL_VERIFICATION;
    else if (unknown.length) eligibility = substantivePassed ? OUTCOMES.POTENTIAL_MATCH : OUTCOMES.INSUFFICIENT_INFORMATION;
    else if (!TRUSTED_STATUSES.includes(verification) || machineCriteria === 0) eligibility = OUTCOMES.NEEDS_MANUAL_VERIFICATION;
    else if (substantivePassed === 0 && manual.length > 0) eligibility = OUTCOMES.NEEDS_MANUAL_VERIFICATION;
    else eligibility = OUTCOMES.LIKELY_ELIGIBLE;

    const availability = applicationAvailability(scheme, opts.now);
    let outcome = eligibility;
    if (eligibility !== OUTCOMES.NOT_ELIGIBLE && (availability === "CLOSED" || availability === "INACTIVE")) {
      outcome = OUTCOMES.SCHEME_NOT_CURRENTLY_OPEN;
    }

    const missingFields = [...new Set(unknown.flatMap((u) => {
      const c = criteria.find((x) => x.id === u.id);
      return c ? fieldsOf(c) : [];
    }))].filter((f) => profileValue(profile, f) === null);

    return {
      schemeId: scheme.id,
      outcome,
      eligibility,
      availability,
      verificationStatus: verification,
      passed, failed, unknown, manualChecks: manual, optional,
      missingFields,
      contradictions,
      explanation: explain({ eligibility, outcome, availability, passed, failed, unknown, manual, verification, contradictions, machineCriteria, substantivePassed }),
      shortReason: shortReason({ eligibility, outcome, availability, passed, failed, manual, missingFields }),
      sources: (scheme.sources || []).map((s) => ({ title: s.title, url: s.url, publisher: s.publisher, retrievedAt: s.retrievedAt })),
    };
  }

  function listLabels(items) {
    const labels = items.map((i) => i.label);
    if (labels.length <= 1) return labels.join("");
    return labels.slice(0, -1).join("; ") + " and " + labels[labels.length - 1];
  }

  const FIELD_SHORT = Object.freeze({
    age: "age", gender: "gender", state: "State/UT", domicileState: "State/UT of domicile", annualFamilyIncome: "annual family income",
    socialCategory: "social category", religion: "religion", disability: "disability status", disabilityPercent: "disability percentage",
    educationLevel: "highest qualification", studentLevel: "current studies", employmentStatus: "employment status", occupation: "occupation",
    residence: "rural or urban residence", maritalStatus: "marital status", isIncomeTaxPayer: "income-tax status",
  });

  /** One short sentence for scheme tiles. The full explanation stays on the detail page. */
  function shortReason(r) {
    const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
    const fields = r.missingFields.map((f) => FIELD_SHORT[f] || f);
    const need = fields.length > 2 ? `${fields.slice(0, 2).join(", ")} and ${fields.length - 2} more` : fields.join(" and ");
    if (r.outcome === OUTCOMES.SCHEME_NOT_CURRENTLY_OPEN) {
      return r.availability === "INACTIVE" ? "This scheme is marked inactive." : "The published application window has closed.";
    }
    switch (r.eligibility) {
      case OUTCOMES.LIKELY_ELIGIBLE:
        return `You meet the ${plural(r.passed.length, "condition")} we can check.` + (r.manual.length ? ` ${r.manual.length} more to confirm on the official page.` : "");
      case OUTCOMES.POTENTIAL_MATCH:
        return `Fits so far. To confirm, tell us your ${need}.`;
      case OUTCOMES.INSUFFICIENT_INFORMATION:
        return `Tell us your ${need} to check this scheme.`;
      case OUTCOMES.NOT_ELIGIBLE:
        return `Not met: ${r.failed[0].label}` + (r.failed.length > 1 ? `, and ${r.failed.length - 1} more.` : ".");
      default:
        return "We can't check this one automatically. Read the conditions on the official page.";
    }
  }

  const inr = (n) => (n >= 100000 ? `₹${+(n / 100000).toFixed(2)} lakh` : `₹${Number(n).toLocaleString("en-IN")}`);
  const TITLE = (s) => s.toLowerCase().replace(/_/g, " ");

  /**
   * "Who it's for" in one line, built only from the scheme's machine-checkable
   * criteria (so it can never say more than the verified record does).
   */
  function audienceLine(scheme) {
    const parts = [];
    let ageMin = null, ageMax = null;
    for (const c of scheme.criteria || []) {
      if (c.mandatory === false || c.op === "manual") continue;
      if (Array.isArray(c.anyOf)) { parts.push(c.label); continue; }
      const v = c.value;
      switch (c.field) {
        case "age":
          if (c.op === "gte" || c.op === "gt") ageMin = c.op === "gt" ? v + 1 : v;
          if (c.op === "lte" || c.op === "lt") ageMax = c.op === "lt" ? v - 1 : v;
          break;
        case "gender": parts.push(v.includes("FEMALE") && v.length === 1 ? "women and girls" : v.map(TITLE).join(" / ")); break;
        case "socialCategory": parts.push(v.map((x) => (x === "GENERAL" ? "General/Open" : x)).join(" / ") + " category"); break;
        case "religion": parts.push("notified minority communities"); break;
        case "annualFamilyIncome":
          parts.push(c.op === "gt" || c.op === "gte" ? `family income above ${inr(v)}` : `family income ${c.op === "lt" ? "below" : "up to"} ${inr(v)}`);
          break;
        case "domicileState": parts.push(`${v.map((x) => Locations.locationName(x) || x).join(" / ")} domicile`); break;
        case "state": parts.push(`${v.map((x) => Locations.locationName(x) || x).join(" / ")} residents`); break;
        case "disability": parts.push("persons with disability"); break;
        case "disabilityPercent": parts.push(`disability ${v}% or more`); break;
        case "studentLevel": parts.push(c.op === "notIn" ? "current students" : v.map(TITLE).join(" / ")); break;
        case "occupation": case "employmentStatus": case "residence": case "maritalStatus":
          parts.push(Array.isArray(v) ? v.map(TITLE).join(" / ") : c.label);
          break;
        default: parts.push(c.label);
      }
    }
    if (ageMin !== null && ageMax !== null) parts.unshift(`age ${ageMin}–${ageMax}`);
    else if (ageMin !== null) parts.unshift(`age ${ageMin}+`);
    else if (ageMax !== null) parts.unshift(`up to age ${ageMax}`);
    const unique = [...new Set(parts)];
    return unique.length ? unique.join(" · ") : null;
  }

  function explain(r) {
    const parts = [];
    switch (r.eligibility) {
      case OUTCOMES.NOT_ELIGIBLE:
        parts.push(`Not eligible: ${listLabels(r.failed)} ${r.failed.length > 1 ? "are" : "is"} not met based on your profile.`);
        break;
      case OUTCOMES.POTENTIAL_MATCH:
        parts.push(`Potential match: you meet ${r.passed.length} of the listed conditions (${listLabels(r.passed)}).`);
        parts.push(`We cannot confirm eligibility yet because we do not know: ${listLabels(r.unknown)}.`);
        break;
      case OUTCOMES.INSUFFICIENT_INFORMATION:
        parts.push(`Not enough information: we need ${listLabels(r.unknown)} before we can check this scheme.`);
        break;
      case OUTCOMES.NEEDS_MANUAL_VERIFICATION:
        if (r.contradictions.length) parts.push("The published conditions for this scheme conflict with each other, so it needs manual checking.");
        else if (r.machineCriteria === 0) parts.push("This scheme's conditions cannot be checked automatically. Read the official source to confirm eligibility.");
        else if (r.substantivePassed === 0) parts.push(`You meet the basic conditions (${listLabels(r.passed)}), but the scheme's other conditions cannot be checked automatically.`);
        else parts.push(`Your profile meets the listed conditions, but the scheme record has verification status "${r.verification}". Confirm the details on the official source.`);
        break;
      case OUTCOMES.LIKELY_ELIGIBLE:
        parts.push(`Likely eligible: you meet all ${r.passed.length} conditions we can check (${listLabels(r.passed)}).`);
        break;
      default:
    }
    if (r.manual.length && r.eligibility !== OUTCOMES.NOT_ELIGIBLE) {
      parts.push(`You also need to confirm these conditions yourself: ${listLabels(r.manual)}.`);
    }
    if (r.outcome === OUTCOMES.SCHEME_NOT_CURRENTLY_OPEN) {
      parts.push(r.availability === "INACTIVE" ? "The scheme is marked inactive." : "The published application window has closed.");
    }
    return parts.join(" ");
  }

  /** Evaluate a whole dataset. Results are sorted by outcome, then by number of conditions met. */
  function evaluateAll(schemes, rawProfile, options) {
    const { profile } = validateProfile(rawProfile);
    const opts = Object.assign({}, options, { prevalidated: true });
    return schemes
      .map((s) => evaluateScheme(s, profile, opts))
      .sort((a, b) => OUTCOME_ORDER.indexOf(a.outcome) - OUTCOME_ORDER.indexOf(b.outcome) || b.passed.length - a.passed.length || a.schemeId.localeCompare(b.schemeId));
  }

  /** Is the scheme offered in the user's location (Central schemes everywhere)? */
  function isRelevantToLocation(scheme, stateCode) {
    const j = scheme.jurisdictions || [];
    if (j.includes("ALL")) return true;
    if (!stateCode) return false;
    return j.includes(stateCode);
  }

  /** Fields whose answers would change at least one outcome, most impactful first. */
  function suggestNextQuestions(results, limit) {
    const counts = {};
    for (const r of results) {
      if (r.eligibility === OUTCOMES.NOT_ELIGIBLE) continue;
      for (const f of r.missingFields) counts[f] = (counts[f] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit || 5)
      .map(([field, schemes]) => Object.assign({ field, schemes }, FIELD_META[field]));
  }

  // ---------------------------------------------------------------------------
  // External link safety (official application hand-off)
  // ---------------------------------------------------------------------------
  const OFFICIAL_SUFFIXES = [".gov.in", ".nic.in"];
  /** Non-.gov.in hosts operated by government bodies, each reviewed (see DATA_SOURCE_INVENTORY.md). */
  const REVIEWED_OFFICIAL_HOSTS = ["maandhan.in", "www.mudra.org.in", "mudra.org.in", "www.standupmitra.in", "www.myscheme.gov.in", "www.udyamimitra.in", "pmvidyalaxmi.co.in", "www.pmvidyalaxmi.co.in"];

  function officialUrlInfo(url) {
    if (typeof url !== "string" || url.length > 2048) return { ok: false, reason: "Missing or invalid link." };
    let u;
    try { u = new URL(url); } catch (e) { return { ok: false, reason: "Malformed link." }; }
    if (u.protocol !== "https:") return { ok: false, reason: "Only secure https links are opened." };
    if (u.username || u.password) return { ok: false, reason: "Link contains credentials." };
    const host = u.hostname.toLowerCase();
    const official = OFFICIAL_SUFFIXES.some((s) => host.endsWith(s)) || REVIEWED_OFFICIAL_HOSTS.includes(host);
    if (!official) return { ok: false, reason: `${host} is not a reviewed government domain.` };
    return { ok: true, host, href: u.href };
  }

  return Object.freeze({
    ENUMS, FIELD_META, EDUCATION_RANK, OUTCOMES, OUTCOME_ORDER,
    validateProfile, evaluateCriterion, evaluateScheme, evaluateAll,
    findContradictions, applicationAvailability, isRelevantToLocation,
    suggestNextQuestions, officialUrlInfo, audienceLine,
  });
});
