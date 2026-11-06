// Phase 10.5 - real-data dry run.
// Synthetic PERSONAS (never synthetic schemes) are run through the real engine
// against the real published dataset (data/schemes.json).
//
// Two independent checks:
//  1. ORACLE: for the human-curated Central schemes, expected outcomes were
//     written by hand from the quoted source text (tests/fixtures/oracle.json),
//     separately from the criteria JSON. Any mismatch is a false positive or
//     false negative.
//  2. FALSE-POSITIVE AUDIT: for every LIKELY_ELIGIBLE / POTENTIAL_MATCH result,
//     the scheme's verbatim manual conditions are scanned for signals that
//     conflict with the persona (a social category the persona does not have,
//     girls-only wording for a male persona, etc.). Hits are reported as
//     *suspected* false positives for human review. They are never hidden.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const E = require("../src/engine/eligibility.js");

const DATA = JSON.parse(readFileSync("data/schemes.json", "utf8"));
const PERSONAS = JSON.parse(readFileSync("tests/fixtures/personas.json", "utf8")).personas;
const ORACLE = JSON.parse(readFileSync("tests/fixtures/oracle.json", "utf8"));
const NOW = new Date(process.env.DRYRUN_DATE || "2026-11-06");

const CAT_WORDS = { SC: /scheduled caste|\bsc\b|neo ?bouddh|navbouddh/i, ST: /scheduled tribe|\bst\b|tribal/i, OBC: /\bobc\b|other backward/i, VJNT: /vjnt|vimukta|nomadic/i, SBC: /\bsbc\b|special backward/i, EWS: /\bews\b|economically weaker/i, SEBC: /\bsebc\b/i };

function suspect(result, scheme, p) {
  const flags = [];
  for (const m of result.manualChecks) {
    const t = m.label;
    if (/\b(girls?|female|women)\b/i.test(t) && !/boys?/i.test(t) && p.gender === "MALE" && /only|should be|must be|for girls/i.test(t)) flags.push(`girls-only wording vs male persona: "${t.slice(0, 90)}"`);
    const named = Object.entries(CAT_WORDS).filter(([, re]) => re.test(t)).map(([c]) => c);
    if (named.length && p.socialCategory && !named.includes(p.socialCategory) && /belong|category|only|applicable/i.test(t) && !/general category|open category/i.test(t)) flags.push(`category wording [${named}] vs persona ${p.socialCategory}: "${t.slice(0, 90)}"`);
    const inc = t.match(/income[^.]{0,60}?(?:above|more than)\s*(?:rs\.?\s*)?([\d,.]+)/i);
    if (inc && p.annualFamilyIncome !== null && p.annualFamilyIncome !== undefined && p.annualFamilyIncome <= Number(inc[1].replace(/[,]/g, "")) && /above|more than/i.test(t)) flags.push(`income lower bound in text vs persona income ${p.annualFamilyIncome}: "${t.slice(0, 90)}"`);
  }
  return flags;
}

const report = { generatedAt: new Date().toISOString(), evaluationDate: NOW.toISOString().slice(0, 10), datasetGeneratedAt: DATA.generatedAt, schemes: DATA.schemes.length, personas: [] };
let oracleChecks = 0, oracleMismatches = [], failures = 0;
for (const persona of PERSONAS) {
  const { profile, errors } = E.validateProfile(persona.profile);
  let results;
  try {
    results = E.evaluateAll(DATA.schemes, profile, { now: NOW });
  } catch (e) {
    failures++;
    report.personas.push({ id: persona.id, error: String(e) });
    continue;
  }
  const relevant = results.filter((r) => E.isRelevantToLocation(DATA.schemes.find((s) => s.id === r.schemeId), profile.state));
  const count = (o) => relevant.filter((r) => r.outcome === o).length;
  const suspected = [];
  for (const r of relevant.filter((x) => ["LIKELY_ELIGIBLE", "POTENTIAL_MATCH"].includes(x.outcome))) {
    const flags = suspect(r, DATA.schemes.find((s) => s.id === r.schemeId), profile);
    if (flags.length) suspected.push({ schemeId: r.schemeId, outcome: r.outcome, flags });
  }
  const mism = [];
  for (const [schemeId, expected] of Object.entries((ORACLE.expected[persona.id]) || {})) {
    const got = results.find((r) => r.schemeId === schemeId);
    oracleChecks++;
    if (!got) { mism.push({ schemeId, expected, got: "MISSING" }); continue; }
    if (got.outcome !== expected) mism.push({ schemeId, expected, got: got.outcome, explanation: got.explanation });
  }
  oracleMismatches.push(...mism.map((m) => ({ persona: persona.id, ...m })));
  report.personas.push({
    id: persona.id, description: persona.description, profile, validationErrors: errors,
    evaluated: results.length, relevantToLocation: relevant.length,
    likelyEligible: count("LIKELY_ELIGIBLE"), potentialMatch: count("POTENTIAL_MATCH"), needsManualVerification: count("NEEDS_MANUAL_VERIFICATION"),
    insufficientInformation: count("INSUFFICIENT_INFORMATION"), notCurrentlyOpen: count("SCHEME_NOT_CURRENTLY_OPEN"), notEligible: count("NOT_ELIGIBLE"),
    oracleMismatches: mism, suspectedFalsePositives: suspected,
    likelyEligibleIds: relevant.filter((r) => r.outcome === "LIKELY_ELIGIBLE").map((r) => r.schemeId),
  });
}
report.summary = { personas: PERSONAS.length, failedEvaluations: failures, oracleChecks, oracleMismatches: oracleMismatches.length, suspectedFalsePositives: report.personas.reduce((a, p) => a + (p.suspectedFalsePositives ? p.suspectedFalsePositives.length : 0), 0) };
report.oracleMismatchDetails = oracleMismatches;
writeFileSync("data/reports/dry-run.json", JSON.stringify(report, null, 1));

const rows = report.personas.map((p) => `| ${p.id} | ${p.description} | ${p.relevantToLocation} | ${p.likelyEligible} | ${p.potentialMatch} | ${p.needsManualVerification} | ${p.insufficientInformation} | ${p.notCurrentlyOpen} | ${p.notEligible} | ${p.oracleMismatches.length} | ${p.suspectedFalsePositives.length} |`);
writeFileSync("data/reports/dry-run.md", [
  `Dry run on ${report.evaluationDate} against dataset generated ${report.datasetGeneratedAt} (${report.schemes} schemes).`, "",
  "| Persona | Profile | Evaluated (in location) | Likely | Potential | Check source | Need info | Not open | Not eligible | Oracle mismatches | Suspected FP |",
  "|---|---|---|---|---|---|---|---|---|---|---|", ...rows, "",
  `Oracle checks: ${oracleChecks}, mismatches: ${oracleMismatches.length}. Failed evaluations: ${failures}. Suspected false positives flagged for review: ${report.summary.suspectedFalsePositives}.`,
].join("\n"));
console.log(JSON.stringify(report.summary));
if (oracleMismatches.length) { console.log("ORACLE MISMATCHES:"); for (const m of oracleMismatches) console.log(" ", m.persona, m.schemeId, "expected", m.expected, "got", m.got); }
