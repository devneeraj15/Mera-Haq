import { useEffect, useMemo, useState } from "react";
import Engine from "../engine/eligibility.js";
import Locations from "../engine/locations.js";
import { apiBase, useApp } from "./store.jsx";
import {
  Badge, CATEGORY_LABELS, Dialog, EmptyState, ENUM_LABELS, ErrorState, FieldInput, formatDate, formatINR,
  LevelBadge, LoadingList, locName, Notice, OUTCOME_UI, OutcomeBadge, VerificationBadge,
} from "./ui.jsx";

const PAGE_SIZE = 12;
const BASE_FIELDS = ["age", "gender", "state"];
const TRUSTED = ["VERIFIED", "PARTIALLY_VERIFIED"];

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function relevantSchemes(schemes, profile) {
  return schemes.filter((s) => Engine.isRelevantToLocation(s, profile.state));
}

function fieldsUsed(schemes) {
  const set = new Set(BASE_FIELDS);
  const walk = (c) => { if (c.field) set.add(c.field); (c.anyOf || []).forEach(walk); };
  schemes.forEach((s) => s.criteria.forEach(walk));
  return [...set];
}

function profileCompletion(profile, schemes) {
  const fields = fieldsUsed(relevantSchemes(schemes, profile));
  const answered = fields.filter((f) => profile[f] !== null && profile[f] !== undefined).length;
  return { answered, total: fields.length, pct: fields.length ? Math.round((answered / fields.length) * 100) : 0 };
}

function Page({ title, subtitle, actions, children }) {
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title" tabIndex={-1} data-route-heading>{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function DataGate({ children }) {
  const { data, reload } = useApp();
  if (data.status === "loading") return <LoadingList />;
  if (data.status === "error") return <ErrorState title="Scheme data is unavailable" message={data.error} onRetry={reload} />;
  return children;
}

function NeedsProfile({ children }) {
  const { onboarded, navigate } = useApp();
  if (!onboarded) {
    return (
      <EmptyState title="Start with three quick questions" action={<button className="btn btn-primary" type="button" onClick={() => navigate("/mera-haq/start")}>Start</button>}>
        Tell us your age, gender and State/UT to see schemes offered where you live.
      </EmptyState>
    );
  }
  return children;
}

// ---------------------------------------------------------------------------
// Scheme card
// ---------------------------------------------------------------------------
export function SchemeCard({ scheme, result, showOutcome = true }) {
  const { saved, toggleSave } = useApp();
  const isSaved = saved.includes(scheme.id);
  const benefit = scheme.benefits[0];
  return (
    <article className="scheme-card" aria-labelledby={`sc-${scheme.id}`}>
      <div className="scheme-card-top">
        <div className="badge-row">
          <LevelBadge scheme={scheme} />
          <Badge tone="outline">{CATEGORY_LABELS[scheme.category] || scheme.category}</Badge>
        </div>
        <button type="button" className={`save-btn ${isSaved ? "is-saved" : ""}`} aria-pressed={isSaved} onClick={() => toggleSave(scheme.id)}
          aria-label={isSaved ? `Remove ${scheme.name} from saved schemes` : `Save ${scheme.name}`}>
          {isSaved ? "★ Saved" : "☆ Save"}
        </button>
      </div>
      <h3 className="scheme-card-title" id={`sc-${scheme.id}`}><a href={`#/mera-haq/scheme/${scheme.id}`}>{scheme.name}</a></h3>
      <p className="scheme-card-dept">{scheme.department || scheme.ministry || "Department not stated in source"}</p>
      {benefit && <p className="scheme-card-benefit">{benefit.text.split("\n")[0].slice(0, 180)}{benefit.text.length > 180 ? "…" : ""}</p>}
      <div className="badge-row">
        {showOutcome && result && <OutcomeBadge outcome={result.outcome} />}
        <VerificationBadge status={scheme.verification.status} />
      </div>
      {showOutcome && result && <p className="scheme-card-why">{result.explanation}</p>}
      <div className="scheme-card-actions">
        <a className="btn btn-secondary btn-sm" href={`#/mera-haq/scheme/${scheme.id}`}>View details & eligibility</a>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// Overview dashboard
// ---------------------------------------------------------------------------
export function Overview() {
  const { onboarded, profile, data, results, schemeById, saved, navigate } = useApp();
  if (!onboarded) return <Landing />;
  return (
    <Page title={`Welcome${profile.displayName ? ", " + profile.displayName : ""}`} subtitle="Your Mera Haq overview, worked out from official scheme data and the answers you have given.">
      <DataGate>
        <OverviewBody profile={profile} data={data} results={results} schemeById={schemeById} saved={saved} navigate={navigate} />
      </DataGate>
    </Page>
  );
}

function OverviewBody({ profile, data, results, schemeById, saved, navigate }) {
  const relevant = results.filter((r) => Engine.isRelevantToLocation(schemeById[r.schemeId], profile.state));
  const count = (o) => relevant.filter((r) => r.outcome === o).length;
  const completion = profileCompletion(profile, data.schemes);
  const recent = [...data.schemes].sort((a, b) => (b.sources[0].retrievedAt || "").localeCompare(a.sources[0].retrievedAt || "")).slice(0, 5);
  const today = new Date().toISOString().slice(0, 10);
  const deadlines = data.schemes.filter((s) => s.applicationWindow && s.applicationWindow.closes && s.applicationWindow.closes >= today);
  const notices = [];
  const mh = data.schemes.find((s) => s.applicationUrlEvidence);
  if (mh && profile.state === "MH") notices.push({ text: mh.applicationUrlEvidence.quote, source: mh.sources[0] });
  data.schemes.filter((s) => s.applicationWindow && s.applicationWindow.closes && s.applicationWindow.closes < today)
    .forEach((s) => notices.push({ text: `${s.name}: ${s.applicationWindow.evidence ? s.applicationWindow.evidence.quote : "application window closed on " + s.applicationWindow.closes}`, source: s.sources[0] }));
  return (
    <>
      <section className="stat-grid" aria-label="Summary">
        <div className="stat"><span className="stat-value">{relevant.length}</span><span className="stat-label">Schemes offered in {profile.state ? locName(profile.state) : "your location"} (incl. Central)</span></div>
        <div className="stat"><span className="stat-value">{count("LIKELY_ELIGIBLE")}</span><span className="stat-label">Likely eligible</span></div>
        <div className="stat"><span className="stat-value">{count("POTENTIAL_MATCH")}</span><span className="stat-label">Potential matches</span></div>
        <div className="stat"><span className="stat-value">{saved.length}</span><span className="stat-label">Saved schemes</span></div>
      </section>

      <section className="panel" aria-labelledby="completion-h">
        <div className="panel-head">
          <h2 id="completion-h" className="h3">Profile completion</h2>
          <a className="btn btn-secondary btn-sm" href="#/mera-haq/profile">Edit profile</a>
        </div>
        <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.pct} aria-label="Profile completion">
          <div className="progress-bar" style={{ width: `${completion.pct}%` }} />
        </div>
        <p className="muted">{completion.answered} of {completion.total} questions that affect schemes in your location are answered. {count("POTENTIAL_MATCH") + count("INSUFFICIENT_INFORMATION") > 0 && <>Answering more can confirm or rule out <strong>{count("POTENTIAL_MATCH") + count("INSUFFICIENT_INFORMATION")}</strong> schemes.</>}</p>
        <button className="btn btn-primary" type="button" onClick={() => navigate("/mera-haq/eligible")}>See my eligible schemes</button>
      </section>

      <div className="two-col">
        <section className="panel" aria-labelledby="deadlines-h">
          <h2 id="deadlines-h" className="h3">Upcoming application deadlines</h2>
          {deadlines.length === 0
            ? <p className="muted">No scheme in the current dataset has a future application deadline published in its official source. Check each scheme's official page for dates.</p>
            : <ul className="plain-list">{deadlines.map((s) => <li key={s.id}><a href={`#/mera-haq/scheme/${s.id}`}>{s.name}</a>: closes {formatDate(s.applicationWindow.closes)}</li>)}</ul>}
        </section>
        <section className="panel" aria-labelledby="notices-h">
          <h2 id="notices-h" className="h3">Official notices</h2>
          {notices.length === 0 ? <p className="muted">No notices captured from official sources.</p> : (
            <ul className="plain-list">
              {notices.map((n, i) => <li key={i}><q>{n.text}</q> <span className="muted small">(source: <a href={n.source.url} target="_blank" rel="noopener noreferrer">{n.source.publisher}</a>)</span></li>)}
            </ul>
          )}
        </section>
      </div>

      <section className="panel" aria-labelledby="recent-h">
        <h2 id="recent-h" className="h3">Recently verified schemes</h2>
        <ul className="plain-list">
          {recent.map((s) => <li key={s.id}><a href={`#/mera-haq/scheme/${s.id}`}>{s.name}</a> <span className="muted small">source captured {formatDate(s.sources[0].retrievedAt)}</span></li>)}
        </ul>
      </section>
    </>
  );
}

function Landing() {
  const { data } = useApp();
  const central = data.schemes.filter((s) => s.level === "CENTRAL").length;
  const states = new Set(data.schemes.filter((s) => s.level !== "CENTRAL").flatMap((s) => s.jurisdictions));
  return (
    <div className="page">
      <section className="hero">
        <p className="eyebrow">Mera Haq on UMANG</p>
        <h1 className="page-title" tabIndex={-1} data-route-heading>Find government schemes you may be eligible for</h1>
        <p className="page-subtitle">Answer three questions: age, gender and State/UT. Mera Haq checks your answers against eligibility rules taken word for word from official government sources, and explains each result.</p>
        <div className="hero-actions">
          <a className="btn btn-primary btn-lg" href="#/mera-haq/start">Start: 3 quick questions</a>
          <a className="btn btn-secondary btn-lg" href="#/mera-haq/find">Browse all schemes</a>
        </div>
        {data.status === "ready" && (
          <p className="muted small">Current dataset: {data.schemes.length} schemes ({central} Central; State/UT schemes from {states.size ? [...states].map(locName).join(", ") : "none"} so far). See <a href="#/mera-haq/resources">data sources & coverage</a>.</p>
        )}
      </section>
      <section className="feature-grid" aria-label="How Mera Haq works">
        <div className="feature"><h2 className="h3">1. Rules from official sources</h2><p>Every eligibility rule links to the official page it came from, with the exact sentence quoted.</p></div>
        <div className="feature"><h2 className="h3">2. Honest results</h2><p>If we don't know something, for example your income, the result says so. A missing answer is never counted as a pass.</p></div>
        <div className="feature"><h2 className="h3">3. Apply on the official site</h2><p>Mera Haq never submits applications. Use the link to the official portal and apply there.</p></div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Onboarding (age, gender, State/UT)
// ---------------------------------------------------------------------------
export function Onboarding() {
  const { profile, updateProfile, completeOnboarding, navigate, remember, setRemember } = useApp();
  const [draft, setDraft] = useState({ age: profile.age, gender: profile.gender, state: profile.state, displayName: profile.displayName });
  const [errors, setErrors] = useState({});
  const submit = (e) => {
    e.preventDefault();
    const { profile: valid, errors: errs } = Engine.validateProfile(draft);
    const required = {};
    if (valid.age === null && !errs.age) required.age = "Enter your age.";
    if (valid.state === null && !errs.state) required.state = "Choose your State or Union Territory.";
    const all = { ...errs, ...required };
    setErrors(all);
    if (Object.keys(all).length) {
      const first = document.getElementById(`onb-${Object.keys(all)[0]}`);
      if (first) first.focus();
      return;
    }
    updateProfile({ age: valid.age, gender: valid.gender, state: valid.state, displayName: valid.displayName });
    completeOnboarding();
    navigate("/mera-haq/eligible");
  };
  return (
    <Page title="Three quick questions" subtitle="This is enough to show schemes offered where you live. You can skip any further questions.">
      <form className="panel form" onSubmit={submit} noValidate aria-describedby="onb-privacy">
        {Object.keys(errors).length > 0 && <div className="notice notice-danger" role="alert">Please correct the highlighted fields.</div>}
        <FieldInput field="age" idPrefix="onb" required value={draft.age} error={errors.age} onChange={(v) => setDraft({ ...draft, age: v })} />
        <FieldInput field="gender" idPrefix="onb" value={draft.gender} error={errors.gender} onChange={(v) => setDraft({ ...draft, gender: v })} />
        <FieldInput field="state" idPrefix="onb" required value={draft.state} error={errors.state} onChange={(v) => setDraft({ ...draft, state: v })} />
        <div className="field">
          <label htmlFor="onb-name">What should we call you? <span className="field-tag">Optional</span></label>
          <input id="onb-name" type="text" maxLength={60} autoComplete="given-name" value={draft.displayName || ""} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} />
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>Remember my answers on this device (otherwise they are cleared when you close the tab)</span>
        </label>
        <p id="onb-privacy" className="muted small">Your answers stay in this browser. They are never sent to a server. We never ask for Aadhaar, bank account or document uploads. <a href="#/mera-haq/help">Privacy details</a>.</p>
        <div className="form-actions">
          <button className="btn btn-primary btn-lg" type="submit">Show my schemes</button>
        </div>
      </form>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Progressive enrichment
// ---------------------------------------------------------------------------
function ConsentToggle() {
  const { consent, setConsent } = useApp();
  return (
    <label className="checkbox consent">
      <input type="checkbox" checked={consent.sensitive} onChange={(e) => setConsent(e.target.checked)} />
      <span>I agree to answer optional sensitive questions (income, social category, religion, disability, marital status). They are used only to check eligibility in this browser, and unticking deletes them.</span>
    </label>
  );
}

export function QuestionPanel({ fields, title = "Answer to refine your results", intro, onDone, idPrefix = "q" }) {
  const { profile, updateProfile, consent } = useApp();
  const [draft, setDraft] = useState({});
  const [errors, setErrors] = useState({});
  const [savedMsg, setSavedMsg] = useState("");
  const visible = fields.filter((f) => Engine.FIELD_META[f]);
  // The consent toggle stays visible while sensitive questions are shown, so consent can be withdrawn.
  const needsConsent = visible.some((f) => Engine.FIELD_META[f].sensitive);
  if (visible.length === 0) return null;
  const submit = (e) => {
    e.preventDefault();
    const patch = {};
    for (const f of visible) if (f in draft) patch[f] = draft[f];
    const { errors: errs } = Engine.validateProfile(patch);
    setErrors(errs);
    if (Object.keys(errs).length) { setSavedMsg(""); return; }
    updateProfile(patch);
    setDraft({});
    setSavedMsg("Answers saved. Results updated.");
    if (onDone) onDone();
  };
  return (
    <section className="panel question-panel" aria-labelledby={`${idPrefix}-title`}>
      <h2 id={`${idPrefix}-title`} className="h3">{title}</h2>
      {intro && <p className="muted">{intro}</p>}
      {needsConsent && <ConsentToggle />}
      <form onSubmit={submit} noValidate className="form-grid">
        {visible.map((f) => {
          const meta = Engine.FIELD_META[f];
          if (meta.sensitive && !consent.sensitive) return null;
          return <FieldInput key={f} field={f} idPrefix={idPrefix} value={f in draft ? draft[f] : profile[f]} error={errors[f]} onChange={(v) => setDraft({ ...draft, [f]: v })} />;
        })}
        <div className="form-actions"><button className="btn btn-primary" type="submit">Save answers</button></div>
      </form>
      <p className="sr-only" role="status" aria-live="polite">{savedMsg}</p>
      {savedMsg && <p className="success-text" aria-hidden="true">{savedMsg}</p>}
    </section>
  );
}

// ---------------------------------------------------------------------------
// My eligible schemes
// ---------------------------------------------------------------------------
const OUTCOME_GROUPS = ["LIKELY_ELIGIBLE", "POTENTIAL_MATCH", "NEEDS_MANUAL_VERIFICATION", "INSUFFICIENT_INFORMATION", "SCHEME_NOT_CURRENTLY_OPEN", "NOT_ELIGIBLE"];

export function Eligible() {
  const { results, schemeById, profile, route, navigate } = useApp();
  const showAll = route.query.all === "1";
  const relevant = useMemo(() => results.filter((r) => schemeById[r.schemeId] && Engine.isRelevantToLocation(schemeById[r.schemeId], profile.state)), [results, schemeById, profile.state]);
  const next = useMemo(() => Engine.suggestNextQuestions(relevant, 4), [relevant]);
  const top = relevant.filter((r) => r.outcome !== "NOT_ELIGIBLE");
  const shown = showAll ? relevant : top.slice(0, 20);
  return (
    <Page title="My eligible schemes" subtitle={`Results for ${profile.age ?? "?"} years · ${profile.gender ? ENUM_LABELS.gender[profile.gender] : "gender not given"} · ${profile.state ? locName(profile.state) : "State/UT not given"}. Central schemes are included.`}
      actions={<a className="btn btn-secondary" href="#/mera-haq/profile">Edit answers</a>}>
      <NeedsProfile>
        <DataGate>
          <p className="sr-only" role="status" aria-live="polite">{relevant.length} schemes evaluated.</p>
          <div className="outcome-summary" aria-label="Results by outcome">
            {OUTCOME_GROUPS.map((o) => <span key={o} className="outcome-chip"><OutcomeBadge outcome={o} /> {relevant.filter((r) => r.outcome === o).length}</span>)}
          </div>
          {next.length > 0 && (
            <QuestionPanel idPrefix="enrich" fields={next.map((n) => n.field)} title="These questions affect your results"
              intro={`Answering them can confirm or rule out ${Math.max(...next.map((n) => n.schemes))} or more schemes. Skip any you prefer not to answer.`} />
          )}
          {shown.length === 0 ? (
            <EmptyState title="No matching schemes yet" action={<a className="btn btn-secondary" href="#/mera-haq/find">Browse all schemes</a>}>
              Based on your answers, none of the {relevant.length} schemes offered in your location are a match. This dataset does not yet include every scheme.
            </EmptyState>
          ) : (
            <div className="card-grid">{shown.map((r) => <SchemeCard key={r.schemeId} scheme={schemeById[r.schemeId]} result={r} />)}</div>
          )}
          {!showAll && relevant.length > shown.length && (
            <div className="center"><button type="button" className="btn btn-secondary" onClick={() => navigate("/mera-haq/eligible", { all: "1" })}>Show all {relevant.length}, including not eligible</button></div>
          )}
        </DataGate>
      </NeedsProfile>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Find schemes: search, filters, pagination (state kept in URL query)
// ---------------------------------------------------------------------------
export function FindSchemes() {
  const { data, route, navigate, resultById, profile, onboarded } = useApp();
  const q = route.query;
  const set = (patch) => navigate("/mera-haq/find", { ...q, page: undefined, ...patch }, { replace: true });
  const [text, setText] = useState(q.q || "");
  useEffect(() => setText(q.q || ""), [q.q]);
  useEffect(() => {
    const t = setTimeout(() => { if ((q.q || "") !== text) set({ q: text || undefined }); }, 250);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const needle = (q.q || "").trim().toLowerCase();
    return data.schemes.filter((s) => {
      if (q.scope !== "all" && profile.state && !Engine.isRelevantToLocation(s, profile.state)) return false;
      if (q.level && s.level !== q.level) return false;
      if (q.cat && s.category !== q.cat) return false;
      if (q.ver && s.verification.status !== q.ver) return false;
      if (q.outcome && (!resultById[s.id] || resultById[s.id].outcome !== q.outcome)) return false;
      if (needle) {
        const hay = [s.name, ...(s.altNames || []), s.description, s.department, s.ministry, CATEGORY_LABELS[s.category]].filter(Boolean).join(" ").toLowerCase();
        if (!needle.split(/\s+/).every((w) => hay.includes(w))) return false;
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [data.schemes, q, profile.state, resultById]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, parseInt(q.page || "1", 10) || 1), pages);
  const slice = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const cats = [...new Set(data.schemes.map((s) => s.category))].sort();

  return (
    <Page title="Find schemes" subtitle="Search Central and State/UT schemes. Every record links to its official sources.">
      <DataGate>
        <form className="filters panel" role="search" onSubmit={(e) => e.preventDefault()} aria-label="Search and filter schemes">
          <div className="field grow">
            <label htmlFor="find-q">Search</label>
            <input id="find-q" type="search" value={text} maxLength={100} onChange={(e) => setText(e.target.value)} placeholder="e.g. scholarship, pension, OBC, hostel" />
          </div>
          <div className="field">
            <label htmlFor="find-cat">Category</label>
            <select id="find-cat" value={q.cat || ""} onChange={(e) => set({ cat: e.target.value || undefined })}>
              <option value="">All categories</option>
              {cats.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="find-level">Government</label>
            <select id="find-level" value={q.level || ""} onChange={(e) => set({ level: e.target.value || undefined })}>
              <option value="">Central and State/UT</option>
              <option value="CENTRAL">Central</option>
              <option value="STATE">State</option>
              <option value="UNION_TERRITORY">Union Territory</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="find-ver">Verification</label>
            <select id="find-ver" value={q.ver || ""} onChange={(e) => set({ ver: e.target.value || undefined })}>
              <option value="">Any status</option>
              {["VERIFIED", "PARTIALLY_VERIFIED", "NEEDS_REVIEW"].map((v) => <option key={v} value={v}>{v.replace("_", " ").toLowerCase()}</option>)}
            </select>
          </div>
          {onboarded && (
            <div className="field">
              <label htmlFor="find-outcome">My result</label>
              <select id="find-outcome" value={q.outcome || ""} onChange={(e) => set({ outcome: e.target.value || undefined })}>
                <option value="">Any result</option>
                {OUTCOME_GROUPS.map((o) => <option key={o} value={o}>{OUTCOME_UI[o].label}</option>)}
              </select>
            </div>
          )}
          {profile.state && (
            <label className="checkbox">
              <input type="checkbox" checked={q.scope === "all"} onChange={(e) => set({ scope: e.target.checked ? "all" : undefined })} />
              <span>Include schemes of other States/UTs (you selected {locName(profile.state)})</span>
            </label>
          )}
        </form>
        <p className="results-count" role="status" aria-live="polite">{filtered.length} scheme{filtered.length === 1 ? "" : "s"} found{filtered.length > PAGE_SIZE ? ` · page ${page} of ${pages}` : ""}</p>
        {slice.length === 0 ? (
          <EmptyState title="No schemes match these filters" action={<button type="button" className="btn btn-secondary" onClick={() => navigate("/mera-haq/find", {}, { replace: true })}>Clear all filters</button>}>
            Try a shorter search term or remove a filter.
          </EmptyState>
        ) : (
          <div className="card-grid">{slice.map((s) => <SchemeCard key={s.id} scheme={s} result={resultById[s.id]} showOutcome={onboarded} />)}</div>
        )}
        {pages > 1 && (
          <nav className="pagination" aria-label="Pagination">
            <button type="button" className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => navigate("/mera-haq/find", { ...q, page: String(page - 1) })}>Previous</button>
            <span aria-current="page">Page {page} of {pages}</span>
            <button type="button" className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => navigate("/mera-haq/find", { ...q, page: String(page + 1) })}>Next</button>
          </nav>
        )}
      </DataGate>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Scheme detail
// ---------------------------------------------------------------------------
function Evidence({ ev, scheme }) {
  if (!ev) return null;
  const src = scheme.sources[ev.source || 0];
  return (
    <details className="evidence">
      <summary>Source text</summary>
      <blockquote>{ev.quote}</blockquote>
      {src && <p className="small muted">From <a href={src.url} target="_blank" rel="noopener noreferrer">{src.title}</a> ({src.publisher}){ev.verified ? " · quote found in the captured source" : " · quote NOT found in the latest capture"}</p>}
    </details>
  );
}

function CriteriaList({ title, items, scheme, tone, empty }) {
  const byId = Object.fromEntries(scheme.criteria.map((c) => [c.id, c]));
  return (
    <div className={`criteria criteria-${tone}`}>
      <h3 className="h4">{title} ({items.length})</h3>
      {items.length === 0 ? <p className="muted small">{empty}</p> : (
        <ul>
          {items.map((i) => (
            <li key={i.id}>
              <span>{i.label}</span>
              {i.id === "_jurisdiction" ? <span className="small muted"> (from scheme's State/UT)</span> : <Evidence ev={(byId[i.id] || {}).evidence} scheme={scheme} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function SchemeDetail({ id }) {
  const { schemeById, resultById, data, saved, toggleSave, onboarded } = useApp();
  const [handoff, setHandoff] = useState(null);
  if (data.status !== "ready") return <Page title="Loading scheme…"><DataGate>{null}</DataGate></Page>;
  const scheme = schemeById[id];
  if (!scheme) return <NotFound what="scheme" />;
  const r = resultById[id];
  const v = scheme.verification;
  const isSaved = saved.includes(id);
  const app = scheme.applicationUrl && Engine.officialUrlInfo(scheme.applicationUrl);
  const info = scheme.infoUrl && Engine.officialUrlInfo(scheme.infoUrl);
  return (
    <Page title={scheme.name} subtitle={[scheme.department, scheme.ministry && scheme.ministry !== scheme.department ? scheme.ministry : null].filter(Boolean).join(" · ") || null}
      actions={<button type="button" className={`btn ${isSaved ? "btn-secondary" : "btn-primary"}`} aria-pressed={isSaved} onClick={() => toggleSave(id)}>{isSaved ? "★ Saved" : "☆ Save scheme"}</button>}>
      <nav className="breadcrumbs" aria-label="Breadcrumb"><a href="#/mera-haq/find">Find schemes</a> › <span aria-current="page">{scheme.name}</span></nav>
      <div className="badge-row">
        <LevelBadge scheme={scheme} />
        <Badge tone="outline">{CATEGORY_LABELS[scheme.category] || scheme.category}</Badge>
        <VerificationBadge status={v.status} />
      </div>
      {v.status === "NEEDS_REVIEW" && <Notice tone="warn" title="This record needs review">Details may be incomplete or out of date. Confirm everything on the official source before acting. {v.warnings.map((w, i) => <span key={i}> {w}</span>)}</Notice>}
      {v.status === "PARTIALLY_VERIFIED" && <Notice tone="info" title="Partially verified">Every quoted rule was found in the official source, but {scheme.provenance && scheme.provenance.method === "AUTO_STRUCTURED_PAGE" ? "the record was extracted automatically and has not been reviewed field by field" : "some notes are still open"}. {v.warnings.filter((w) => !w.startsWith("no ")).map((w, i) => <span key={i}> {w}</span>)}</Notice>}
      {scheme.staleSince && <Notice tone="warn">The latest refresh of this source failed. Showing the last verified version (kept since {formatDate(scheme.staleSince)}).</Notice>}

      <div className="detail-grid">
        <div className="detail-main">
          {scheme.description && <section className="panel"><h2 className="h3">About the scheme</h2><p>{scheme.description}</p></section>}

          <section className="panel" aria-labelledby="elig-h">
            <h2 id="elig-h" className="h3">Your eligibility</h2>
            {!onboarded ? (
              <p>Answer <a href="#/mera-haq/start">three quick questions</a> to check your eligibility. The published conditions are listed below.</p>
            ) : r && (
              <>
                <div className="badge-row"><OutcomeBadge outcome={r.outcome} />{r.availability === "CLOSED" && <Badge tone="muted">Application window closed</Badge>}</div>
                <p className="explanation" aria-live="polite">{r.explanation}</p>
                <div className="criteria-grid">
                  <CriteriaList title="Conditions you meet" items={r.passed} scheme={scheme} tone="pass" empty="None confirmed yet." />
                  <CriteriaList title="Conditions not met" items={r.failed} scheme={scheme} tone="fail" empty="None." />
                  <CriteriaList title="We need more information" items={r.unknown} scheme={scheme} tone="unknown" empty="Nothing missing." />
                  <CriteriaList title="Confirm these yourself" items={r.manualChecks} scheme={scheme} tone="manual" empty="None." />
                </div>
              </>
            )}
            {!onboarded && <CriteriaList title="Published conditions" items={scheme.criteria.filter((c) => c.mandatory !== false).map((c) => ({ id: c.id, label: c.label }))} scheme={scheme} tone="manual" empty="No conditions captured." />}
          </section>

          {onboarded && r && r.missingFields.length > 0 && r.eligibility !== "NOT_ELIGIBLE" && (
            <QuestionPanel idPrefix="detail" fields={r.missingFields} title="Answer to check this scheme" intro="Only the questions this scheme needs are asked. Your other answers are kept." />
          )}

          <section className="panel"><h2 className="h3">Benefits</h2>
            {scheme.benefits.length === 0 ? <p className="muted">The official source does not state the benefit in a form we could capture.</p> : scheme.benefits.map((b, i) => (
              <div key={i} className="benefit">
                <p className="pre-line">{b.text}</p>
                {b.amount !== null && b.amount !== undefined && <p className="small muted">Amount stated: {formatINR(b.amount)}{b.frequency ? ` (${b.frequency.toLowerCase().replace(/_/g, " ")})` : ""}</p>}
                <Evidence ev={b.evidence} scheme={scheme} />
              </div>
            ))}
          </section>

          <section className="panel"><h2 className="h3">Required documents</h2>
            {scheme.documents.length === 0 ? <p className="muted">No document list was published in the captured source.</p> : (
              <>
                <ul className="doc-list">{scheme.documents.map((d, i) => <li key={i}>{d.name}</li>)}</ul>
                <a className="btn btn-secondary btn-sm" href={`#/mera-haq/documents?scheme=${scheme.id}`}>Open document checklist</a>
              </>
            )}
          </section>

          {(scheme.applicationProcess.length > 0 || scheme.renewal) && (
            <section className="panel"><h2 className="h3">How to apply</h2>
              <ol>{scheme.applicationProcess.map((p, i) => <li key={i}>{p}</li>)}</ol>
              {scheme.renewal && <><h3 className="h4">Renewal</h3><p className="pre-line">{scheme.renewal}</p></>}
            </section>
          )}
        </div>

        <aside className="detail-side" aria-label="Apply and sources">
          <section className="panel">
            <h2 className="h3">Apply</h2>
            <p className="small">Application deadline: {scheme.applicationWindow && scheme.applicationWindow.closes ? formatDate(scheme.applicationWindow.closes) : "not published in the captured source"}</p>
            {app && app.ok ? (
              <button type="button" className="btn btn-primary btn-block" onClick={() => setHandoff({ ...app, label: "official application portal" })}>Apply on official site</button>
            ) : info && info.ok ? (
              <>
                <p className="small muted">No verified online application link. {scheme.applicationMode === "OFFLINE" ? "This scheme is applied for offline (e.g. at a bank or office)." : ""}</p>
                <button type="button" className="btn btn-secondary btn-block" onClick={() => setHandoff({ ...info, label: "official information page" })}>Open official information page</button>
              </>
            ) : <Notice tone="warn">No verified official link is available for this scheme.</Notice>}
            {scheme.contact && <p className="small">Contact: {scheme.contact}</p>}
          </section>
          <section className="panel">
            <h2 className="h3">Official sources</h2>
            <ul className="source-list">
              {scheme.sources.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer">{s.title}</a>
                  <span className="small muted">{s.publisher} · {s.documentType.replace(/_/g, " ").toLowerCase()} · captured {formatDate(s.retrievedAt) || "n/a"}</span>
                </li>
              ))}
            </ul>
            <p className="small muted">Checked {formatDate(v.checkedAt)}: {v.quotesFound} of {v.quotesTotal} quoted statements found in the source text.{scheme.governmentOrderRef ? ` Reference: ${scheme.governmentOrderRef}.` : ""}</p>
          </section>
        </aside>
      </div>
      {handoff && <HandoffDialog target={handoff} scheme={scheme} onClose={() => setHandoff(null)} />}
    </Page>
  );
}

function HandoffDialog({ target, scheme, onClose }) {
  const go = () => {
    const w = window.open(target.href, "_blank", "noopener,noreferrer");
    if (w) w.opener = null;
    onClose();
  };
  return (
    <Dialog title="You are leaving Mera Haq" onClose={onClose}
      footer={<><button type="button" className="btn btn-secondary" onClick={onClose}>Stay here</button><button type="button" className="btn btn-primary" onClick={go}>Continue to {target.host}</button></>}>
      <p>You are going to the {target.label} for <strong>{scheme.name}</strong>:</p>
      <p className="handoff-host"><code>{target.href}</code></p>
      <ul className="small">
        <li>Mera Haq does <strong>not</strong> submit applications or share your answers with this website.</li>
        <li>You apply directly on the official portal, which may ask you to register or log in.</li>
        <li>Never pay anyone to apply for a government scheme on your behalf.</li>
      </ul>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Saved schemes
// ---------------------------------------------------------------------------
export function Saved() {
  const { saved, schemeById, resultById, onboarded, data, toggleSave } = useApp();
  return (
    <Page title="Saved schemes" subtitle="Schemes you saved. They are kept in this browser only.">
      <DataGate>
        {saved.length === 0 ? (
          <EmptyState title="No saved schemes yet" action={<a className="btn btn-primary" href="#/mera-haq/find">Find schemes</a>}>Use “Save” on any scheme to keep it here.</EmptyState>
        ) : (
          <div className="card-grid">
            {saved.map((id) => schemeById[id] ? <SchemeCard key={id} scheme={schemeById[id]} result={resultById[id]} showOutcome={onboarded} /> : (
              <article key={id} className="scheme-card"><h3 className="scheme-card-title">Scheme no longer in dataset</h3><p className="muted small">The saved scheme “{id}” is no longer published.</p>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => toggleSave(id)}>Remove</button></article>
            ))}
          </div>
        )}
        {data.status === "ready" && saved.length > 0 && <p className="center"><a href="#/mera-haq/documents">Open the documents checklist for saved schemes</a></p>}
      </DataGate>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
const PROFILE_GROUPS = [
  ["Basics", ["age", "gender", "state", "domicileState", "residence"]],
  ["Education & work", ["educationLevel", "studentLevel", "employmentStatus", "occupation", "isIncomeTaxPayer"]],
  ["Sensitive (optional)", ["annualFamilyIncome", "socialCategory", "religion", "disability", "disabilityPercent", "maritalStatus"]],
];

export function Profile() {
  const { profile, updateProfile, consent, onboarded, completeOnboarding, navigate, remember, setRemember } = useApp();
  const [draft, setDraft] = useState(profile);
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  useEffect(() => setDraft(profile), [profile]);
  const submit = (e) => {
    e.preventDefault();
    const { profile: valid, errors: errs } = Engine.validateProfile(draft);
    if (valid.age === null && !errs.age) errs.age = "Enter your age.";
    if (valid.state === null && !errs.state) errs.state = "Choose your State or Union Territory.";
    setErrors(errs);
    if (Object.keys(errs).length) { setMsg(""); const el = document.getElementById(`prof-${Object.keys(errs)[0]}`); if (el) el.focus(); return; }
    updateProfile(valid);
    if (!onboarded) completeOnboarding();
    setMsg("Profile saved. Your results have been recalculated.");
  };
  return (
    <Page title="My profile" subtitle="Only age and State/UT are required. Answer the rest only if you want more precise results.">
      <form className="panel form" onSubmit={submit} noValidate>
        {Object.keys(errors).length > 0 && <div className="notice notice-danger" role="alert">Please correct the highlighted fields.</div>}
        {PROFILE_GROUPS.map(([title, fields]) => (
          <fieldset key={title} className="fieldset">
            <legend>{title}</legend>
            {title.startsWith("Sensitive") && <ConsentToggle />}
            <div className="form-grid">
              {fields.map((f) => {
                if (Engine.FIELD_META[f].sensitive && !consent.sensitive) return null;
                if (f === "disabilityPercent" && draft.disability !== true && draft.disability !== "true") return null;
                return <FieldInput key={f} field={f} idPrefix="prof" required={f === "age" || f === "state"} value={draft[f]} error={errors[f]} onChange={(v) => setDraft({ ...draft, [f]: v })} />;
              })}
            </div>
          </fieldset>
        ))}
        <div className="field">
          <label htmlFor="prof-name">Display name <span className="field-tag">Optional</span></label>
          <input id="prof-name" type="text" maxLength={60} value={draft.displayName || ""} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} />
        </div>
        <label className="checkbox"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>Remember my answers on this device</span></label>
        <div className="form-actions">
          <button className="btn btn-primary" type="submit">Save profile</button>
          <button className="btn btn-secondary" type="button" onClick={() => navigate("/mera-haq/eligible")}>View results</button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{msg}</p>
        {msg && <p className="success-text" aria-hidden="true">{msg}</p>}
      </form>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Documents checklist
// ---------------------------------------------------------------------------
export function Documents() {
  const { saved, schemeById, checklist, toggleDoc, route } = useApp();
  const focus = route.query.scheme;
  const ids = focus ? [focus] : saved;
  return (
    <Page title="Documents checklist" subtitle="Tick the documents you already have. Nothing is uploaded, and the ticks are stored only in this browser.">
      <DataGate>
        {focus && !schemeById[focus] ? <NotFound what="scheme" inline /> : ids.length === 0 ? (
          <EmptyState title="No schemes selected" action={<a className="btn btn-primary" href="#/mera-haq/find">Find schemes</a>}>Save schemes to build a combined checklist, or open the checklist from a scheme page.</EmptyState>
        ) : ids.filter((id) => schemeById[id]).map((id) => {
          const s = schemeById[id];
          const have = checklist[id] || {};
          const done = s.documents.filter((_, i) => have[i]).length;
          return (
            <section key={id} className="panel" aria-labelledby={`doc-${id}`}>
              <div className="panel-head"><h2 id={`doc-${id}`} className="h3"><a href={`#/mera-haq/scheme/${id}`}>{s.name}</a></h2><span className="muted small">{done} / {s.documents.length} ready</span></div>
              {s.documents.length === 0 ? <p className="muted">The official source does not publish a document list. Check the official page.</p> : (
                <ul className="checklist">
                  {s.documents.map((d, i) => (
                    <li key={i}><label className="checkbox"><input type="checkbox" checked={!!have[i]} onChange={() => toggleDoc(id, i)} /><span>{d.name}</span></label></li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        {focus && <p><a href="#/mera-haq/documents">Show checklist for all saved schemes</a></p>}
      </DataGate>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Government resources & data transparency
// ---------------------------------------------------------------------------
const PORTALS = [
  ["myScheme (national scheme search)", "https://www.myscheme.gov.in/", "Digital India Corporation, MeitY"],
  ["National Scholarship Portal", "https://scholarships.gov.in/", "Ministry of Electronics & IT / NeGD"],
  ["UMANG", "https://web.umang.gov.in/", "NeGD, MeitY"],
  ["MahaDBT 2.0 (Maharashtra)", "https://mahadbt2.maharashtra.gov.in/", "Government of Maharashtra"],
  ["Jan Samarth (credit-linked schemes)", "https://www.jansamarth.in/", "Department of Financial Services"],
  ["DigiLocker", "https://www.digilocker.gov.in/", "MeitY"],
];

export function Resources() {
  const { data } = useApp();
  const byLoc = useMemo(() => {
    const m = {};
    for (const s of data.schemes) for (const j of s.jurisdictions) m[j] = (m[j] || 0) + 1;
    return m;
  }, [data.schemes]);
  return (
    <Page title="Government resources" subtitle="Official portals, and an honest view of what this dataset covers.">
      <Notice tone="info">Building on this data? See the proposed <a href="#/mera-haq/developers">Open Data API</a>.</Notice>
      <section className="panel"><h2 className="h3">Official portals</h2>
        <ul className="source-list">{PORTALS.map(([n, u, p]) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer">{n}</a><span className="small muted">{p}</span></li>)}</ul>
      </section>
      <DataGate>
        <section className="panel" aria-labelledby="cov-h"><h2 id="cov-h" className="h3">Dataset coverage</h2>
          <p>{data.schemes.length} schemes, generated {formatDate(data.meta && data.meta.generatedAt)}. {byLoc.ALL || 0} Central schemes apply in every State/UT. State/UT-specific schemes are listed per location below. Zero means <strong>none have been ingested yet</strong>, not that the State/UT has no schemes.</p>
          <div className="table-wrap">
            <table>
              <caption className="sr-only">Schemes per State and Union Territory</caption>
              <thead><tr><th scope="col">State / UT</th><th scope="col">Type</th><th scope="col">State/UT schemes</th></tr></thead>
              <tbody>
                {Locations.ALL.map((l) => <tr key={l.code}><th scope="row">{l.name}</th><td>{l.type === "STATE" ? "State" : "Union Territory"}</td><td>{byLoc[l.code] || 0}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p className="small muted">Some sources could not be machine-read: myScheme prohibits scrapers in its Terms of Use, india.gov.in blocks automated access, and data.gov.in disallows crawling. See DATA_SOURCE_INVENTORY.md in the repository.</p>
        </section>
      </DataGate>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// Help, FAQs, privacy
// ---------------------------------------------------------------------------
const FAQS = [
  ["Does Mera Haq decide whether I get a scheme?", "No. Mera Haq only compares your answers with the published eligibility conditions. The implementing department decides after you apply on the official portal."],
  ["What does “Potential match” mean?", "You meet the conditions we could check, but at least one condition depends on information you have not given yet, so eligibility cannot be confirmed."],
  ["What does “Check on official source” mean?", "Either the scheme's conditions cannot be checked automatically, or the data record still needs review. Read the official page before applying."],
  ["Where does the data come from?", "Only from official government websites. Every eligibility rule shows the exact sentence it came from and a link to the source. Records are re-checked against fresh copies of the source pages."],
  ["Why are there no State schemes for my State?", "So far, State-specific schemes have been ingested only from Maharashtra's MahaDBT portal. Other States/UTs show Central schemes only until their official sources are added."],
  ["Is there a fee?", "Mera Haq is free. Official portals do not charge for applying to welfare schemes. Never pay an agent to apply for you."],
];

export function Help() {
  const { deleteAllData, navigate } = useApp();
  const [confirm, setConfirm] = useState(false);
  return (
    <Page title="Help and FAQs">
      <section className="panel"><h2 className="h3">Frequently asked questions</h2>
        {FAQS.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
      </section>
      <section className="panel" aria-labelledby="privacy-h"><h2 id="privacy-h" className="h3">Privacy notice</h2>
        <ul>
          <li>Your answers are processed only in your browser and are never sent to any server.</li>
          <li>By default they are kept only until you close the tab. They stay on the device only if you tick “Remember my answers on this device”.</li>
          <li>Sensitive questions (income, social category, religion, disability, marital status) are optional, are asked only with your consent, and are deleted when you withdraw consent.</li>
          <li>We never ask for Aadhaar, bank account numbers or document uploads. The documents checklist stores only ticks.</li>
          <li>No analytics, advertising or tracking scripts are loaded.</li>
        </ul>
        <button type="button" className="btn btn-danger" onClick={() => setConfirm(true)}>Delete all my data</button>
      </section>
      {confirm && (
        <Dialog title="Delete all your data?" onClose={() => setConfirm(false)}
          footer={<><button type="button" className="btn btn-secondary" onClick={() => setConfirm(false)}>Cancel</button><button type="button" className="btn btn-danger" onClick={() => { deleteAllData(); setConfirm(false); navigate("/mera-haq"); }}>Delete</button></>}>
          <p>This removes your profile answers, saved schemes and checklist ticks from this browser. It cannot be undone.</p>
        </Dialog>
      )}
    </Page>
  );
}

// ---------------------------------------------------------------------------
// UMANG shell pages & 404
// ---------------------------------------------------------------------------
export function UmangSchemes() {
  return (
    <Page title="Schemes" subtitle="UMANG Schemes section">
      <section className="panel">
        <h2 className="h3">Mera Haq: profile-first scheme discovery</h2>
        <p>Instead of filling in a long filter form, answer three questions and see schemes offered where you live, with a clear explanation of each result.</p>
        <a className="btn btn-primary" href="#/mera-haq">Open Mera Haq</a>
      </section>
    </Page>
  );
}

export function UmangPlaceholder({ title }) {
  return (
    <Page title={title} subtitle="Part of the UMANG application shell">
      <Notice tone="info">This prototype implements only the Mera Haq section. For this service, use the official <a href="https://web.umang.gov.in/" target="_blank" rel="noopener noreferrer">UMANG portal</a>.</Notice>
      <p><a className="btn btn-primary" href="#/mera-haq">Go to Mera Haq</a></p>
    </Page>
  );
}

export function NotFound({ what = "page", inline }) {
  const body = (
    <EmptyState title={what === "scheme" ? "Scheme not found" : "Page not found"} action={<><a className="btn btn-primary" href="#/mera-haq/find">Find schemes</a><a className="btn btn-secondary" href="#/mera-haq">Mera Haq overview</a></>}>
      {what === "scheme" ? "This scheme ID is not in the current dataset. It may have been renamed or removed, or the link may be wrong." : "The address you opened does not exist."}
    </EmptyState>
  );
  return inline ? body : <Page title={what === "scheme" ? "Scheme not found" : "Page not found"}>{body}</Page>;
}

// ---------------------------------------------------------------------------
// Open Data API (proposal demo)
// ---------------------------------------------------------------------------
const API_ENDPOINTS = [
  ["GET", "meta.json", "Dataset metadata, coverage per State/UT"],
  ["GET", "schemes/index.json", "All schemes, eligibility-ready (official API: /schemes?level&jurisdiction&category&updatedSince&page)"],
  ["GET", "schemes/{id}.json", "One scheme: criteria, evidence quotes, benefits, documents, sources, version"],
  ["GET", "jurisdictions/index.json", "The 28 States and 8 UTs with scheme counts"],
  ["GET", "jurisdictions/{code}/schemes.json", "Schemes applicable in a State/UT (Central + State/UT)"],
  ["GET", "changes/index.json", "Change feed for incremental sync (official API: ?since=)"],
  ["GET", "openapi.yaml", "OpenAPI 3.1 specification of this contract"],
];

export function Developers() {
  const { data, profile } = useApp();
  const base = apiBase();
  const [meta, setMeta] = useState(null);
  const [metaErr, setMetaErr] = useState(null);
  const [code, setCode] = useState(profile.state || "MH");
  useEffect(() => {
    let live = true;
    fetch(base + "meta.json", { cache: "no-cache", credentials: "omit" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((m) => live && setMeta(m))
      .catch((e) => live && setMetaErr(e.message));
    return () => { live = false; };
  }, [base]);
  const sample = data.schemes.find((s) => s.id === "apy") || data.schemes[0];
  const sampleText = sample ? JSON.stringify({ ...sample, sources: sample.sources.slice(0, 1), verification: { status: sample.verification.status, quotesTotal: sample.verification.quotesTotal, quotesFound: sample.verification.quotesFound } }, null, 2) : "";
  const forCode = data.schemes.filter((s) => s.jurisdictions.includes("ALL") || s.jurisdictions.includes(code)).length;
  return (
    <Page title="Open Data API (proposal)" subtitle="Mera Haq reads scheme data only through this contract. If the government publishes it officially, UMANG, State portals, CSCs and civil society can build on one trusted, machine-readable source instead of scraping.">
      <Notice tone="info" title="Proof of concept">This is <strong>not</strong> an official Government of India API. The POC serves the proposed contract as static files at <code>{base}</code>. Switching to an official endpoint is a one-line configuration change.</Notice>
      <section className="panel" aria-labelledby="api-why"><h2 id="api-why" className="h3">Why an open schemes API</h2>
        <ul>
          <li><strong>Rules, not people:</strong> the API publishes eligibility rules. Citizens' answers are evaluated on their own device with the open reference engine, so no personal data is collected.</li>
          <li><strong>Traceable:</strong> every rule carries the exact sentence from the official guideline or GR it came from.</li>
          <li><strong>Versioned:</strong> a change feed lets every consumer stay current when a GR changes income limits or dates.</li>
          <li><strong>Covers every State and UT:</strong> one schema for Central and State/UT schemes, keyed by ISO 3166-2:IN codes.</li>
        </ul>
      </section>
      <section className="panel" aria-labelledby="api-ep"><h2 id="api-ep" className="h3">Endpoints</h2>
        <div className="table-wrap"><table>
          <thead><tr><th scope="col">Method</th><th scope="col">Path</th><th scope="col">Purpose</th></tr></thead>
          <tbody>{API_ENDPOINTS.map(([m, p, d]) => (
            <tr key={p}><td>{m}</td><td>{p.includes("{") ? <code>{p}</code> : <a href={base + p} target="_blank" rel="noopener noreferrer"><code>{p}</code></a>}</td><td>{d}</td></tr>
          ))}</tbody>
        </table></div>
      </section>
      <section className="panel" aria-labelledby="api-live"><h2 id="api-live" className="h3">Live from this deployment</h2>
        {metaErr ? <Notice tone="danger">Could not load meta.json ({metaErr}).</Notice> : !meta ? <LoadingList count={1} /> : (
          <ul className="plain-list">
            <li>API version <code>{meta.apiVersion}</code>, schema v{meta.schemaVersion}, generated {formatDate(meta.generatedAt)}</li>
            <li>{meta.count} schemes · {meta.coverage.ALL || 0} Central · State/UT-specific: {Object.entries(meta.coverage).filter(([k]) => k !== "ALL").map(([k, v]) => `${locName(k)} ${v}`).join(", ") || "none"}</li>
          </ul>
        )}
        <div className="form-grid">
          <FieldInput field="state" idPrefix="api" value={code} onChange={(v) => setCode(v || "MH")} />
        </div>
        <p><code>GET {base}jurisdictions/{code}/schemes.json</code>: <strong>{forCode}</strong> schemes. <a href={`${base}jurisdictions/${code}/schemes.json`} target="_blank" rel="noopener noreferrer">Open response</a></p>
      </section>
      <DataGate>
        <section className="panel" aria-labelledby="api-sample"><h2 id="api-sample" className="h3">Sample record: {sample && sample.name}</h2>
          <pre className="code-block" tabIndex={0} aria-label="Sample JSON record">{sampleText}</pre>
        </section>
      </DataGate>
    </Page>
  );
}
