// Unit tests for the deterministic eligibility engine (node --test).
// Uses small hand-made scheme FIXTURES to test engine logic (they are NOT
// published schemes), plus the real dataset for invariants.
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../../src/engine/eligibility.js");
const L = require("../../src/engine/locations.js");
const DATA = require("../../data/schemes.json");

const fixture = (criteria, extra = {}) => ({
  id: "fixture",
  name: "Engine test fixture",
  level: "CENTRAL",
  jurisdictions: ["ALL"],
  criteria,
  verification: { status: "VERIFIED" },
  ...extra,
});
const age18to40 = [
  { id: "a1", field: "age", op: "gte", value: 18, label: "Age at least 18" },
  { id: "a2", field: "age", op: "lte", value: 40, label: "Age at most 40" },
];
const incomeCap = [{ id: "i", field: "annualFamilyIncome", op: "lte", value: 250000, label: "Income at most ₹2,50,000" }];

test("location registry has 28 States and 8 UTs as separate types", () => {
  assert.equal(L.STATES.length, 28);
  assert.equal(L.UNION_TERRITORIES.length, 8);
  assert.ok(L.STATES.every((s) => s.type === "STATE"));
  assert.ok(L.UNION_TERRITORIES.every((s) => s.type === "UNION_TERRITORY"));
  assert.equal(new Set(L.ALL.map((l) => l.code)).size, 36);
  assert.equal(L.locationName("DH"), "Dadra and Nagar Haveli and Daman and Diu");
  assert.equal(L.isValidLocationCode("XX"), false);
});

test("age boundaries: min and max are inclusive", () => {
  const s = fixture(age18to40);
  assert.equal(E.evaluateScheme(s, { age: 17 }).outcome, "NOT_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { age: 18 }).outcome, "LIKELY_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { age: 40 }).outcome, "LIKELY_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { age: 41 }).outcome, "NOT_ELIGIBLE");
});

test("income exactly at ceiling passes, one rupee above fails", () => {
  const s = fixture(incomeCap);
  assert.equal(E.evaluateScheme(s, { annualFamilyIncome: 250000 }).outcome, "LIKELY_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { annualFamilyIncome: 250001 }).outcome, "NOT_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { annualFamilyIncome: 0 }).outcome, "LIKELY_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { annualFamilyIncome: 249999.5 }).outcome, "LIKELY_ELIGIBLE");
});

test("strict 'less than' ceiling: equal value fails", () => {
  const s = fixture([{ id: "i", field: "annualFamilyIncome", op: "lt", value: 800000, label: "Income below ₹8 lakh" }]);
  assert.equal(E.evaluateScheme(s, { annualFamilyIncome: 800000 }).outcome, "NOT_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { annualFamilyIncome: 799999 }).outcome, "LIKELY_ELIGIBLE");
});

test("missing mandatory info is never treated as eligible", () => {
  const s = fixture([...age18to40, ...incomeCap]);
  const r = E.evaluateScheme(s, { age: 23 });
  assert.equal(r.outcome, "POTENTIAL_MATCH");
  assert.deepEqual(r.missingFields, ["annualFamilyIncome"]);
  assert.match(r.explanation, /cannot confirm/i);
  const r2 = E.evaluateScheme(s, {});
  assert.equal(r2.outcome, "INSUFFICIENT_INFORMATION");
});

test("missing gender for a women-only scheme is unknown, not a pass", () => {
  const s = fixture([{ id: "g", field: "gender", op: "in", value: ["FEMALE"], label: "Woman" }]);
  assert.equal(E.evaluateScheme(s, {}).outcome, "INSUFFICIENT_INFORMATION");
  assert.equal(E.evaluateScheme(s, { gender: "MALE" }).outcome, "NOT_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { gender: "FEMALE" }).outcome, "LIKELY_ELIGIBLE");
});

test("scheme without age restriction accepts any valid age", () => {
  const s = fixture(incomeCap);
  for (const age of [0, 1, 60, 100, 120]) assert.equal(E.evaluateScheme(s, { age, annualFamilyIncome: 1 }).outcome, "LIKELY_ELIGIBLE");
});

test("state scheme: other State/UT is not eligible, same state proceeds, unknown state is unknown", () => {
  const s = fixture(incomeCap, { level: "STATE", jurisdictions: ["MH"] });
  assert.equal(E.evaluateScheme(s, { state: "KA", annualFamilyIncome: 1 }).outcome, "NOT_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { state: "MH", annualFamilyIncome: 1 }).outcome, "LIKELY_ELIGIBLE");
  const unknownState = E.evaluateScheme(s, { annualFamilyIncome: 1 });
  assert.equal(unknownState.outcome, "POTENTIAL_MATCH");
  assert.deepEqual(unknownState.missingFields, ["state"]);
  assert.equal(E.evaluateScheme(s, {}).outcome, "INSUFFICIENT_INFORMATION");
});

test("central scheme is relevant in every State and UT; multi-location scheme in each listed one", () => {
  const c = fixture([]);
  const multi = fixture([], { level: "STATE", jurisdictions: ["MH", "GA"] });
  for (const l of L.ALL) assert.ok(E.isRelevantToLocation(c, l.code));
  assert.ok(E.isRelevantToLocation(multi, "GA"));
  assert.ok(E.isRelevantToLocation(multi, "MH"));
  assert.ok(!E.isRelevantToLocation(multi, "DL"));
  assert.ok(!E.isRelevantToLocation(multi, null));
});

test("anyOf group: SC/ST or woman", () => {
  const s = fixture([{ id: "g", label: "SC/ST or woman", anyOf: [
    { field: "socialCategory", op: "in", value: ["SC", "ST"] },
    { field: "gender", op: "in", value: ["FEMALE"] },
  ] }]);
  assert.equal(E.evaluateScheme(s, { gender: "FEMALE", socialCategory: "GENERAL" }).outcome, "LIKELY_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { gender: "MALE", socialCategory: "ST" }).outcome, "LIKELY_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { gender: "MALE", socialCategory: "OBC" }).outcome, "NOT_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { gender: "MALE" }).outcome, "INSUFFICIENT_INFORMATION");
});

test("conflicting rules give NEEDS_MANUAL_VERIFICATION, never eligible", () => {
  const s = fixture([
    { id: "a", field: "age", op: "gte", value: 30, label: "Age ≥ 30" },
    { id: "b", field: "age", op: "lte", value: 18, label: "Age ≤ 18" },
  ]);
  assert.ok(E.findContradictions(s.criteria).length > 0);
  const r = E.evaluateScheme(s, {});
  assert.equal(r.outcome, "NEEDS_MANUAL_VERIFICATION");
});

test("closed application window is reported separately from eligibility", () => {
  const s = fixture(age18to40, { applicationWindow: { opens: null, closes: "2025-03-31" } });
  const r = E.evaluateScheme(s, { age: 25 }, { now: new Date("2026-11-06") });
  assert.equal(r.eligibility, "LIKELY_ELIGIBLE");
  assert.equal(r.availability, "CLOSED");
  assert.equal(r.outcome, "SCHEME_NOT_CURRENTLY_OPEN");
  const r2 = E.evaluateScheme(s, { age: 70 }, { now: new Date("2026-11-06") });
  assert.equal(r2.outcome, "NOT_ELIGIBLE");
  const open = E.evaluateScheme(fixture(age18to40, { applicationWindow: { opens: "2026-01-01", closes: "2026-12-31" } }), { age: 25 }, { now: new Date("2026-11-06") });
  assert.equal(open.availability, "OPEN");
});

test("unverified record never yields LIKELY_ELIGIBLE", () => {
  const s = fixture(age18to40, { verification: { status: "NEEDS_REVIEW" } });
  assert.equal(E.evaluateScheme(s, { age: 25 }).outcome, "NEEDS_MANUAL_VERIFICATION");
});

test("scheme with only manual criteria needs manual verification", () => {
  const s = fixture([{ id: "m", op: "manual", label: "Has no bank account" }]);
  const r = E.evaluateScheme(s, { age: 30 });
  assert.equal(r.outcome, "NEEDS_MANUAL_VERIFICATION");
  assert.equal(r.manualChecks.length, 1);
});

test("explanations name the passed, failed and unknown criteria", () => {
  const s = fixture([...age18to40, ...incomeCap]);
  const r = E.evaluateScheme(s, { age: 23 });
  assert.equal(r.passed.length, 2);
  assert.equal(r.unknown.length, 1);
  assert.match(r.explanation, /Age at least 18/);
  assert.match(r.explanation, /Income at most/);
});

// ---------------------------------------------------------------------------
// Profile validation / random input
// ---------------------------------------------------------------------------
test("age validation", () => {
  const v = (age) => E.validateProfile({ age });
  assert.equal(v(0).profile.age, 0);
  assert.equal(v(17).profile.age, 17);
  assert.equal(v(18).profile.age, 18);
  assert.equal(v("23").profile.age, 23);
  assert.equal(v(60).profile.age, 60);
  assert.equal(v(100).profile.age, 100);
  assert.equal(v(150).profile.age, null);
  assert.ok(v(150).errors.age);
  assert.ok(v(-1).errors.age);
  assert.ok(v(-30).errors.age);
  assert.ok(v(23.5).errors.age);
  assert.ok(v("abc").errors.age);
  assert.ok(v("1e3").errors.age);
  assert.equal(v("").profile.age, null);
  assert.equal(v("").errors.age, undefined);
});

test("income validation", () => {
  const v = (x) => E.validateProfile({ annualFamilyIncome: x });
  assert.equal(v(0).profile.annualFamilyIncome, 0);
  assert.equal(v("2,50,000").profile.annualFamilyIncome, 250000);
  assert.equal(v("₹ 1,20,000").profile.annualFamilyIncome, 120000);
  assert.equal(v(123456.789).profile.annualFamilyIncome, 123456.79);
  assert.ok(v(-5).errors.annualFamilyIncome);
  assert.ok(v(1e15).errors.annualFamilyIncome);
  assert.ok(v("Infinity").errors.annualFamilyIncome);
  assert.ok(v("NaN").errors.annualFamilyIncome);
  assert.ok(v("12abc").errors.annualFamilyIncome);
  assert.equal(v(9999999999).profile.annualFamilyIncome, 9999999999);
});

test("enum and location validation reject invalid, injection and unicode values", () => {
  const bad = ["<script>alert(1)</script>", "' OR 1=1 --", "MALE; DROP TABLE users", "ಪುರುಷ", "x".repeat(5000), "{}", "null"];
  for (const b of bad) {
    const r = E.validateProfile({ gender: b, state: b, socialCategory: b, religion: b });
    assert.equal(r.profile.gender, null);
    assert.equal(r.profile.state, null);
    assert.equal(r.profile.socialCategory, null);
    assert.ok(r.errors.gender && r.errors.state);
  }
  assert.equal(E.validateProfile({ state: "mh" }).profile.state, "MH");
  assert.equal(E.validateProfile({ gender: "female" }).profile.gender, "FEMALE");
  assert.ok(E.validateProfile({ state: "Atlantis" }).errors.state);
});

test("displayName strips markup and control characters and is length-limited", () => {
  const r = E.validateProfile({ displayName: "<img src=x onerror=alert(1)>Neha\u0000" + "a".repeat(200) });
  assert.ok(!r.profile.displayName.includes("<"));
  assert.ok(r.profile.displayName.length <= 60);
  assert.equal(E.validateProfile({ displayName: "नेहा" }).profile.displayName, "नेहा");
});

test("validateProfile ignores unknown keys and non-object input", () => {
  assert.deepEqual(Object.keys(E.validateProfile(null).errors), []);
  assert.deepEqual(Object.keys(E.validateProfile("x").errors), []);
  const r = E.validateProfile({ __proto__: { age: 5 }, isAdmin: true, aadhaar: "1234" });
  assert.equal(r.profile.isAdmin, undefined);
  assert.equal(r.profile.aadhaar, undefined);
});

test("invalid profile values never produce eligibility claims", () => {
  const s = fixture(age18to40);
  for (const age of [-1, 150, "abc", null, undefined, "", 1e9]) {
    const r = E.evaluateScheme(s, { age });
    assert.notEqual(r.outcome, "LIKELY_ELIGIBLE", `age=${age}`);
  }
});

// ---------------------------------------------------------------------------
// Official URL hand-off safety
// ---------------------------------------------------------------------------
test("official URL validation", () => {
  assert.ok(E.officialUrlInfo("https://mahadbt2.maharashtra.gov.in/").ok);
  assert.ok(E.officialUrlInfo("https://pmvishwakarma.gov.in/").ok);
  assert.ok(E.officialUrlInfo("https://maandhan.in/").ok);
  assert.ok(!E.officialUrlInfo("http://pmkisan.gov.in/").ok, "http");
  assert.ok(!E.officialUrlInfo("javascript:alert(1)").ok);
  assert.ok(!E.officialUrlInfo("https://gov.in.evil.example/").ok);
  assert.ok(!E.officialUrlInfo("https://evilgov.in/").ok);
  assert.ok(!E.officialUrlInfo("https://user:pw@pmuy.gov.in/").ok);
  assert.ok(!E.officialUrlInfo("not a url").ok);
  assert.ok(!E.officialUrlInfo(null).ok);
  assert.ok(!E.officialUrlInfo("https://example.com/?r=https://pmuy.gov.in").ok);
});

// ---------------------------------------------------------------------------
// Real dataset invariants
// ---------------------------------------------------------------------------
test("published dataset: every scheme has sources and verified evidence quotes", () => {
  assert.ok(DATA.schemes.length > 0);
  const ids = new Set();
  for (const s of DATA.schemes) {
    assert.ok(!ids.has(s.id), `duplicate ${s.id}`);
    ids.add(s.id);
    assert.ok(s.sources.length >= 1, s.id);
    assert.ok(["VERIFIED", "PARTIALLY_VERIFIED", "NEEDS_REVIEW", "OUTDATED", "INACTIVE", "SOURCE_UNAVAILABLE"].includes(s.verification.status));
    for (const c of s.criteria) assert.ok(c.evidence && c.evidence.quote, `${s.id}/${c.id} has no evidence`);
    if (["VERIFIED", "PARTIALLY_VERIFIED"].includes(s.verification.status)) {
      assert.equal(s.verification.quotesFound, s.verification.quotesTotal, s.id);
    }
    for (const u of [s.applicationUrl, s.infoUrl].filter(Boolean)) assert.ok(E.officialUrlInfo(u).ok, `${s.id}: ${u}`);
    if (s.level === "CENTRAL") assert.deepEqual(s.jurisdictions, ["ALL"]);
    else for (const j of s.jurisdictions) assert.ok(L.isValidLocationCode(j));
  }
});

test("published dataset: no contradictory machine rules", () => {
  for (const s of DATA.schemes) assert.deepEqual(E.findContradictions(s.criteria), [], s.id);
});

test("evaluateAll is deterministic and sorted by outcome", () => {
  const p = { age: 23, gender: "MALE", state: "MH" };
  const a = E.evaluateAll(DATA.schemes, p, { now: new Date("2026-11-06") });
  const b = E.evaluateAll(DATA.schemes, p, { now: new Date("2026-11-06") });
  assert.deepEqual(a.map((r) => r.schemeId + r.outcome), b.map((r) => r.schemeId + r.outcome));
  const order = a.map((r) => E.OUTCOME_ORDER.indexOf(r.outcome));
  assert.deepEqual(order, [...order].sort((x, y) => x - y));
});

test("location-only match with manual conditions is not reported as likely eligible", () => {
  const s = fixture([
    { id: "d", field: "domicileState", op: "in", value: ["MH"], label: "Domicile of Maharashtra" },
    { id: "m", op: "manual", label: "Admitted through CAP round" },
  ], { level: "STATE", jurisdictions: ["MH"] });
  const r = E.evaluateScheme(s, { state: "MH", domicileState: "MH" });
  assert.equal(r.outcome, "NEEDS_MANUAL_VERIFICATION");
  assert.match(r.explanation, /basic conditions/);
  const r2 = E.evaluateScheme(fixture([...incomeCap, { id: "m", op: "manual", label: "x" }]), { annualFamilyIncome: 1 });
  assert.equal(r2.outcome, "LIKELY_ELIGIBLE");
});

test("gate condition (currently studying): non-students fail, students are not 'likely eligible' on the gate alone", () => {
  const s = fixture([
    { id: "g", field: "studentLevel", op: "notIn", value: ["NOT_STUDENT"], label: "Currently studying", gate: true },
    { id: "m", op: "manual", label: "Admitted through CAP round" },
  ]);
  assert.equal(E.evaluateScheme(s, { studentLevel: "NOT_STUDENT" }).outcome, "NOT_ELIGIBLE");
  assert.equal(E.evaluateScheme(s, { studentLevel: "UNDERGRADUATE" }).outcome, "NEEDS_MANUAL_VERIFICATION");
  assert.equal(E.evaluateScheme(s, {}).outcome, "INSUFFICIENT_INFORMATION");
  const withIncome = fixture([...s.criteria, ...incomeCap]);
  assert.equal(E.evaluateScheme(withIncome, { studentLevel: "UNDERGRADUATE", annualFamilyIncome: 1 }).outcome, "LIKELY_ELIGIBLE");
  assert.equal(E.evaluateScheme(withIncome, { studentLevel: "UNDERGRADUATE" }).outcome, "INSUFFICIENT_INFORMATION");
});

test("shortReason is one short sentence for every outcome", () => {
  const s = fixture([...age18to40, ...incomeCap, { id: "m", op: "manual", label: "Has a bank account" }]);
  assert.equal(E.evaluateScheme(s, { age: 24, annualFamilyIncome: 1 }).shortReason, "You meet the 3 conditions we can check. 1 more to confirm on the official page.");
  assert.equal(E.evaluateScheme(s, { age: 24 }).shortReason, "Fits so far. To confirm, tell us your annual family income.");
  assert.equal(E.evaluateScheme(s, {}).shortReason, "Tell us your age and annual family income to check this scheme.");
  assert.equal(E.evaluateScheme(s, { age: 41, annualFamilyIncome: 999999 }).shortReason, "Not met: Age at most 40, and 1 more.");
  assert.match(E.evaluateScheme(fixture([{ id: "m", op: "manual", label: "x" }]), {}).shortReason, /can't check this one automatically/);
  assert.match(E.evaluateScheme(fixture(age18to40, { applicationWindow: { closes: "2020-01-01" } }), { age: 20 }).shortReason, /window has closed/);
  for (const sch of DATA.schemes) for (const p of [{}, { age: 24, state: "MH" }, { age: 70, state: "DL", gender: "FEMALE" }]) {
    const r = E.evaluateScheme(sch, p);
    assert.ok(r.shortReason.length > 10 && r.shortReason.length <= 140, `${sch.id}: ${r.shortReason}`);
  }
});

test("audienceLine is built only from machine criteria", () => {
  assert.equal(E.audienceLine(fixture([...age18to40, ...incomeCap, { id: "m", op: "manual", label: "secret" }])), "age 18–40 · family income up to ₹2.5 lakh");
  assert.equal(E.audienceLine(fixture([{ id: "a", field: "age", op: "gte", value: 18, label: "x" }, { id: "g", field: "gender", op: "in", value: ["FEMALE"], label: "x" }])), "age 18+ · women and girls");
  assert.equal(E.audienceLine(fixture([{ id: "m", op: "manual", label: "only manual" }])), null);
});

test("pension and insurance age windows on real data: join at 18-40, cover to 50 / 70", () => {
  const out = (id, age) => E.evaluateScheme(DATA.schemes.find((x) => x.id === id), { age }).eligibility;
  for (const [id, lo, hi] of [["apy", 18, 40], ["pm-sym", 18, 40], ["pmjjby", 18, 50], ["pmsby", 18, 70]]) {
    assert.equal(out(id, lo - 1), "NOT_ELIGIBLE", `${id} ${lo - 1}`);
    assert.equal(out(id, lo), "LIKELY_ELIGIBLE", `${id} ${lo}`);
    assert.equal(out(id, 24), "LIKELY_ELIGIBLE", `${id} 24`);
    assert.equal(out(id, hi), "LIKELY_ELIGIBLE", `${id} ${hi}`);
    assert.equal(out(id, hi + 1), "NOT_ELIGIBLE", `${id} ${hi + 1}`);
  }
  for (const s of DATA.schemes.filter((x) => x.category === "PENSION")) assert.match(s.summary, /from age 60/);
});

test("real data: a 24-year-old who is not studying is not matched to student scholarships", () => {
  const r = E.evaluateAll(DATA.schemes, { age: 24, gender: "MALE", state: "MH", studentLevel: "NOT_STUDENT" });
  const mh = r.filter((x) => x.schemeId.startsWith("mh-"));
  assert.ok(mh.filter((x) => x.outcome === "NOT_ELIGIBLE").length >= 50);
  assert.equal(mh.filter((x) => ["LIKELY_ELIGIBLE", "POTENTIAL_MATCH"].includes(x.outcome)).length, 0);
});
