// Impact page: reducing unspent / surrendered scheme funds (transparent model).
import { useEffect, useState } from "react";
import ImpactModel from "../engine/impact.js";
import { LoadingList, Notice } from "./ui.jsx";

const crore = (n) => (n === null || n === undefined ? "–" : "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " crore");
const DEMAND_GRID = [5, 10, 25];
const GAIN_GRID = [10, 25, 50];
const toNum = (v) => Number(String(v).replace(/[,\s₹]/g, ""));

export function Impact() {
  const [ctx, setCtx] = useState(null);
  const [ctxErr, setCtxErr] = useState(null);
  const [form, setForm] = useState({ allocationCrore: "", spentCrore: "", demandSharePct: "10", uptakeGainPct: "25", avgBenefitRupees: "" });
  const [shown, setShown] = useState(null);
  useEffect(() => {
    fetch("data/impact/fiscal-context.json", { cache: "no-cache", credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setCtx)
      .catch((e) => setCtxErr(e.message));
  }, []);
  const calc = shown ? ImpactModel.estimate(shown) : null;
  const grid = calc && calc.ok ? ImpactModel.sensitivity(toNum(shown.allocationCrore), toNum(shown.spentCrore), DEMAND_GRID, GAIN_GRID) : null;
  const voted = ctx && ctx.facts.find((f) => f.id === "fy2425-voted");

  const field = (k, label, hint) => {
    const err = calc && calc.errors[k];
    return (
      <div className={`field ${err ? "field-error" : ""}`}>
        <label htmlFor={`imp-${k}`}>{label}</label>
        <input id={`imp-${k}`} type="text" inputMode="decimal" value={form[k]} maxLength={20} aria-describedby={`imp-${k}-hint`} aria-invalid={err ? "true" : undefined}
          onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
        <p className="field-hint" id={`imp-${k}-hint`}>{hint}</p>
        {err && <p className="field-error-text" role="alert">{err}</p>}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title" tabIndex={-1} data-route-heading>Impact: less money left unspent</h1>
          <p className="page-subtitle">Scheme money that eligible citizens never claim goes unspent and is surrendered or lapses. Proactive discovery works on the demand side of that gap. This page keeps official facts separate from assumptions.</p>
        </div>
      </div>

      <section className="panel" aria-labelledby="imp-ctx">
        <h2 id="imp-ctx" className="h3">Official context (CAG, FY 2024-25)</h2>
        {ctxErr ? <Notice tone="danger">Could not load the fiscal context ({ctxErr}).</Notice> : !ctx ? <LoadingList count={1} /> : (
          <>
            <div className="stat-grid stat-grid-money">
              {ctx.facts.filter((f) => f.savingsCrore).map((f) => (
                <div key={f.id} className="stat">
                  <span className="stat-value">{crore(f.savingsCrore)}</span>
                  <span className="stat-label">{f.label}: savings (approved {crore(f.approvedCrore)}, spent {crore(f.spentCrore)})</span>
                </div>
              ))}
            </div>
            {ctx.facts.map((f) => <blockquote key={f.id} className="quote">“{f.evidence.quote}”</blockquote>)}
            <p className="small muted">Source: <a href={ctx.sources[0].url} target="_blank" rel="noopener noreferrer">{ctx.sources[0].title}</a> ({ctx.sources[0].publisher}), linked from cag.gov.in.</p>
            <Notice tone="warn" title="What these figures do not say">{ctx.caveat}</Notice>
          </>
        )}
      </section>

      <section className="panel" aria-labelledby="imp-model">
        <h2 id="imp-model" className="h3">Model a scheme</h2>
        <p className="muted">Enter one scheme’s Budget Estimate (or Revised Estimate) and its actual spend from official records, then set the two assumptions. Nothing is pre-filled from unofficial sources.</p>
        <form className="form-grid" noValidate onSubmit={(e) => { e.preventDefault(); setShown({ ...form }); }}>
          {field("allocationCrore", "Allocation (₹ crore)", "BE or RE for the scheme, from the Expenditure Budget")}
          {field("spentCrore", "Actual spend (₹ crore)", "Actuals for the same year")}
          {field("demandSharePct", "Assumption A: share of unspent caused by eligible citizens not applying (%)", "Unknown today. The pilot measures it. Try several values.")}
          {field("uptakeGainPct", "Assumption B: share of that missed demand Mera Haq converts (%)", "Unknown today. The pilot measures it.")}
          {field("avgBenefitRupees", "Average benefit per beneficiary (₹, optional)", "Converts rupees into people reached")}
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">Calculate</button>
            {voted && (
              <button className="btn btn-secondary" type="button" onClick={() => { const f = { ...form, allocationCrore: String(voted.approvedCrore), spentCrore: String(voted.spentCrore) }; setForm(f); setShown(f); }}>
                Use CAG voted totals (all government)
              </button>
            )}
          </div>
        </form>

        {calc && calc.ok && (
          <div aria-live="polite">
            <div className="stat-grid stat-grid-money">
              <div className="stat"><span className="stat-value">{crore(calc.result.unspentCrore)}</span><span className="stat-label">Unspent ({calc.result.utilisationPct}% utilised)</span></div>
              <div className="stat"><span className="stat-value">{crore(calc.result.demandLinkedUnspentCrore)}</span><span className="stat-label">Linked to missed demand (assumption A)</span></div>
              <div className="stat"><span className="stat-value">{crore(calc.result.reductionInUnspentCrore)}</span><span className="stat-label">Potential reduction in unspent funds</span></div>
              <div className="stat">
                <span className="stat-value">{calc.result.additionalBeneficiaries === null ? "–" : calc.result.additionalBeneficiaries.toLocaleString("en-IN")}</span>
                <span className="stat-label">Additional beneficiaries reached{calc.result.additionalBeneficiaries === null ? " (enter the average benefit)" : ""}</span>
              </div>
            </div>
            <p className="small"><b>Formula:</b> (allocation − spend) × A × B = {crore(calc.result.unspentCrore)} × {calc.result.assumptions.demandSharePct}% × {calc.result.assumptions.uptakeGainPct}% = {crore(calc.result.reductionInUnspentCrore)}. Utilisation would rise from {calc.result.utilisationPct}% to {calc.result.newUtilisationPct}%.</p>
            <h3 className="h4">Sensitivity: potential reduction (₹ crore)</h3>
            <div className="table-wrap">
              <table>
                <caption className="sr-only">Reduction by assumption A (rows) and assumption B (columns)</caption>
                <thead><tr><th scope="col">A ↓ / B →</th>{GAIN_GRID.map((g) => <th key={g} scope="col">B = {g}%</th>)}</tr></thead>
                <tbody>
                  {grid.map((row, i) => (
                    <tr key={DEMAND_GRID[i]}><th scope="row">A = {DEMAND_GRID[i]}%</th>{row.map((v, j) => <td key={j}>{Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Notice tone="info">Illustrative model output, not a forecast. Applying it to all-government totals overstates welfare impact, because most savings have causes unrelated to citizen demand. Use it scheme by scheme.</Notice>
          </div>
        )}
      </section>

      <section className="panel" aria-labelledby="imp-levers">
        <h2 id="imp-levers" className="h3">How Mera Haq moves the demand-side levers</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">Cause of low uptake</th><th scope="col">What the POC does</th><th scope="col">Pilot metric</th></tr></thead>
            <tbody>
              <tr><td>Citizens don’t know the scheme exists</td><td>Shows schemes after 3 questions; no search needed</td><td>Share of users shown at least 1 relevant scheme</td></tr>
              <tr><td>Unsure whether they qualify</td><td>Explains each condition with the official sentence</td><td>Hand-offs to official portals per 100 users</td></tr>
              <tr><td>Applications rejected for missing documents</td><td>Scheme-specific document checklist before applying</td><td>Rejection rate of referred applicants (department data)</td></tr>
              <tr><td>Rules change; helpers lag behind</td><td>Versioned records and a change feed (open API)</td><td>Days from GR change to updated record</td></tr>
              <tr><td>Deadlines missed</td><td>Shows published application windows</td><td>Share of applications filed before the final 2 weeks</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
