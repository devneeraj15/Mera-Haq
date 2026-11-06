import { useEffect, useRef } from "react";
import Engine from "../engine/eligibility.js";
import Locations from "../engine/locations.js";

export const OUTCOME_UI = {
  LIKELY_ELIGIBLE: { label: "Likely eligible", tone: "success", short: "Likely eligible" },
  POTENTIAL_MATCH: { label: "Potential match", tone: "info", short: "Potential" },
  NEEDS_MANUAL_VERIFICATION: { label: "Check on official source", tone: "warn", short: "Check source" },
  INSUFFICIENT_INFORMATION: { label: "More information needed", tone: "neutral", short: "Need info" },
  SCHEME_NOT_CURRENTLY_OPEN: { label: "Not currently open", tone: "muted", short: "Not open" },
  NOT_ELIGIBLE: { label: "Not eligible", tone: "danger", short: "Not eligible" },
};

export const VERIFICATION_UI = {
  VERIFIED: { label: "Verified from official source", tone: "success" },
  PARTIALLY_VERIFIED: { label: "Partially verified", tone: "info" },
  NEEDS_REVIEW: { label: "Needs review: details may be incomplete", tone: "warn" },
  OUTDATED: { label: "Outdated source", tone: "warn" },
  INACTIVE: { label: "Inactive", tone: "muted" },
  SOURCE_UNAVAILABLE: { label: "Source unavailable", tone: "danger" },
};

export const CATEGORY_LABELS = {
  EDUCATION_SCHOLARSHIP: "Education & scholarships",
  SOCIAL_WELFARE: "Social welfare",
  PENSION: "Pension",
  INSURANCE: "Insurance",
  FINANCIAL_INCLUSION: "Financial inclusion",
  ENTREPRENEURSHIP: "Entrepreneurship & credit",
  SKILL_DEVELOPMENT: "Skill development",
  HEALTH: "Health", HOUSING: "Housing", AGRICULTURE: "Agriculture", EMPLOYMENT: "Employment",
  WOMEN_CHILD: "Women & child", DISABILITY: "Disability", OTHER: "Other",
};

export const ENUM_LABELS = {
  gender: { MALE: "Male", FEMALE: "Female", TRANSGENDER: "Transgender" },
  socialCategory: { GENERAL: "General / Open", SC: "Scheduled Caste (SC)", ST: "Scheduled Tribe (ST)", OBC: "Other Backward Class (OBC)", EWS: "Economically Weaker Section (EWS)", SEBC: "SEBC", VJNT: "VJ/NT (Vimukta Jati / Nomadic Tribes)", SBC: "Special Backward Class (SBC)" },
  religion: { HINDU: "Hindu", MUSLIM: "Muslim", CHRISTIAN: "Christian", SIKH: "Sikh", BUDDHIST: "Buddhist", JAIN: "Jain", PARSI: "Parsi (Zoroastrian)", JEWISH: "Jewish", OTHER: "Other" },
  educationLevel: { NONE: "No formal education", BELOW_10: "Below Class 10", CLASS_10: "Class 10", CLASS_12: "Class 12", ITI: "ITI", DIPLOMA: "Diploma", UNDERGRADUATE: "Bachelor's degree", POSTGRADUATE: "Master's degree", DOCTORATE: "Doctorate" },
  studentLevel: { NOT_STUDENT: "Not studying", SCHOOL: "School (up to Class 10)", CLASS_11_12: "Class 11–12", ITI: "ITI", DIPLOMA: "Diploma", UNDERGRADUATE: "Undergraduate", POSTGRADUATE: "Postgraduate", PHD: "PhD" },
  employmentStatus: { STUDENT: "Student", EMPLOYED: "Employed (salaried)", SELF_EMPLOYED: "Self-employed / own business", UNEMPLOYED: "Unemployed", RETIRED: "Retired", HOMEMAKER: "Homemaker" },
  occupation: { FARMER: "Farmer", STREET_VENDOR: "Street vendor / hawker", ARTISAN_CRAFTSPERSON: "Artisan / craftsperson", UNORGANISED_WORKER: "Unorganised-sector worker", SALARIED: "Salaried employee", BUSINESS_OWNER: "Business owner", OTHER: "Other" },
  residence: { RURAL: "Rural", URBAN: "Urban" },
  maritalStatus: { UNMARRIED: "Unmarried", MARRIED: "Married", WIDOWED: "Widowed", DIVORCED: "Divorced", SEPARATED: "Separated" },
};

export const locName = (code) => Locations.locationName(code) || code;

export function formatINR(n) {
  if (n === null || n === undefined) return null;
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function formatDate(iso) {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? iso + "T00:00:00Z" : iso);
  if (isNaN(d)) return null;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

export function Badge({ tone = "neutral", children, title }) {
  return <span className={`badge badge-${tone}`} title={title}>{children}</span>;
}

export function OutcomeBadge({ outcome }) {
  const ui = OUTCOME_UI[outcome] || { label: outcome, tone: "neutral" };
  return <Badge tone={ui.tone}>{ui.label}</Badge>;
}

export function VerificationBadge({ status }) {
  const ui = VERIFICATION_UI[status] || { label: status, tone: "neutral" };
  return <Badge tone={ui.tone} title="Data verification status">{ui.label}</Badge>;
}

export function LevelBadge({ scheme }) {
  if (scheme.level === "CENTRAL") return <Badge tone="outline">Central Government</Badge>;
  return <Badge tone="outline">{scheme.level === "STATE" ? "State" : "UT"}: {scheme.jurisdictions.map(locName).join(", ")}</Badge>;
}

export function Skeleton({ lines = 3 }) {
  return (
    <div className="skeleton-card" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => <div key={i} className="skeleton-line" style={{ width: `${90 - i * 15}%` }} />)}
    </div>
  );
}

export function LoadingList({ count = 4 }) {
  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">Loading schemes…</span>
      {Array.from({ length: count }).map((_, i) => <Skeleton key={i} />)}
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <h2 className="h3">{title}</h2>
      {children && <div className="muted">{children}</div>}
      {action && <div className="empty-actions">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <h2 className="h3">{title}</h2>
      {message && <p>{message}</p>}
      {onRetry && <button type="button" className="btn btn-primary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function Notice({ tone = "info", children, title }) {
  return (
    <div className={`notice notice-${tone}`} role={tone === "danger" ? "alert" : "note"}>
      {title && <strong className="notice-title">{title}</strong>}
      <div>{children}</div>
    </div>
  );
}

/** Accessible modal dialog: focus trap, Esc to close, focus restore. */
export function Dialog({ title, onClose, children, footer }) {
  const ref = useRef(null);
  const prev = useRef(null);
  useEffect(() => {
    prev.current = document.activeElement;
    const el = ref.current;
    const focusables = () => el.querySelectorAll('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])');
    (focusables()[0] || el).focus();
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
      if (e.key === "Tab") {
        const f = Array.from(focusables());
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("modal-open");
      if (prev.current && prev.current.focus) prev.current.focus();
    };
  }, [onClose]);
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" ref={ref} tabIndex={-1}>
        <div className="dialog-header">
          <h2 id="dialog-title" className="h3">{title}</h2>
          <button type="button" className="icon-btn" aria-label="Close dialog" onClick={onClose}>×</button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>
  );
}

/** One input for any profile field, driven by FIELD_META / ENUMS. */
export function FieldInput({ field, value, onChange, error, idPrefix = "f", required }) {
  const meta = Engine.FIELD_META[field];
  const id = `${idPrefix}-${field}`;
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [meta.why ? hintId : null, error ? errId : null].filter(Boolean).join(" ") || undefined;
  const common = { id, "aria-describedby": describedBy, "aria-invalid": error ? "true" : undefined, required };
  let control;
  if (meta.type === "location") {
    control = (
      <select {...common} value={value || ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">Select State / UT</option>
        <optgroup label="States">{Locations.STATES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</optgroup>
        <optgroup label="Union Territories">{Locations.UNION_TERRITORIES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</optgroup>
      </select>
    );
  } else if (meta.type === "enum") {
    const opts = Engine.ENUMS[field];
    control = (
      <select {...common} value={value || ""} onChange={(e) => onChange(e.target.value || null)}>
        <option value="">{field === "gender" ? "Prefer not to say" : "Select"}</option>
        {opts.map((o) => <option key={o} value={o}>{(ENUM_LABELS[field] && ENUM_LABELS[field][o]) || o}</option>)}
      </select>
    );
  } else if (meta.type === "boolean") {
    control = (
      <select {...common} value={value === true ? "true" : value === false ? "false" : ""} onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}>
        <option value="">Prefer not to say</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  } else {
    control = (
      <input {...common} type="text" inputMode={meta.type === "money" ? "decimal" : "numeric"} autoComplete="off" maxLength={meta.type === "money" ? 16 : 3}
        value={value === null || value === undefined ? "" : String(value)} onChange={(e) => onChange(e.target.value)} placeholder={meta.type === "money" ? "e.g. 250000" : ""} />
    );
  }
  return (
    <div className={`field ${error ? "field-error" : ""}`}>
      <label htmlFor={id}>{meta.label}{required && <span aria-hidden="true"> *</span>}{meta.sensitive && <span className="field-tag">Sensitive · optional</span>}</label>
      {control}
      {meta.why && <p className="field-hint" id={hintId}>{meta.why}</p>}
      {error && <p className="field-error-text" id={errId} role="alert">{error}</p>}
    </div>
  );
}
