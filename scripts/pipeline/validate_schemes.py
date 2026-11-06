"""Phase 3.6 / 3.7 / 4 - validation and verification status.

Input : data/build/normalized.json
Output: data/build/validated.json, data/reports/validation-report.json,
        data/reports/review-queue.json

Every evidence quote is re-matched (whitespace/quote-insensitive) against the
text snapshot of the source it cites. A government domain alone never makes
a record VERIFIED: the quote has to be on the page.

Status rules (first match wins):
  INACTIVE            record.status == "INACTIVE"
  SOURCE_UNAVAILABLE  primary source has no snapshot
  NEEDS_REVIEW        any quote missing, validation error, contradiction, needsReview
  OUTDATED            primary snapshot older than STALE_DAYS
  VERIFIED            human-reviewed, all quotes found, >=1 benefit, no reviewFlags
  PARTIALLY_VERIFIED  otherwise (e.g. auto-extracted, or open reviewFlags)
"""
from __future__ import annotations

import json
import re
import sys
import urllib.parse
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from safe_fetch import ROOT, normalize_for_match  # noqa: E402
from snapshot_store import load_snapshot  # noqa: E402

IN = ROOT / "data" / "build" / "normalized.json"
OUT = ROOT / "data" / "build" / "validated.json"
REPORT = ROOT / "data" / "reports" / "validation-report.json"
QUEUE = ROOT / "data" / "reports" / "review-queue.json"
LOC = json.loads((ROOT / "data" / "registry" / "locations.json").read_text(encoding="utf-8"))
LOC_TYPE = {l["code"]: l["type"] for l in LOC["locations"]}

STALE_DAYS = 180
LEVELS = {"CENTRAL", "STATE", "UNION_TERRITORY"}
CATEGORIES = {"EDUCATION_SCHOLARSHIP", "SOCIAL_WELFARE", "PENSION", "INSURANCE", "FINANCIAL_INCLUSION", "ENTREPRENEURSHIP", "SKILL_DEVELOPMENT", "HEALTH", "HOUSING", "AGRICULTURE", "EMPLOYMENT", "WOMEN_CHILD", "DISABILITY", "OTHER"}
FIELDS = {"age", "gender", "state", "domicileState", "annualFamilyIncome", "socialCategory", "religion", "disability", "disabilityPercent", "educationLevel", "studentLevel", "employmentStatus", "occupation", "residence", "maritalStatus", "isIncomeTaxPayer"}
OPS = {"gte", "lte", "gt", "lt", "eq", "in", "notIn", "isTrue", "isFalse", "eduGte", "manual"}
OFFICIAL_SUFFIXES = (".gov.in", ".nic.in")
REVIEWED_HOSTS = {"maandhan.in", "www.mudra.org.in", "mudra.org.in", "www.standupmitra.in", "pmvidyalaxmi.co.in", "www.pmvidyalaxmi.co.in"}
NUMERIC_FIELDS = {"age", "annualFamilyIncome", "disabilityPercent"}


def url_problem(url: str | None) -> str | None:
    if url is None:
        return None
    try:
        u = urllib.parse.urlsplit(url)
    except ValueError:
        return "malformed URL"
    if u.scheme != "https":
        return "URL is not https"
    host = (u.hostname or "").lower()
    if not (host.endswith(OFFICIAL_SUFFIXES) or host in REVIEWED_HOSTS):
        return f"host {host} is not an official / reviewed government domain"
    return None


def iso_date_ok(s: str | None) -> bool:
    if s is None:
        return True
    try:
        date.fromisoformat(s)
        return True
    except (TypeError, ValueError):
        return False


def quote_found(quote: str, text_norm: str) -> bool:
    return normalize_for_match(quote) in text_norm


def iter_criteria(criteria):
    for c in criteria:
        yield c
        for sub in c.get("anyOf", []) or []:
            yield sub


def contradictions(criteria) -> list[str]:
    bounds: dict[str, list[float]] = {}
    out = []
    for c in criteria:
        if c.get("mandatory") is False or c.get("field") not in NUMERIC_FIELDS:
            continue
        lo, hi = bounds.setdefault(c["field"], [float("-inf"), float("inf")])
        if c["op"] in ("gte", "gt"):
            lo = max(lo, c["value"])
        if c["op"] in ("lte", "lt"):
            hi = min(hi, c["value"])
        bounds[c["field"]] = [lo, hi]
        if lo > hi:
            out.append(f"{c['field']}: lower bound {lo} exceeds upper bound {hi}")
    return out


def validate(rec: dict, now: datetime) -> dict:
    errors, warnings = [], []
    for k in ("id", "name", "level", "category", "jurisdictions", "sources"):
        if not rec.get(k):
            errors.append(f"missing mandatory field '{k}'")
    if rec.get("level") not in LEVELS:
        errors.append(f"invalid level {rec.get('level')!r}")
    if rec.get("category") not in CATEGORIES:
        errors.append(f"invalid category {rec.get('category')!r}")
    j = rec.get("jurisdictions") or []
    if rec.get("level") == "CENTRAL" and j != ["ALL"]:
        errors.append("CENTRAL scheme must have jurisdictions ['ALL']")
    if rec.get("level") in ("STATE", "UNION_TERRITORY"):
        want = "STATE" if rec["level"] == "STATE" else "UNION_TERRITORY"
        for code in j:
            if LOC_TYPE.get(code) != want:
                errors.append(f"jurisdiction {code!r} is not a {want}")
    for key in ("applicationUrl", "infoUrl", "guidelinesUrl"):
        p = url_problem(rec.get(key))
        if p:
            errors.append(f"{key}: {p}")
    if not rec.get("applicationUrl") and not rec.get("infoUrl"):
        errors.append("no official application or information URL")
    w = rec.get("applicationWindow") or {}
    for k in ("opens", "closes"):
        if not iso_date_ok(w.get(k)):
            errors.append(f"applicationWindow.{k} is not an ISO date")
    if w.get("closes") and iso_date_ok(w.get("closes")) and w["closes"] < now.date().isoformat():
        warnings.append(f"application window closed on {w['closes']}")
    for b in rec.get("benefits", []):
        if b.get("amount") is not None and (not isinstance(b["amount"], (int, float)) or b["amount"] < 0):
            errors.append(f"benefit amount invalid: {b.get('amount')!r}")
    for c in iter_criteria(rec.get("criteria", [])):
        if c.get("anyOf"):
            continue
        if c.get("op") not in OPS:
            errors.append(f"criterion {c.get('id')}: unsupported op {c.get('op')!r}")
        if c.get("op") != "manual" and c.get("field") not in FIELDS:
            errors.append(f"criterion {c.get('id')}: unknown field {c.get('field')!r}")
        if c.get("field") in NUMERIC_FIELDS and c.get("op") in ("gte", "lte", "gt", "lt") and (not isinstance(c.get("value"), (int, float)) or c["value"] < 0):
            errors.append(f"criterion {c.get('id')}: numeric bound invalid")
    for s in rec.get("sources", []):
        p = url_problem(s.get("url"))
        if p:
            errors.append(f"source {s.get('url')}: {p}")
    contra = contradictions(rec.get("criteria", []))

    # --- evidence verification --------------------------------------------
    texts = {}
    for i, s in enumerate(rec.get("sources", [])):
        snap = load_snapshot(s["url"])
        texts[i] = normalize_for_match(snap["text"]) if snap else None
        s["available"] = snap is not None
    quotes_total = quotes_found = 0
    missing_quotes = []

    def check(ev, where):
        nonlocal quotes_total, quotes_found
        if not ev:
            missing_quotes.append(f"{where}: no evidence")
            return
        quotes_total += 1
        t = texts.get(ev.get("source", 0))
        if t is not None and quote_found(ev["quote"], t):
            quotes_found += 1
            ev["verified"] = True
        else:
            ev["verified"] = False
            missing_quotes.append(f"{where}: quote not found in source {ev.get('source', 0)}")

    for c in rec.get("criteria", []):
        check(c.get("evidence"), f"criterion {c.get('id')}")
    for i, b in enumerate(rec.get("benefits", [])):
        check(b.get("evidence"), f"benefit {i}")
    for i, d in enumerate(rec.get("documents", [])):
        check(d.get("evidence"), f"document {i}")
    if rec.get("applicationWindow"):
        check(rec["applicationWindow"].get("evidence"), "applicationWindow")

    primary = load_snapshot(rec["sources"][0]["url"]) if rec.get("sources") else None
    age_days = None
    if primary:
        fetched = datetime.strptime(primary["fetchedAt"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
        age_days = (now - fetched).days

    machine = [c for c in rec.get("criteria", []) if c.get("op") != "manual"]
    if not machine:
        warnings.append("no machine-checkable criteria: users must confirm eligibility on the official source")
    if not rec.get("benefits"):
        warnings.append("no benefit text extracted")
    if not rec.get("documents"):
        warnings.append("no required-documents list in source")

    if rec.get("status") == "INACTIVE":
        status = "INACTIVE"
    elif primary is None:
        status = "SOURCE_UNAVAILABLE"
    elif errors or missing_quotes or contra or rec.get("needsReview"):
        status = "NEEDS_REVIEW"
    elif age_days is not None and age_days > STALE_DAYS:
        status = "OUTDATED"
    elif rec["provenance"].get("humanReviewed") and rec.get("benefits") and not rec.get("reviewFlags"):
        status = "VERIFIED"
    else:
        status = "PARTIALLY_VERIFIED"

    rec["verification"] = {
        "status": status,
        "checkedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "quotesTotal": quotes_total,
        "quotesFound": quotes_found,
        "snapshotAgeDays": age_days,
        "errors": errors,
        "warnings": warnings + list(rec.get("reviewFlags", [])),
        "missingEvidence": missing_quotes,
        "contradictions": contra,
    }
    rec["lastVerified"] = now.date().isoformat() if status in ("VERIFIED", "PARTIALLY_VERIFIED") else None
    return rec


def main() -> None:
    now = datetime.now(timezone.utc)
    data = json.loads(IN.read_text(encoding="utf-8"))
    records = [validate(r, now) for r in data["records"]]
    ids = [r["id"] for r in records]
    dup_ids = sorted({i for i in ids if ids.count(i) > 1})
    for r in records:
        if r["id"] in dup_ids:
            r["verification"]["errors"].append("duplicate scheme id")
            r["verification"]["status"] = "NEEDS_REVIEW"
    by_status: dict[str, int] = {}
    for r in records:
        by_status[r["verification"]["status"]] = by_status.get(r["verification"]["status"], 0) + 1
    queue = [{"id": r["id"], "name": r["name"], "status": r["verification"]["status"], "errors": r["verification"]["errors"], "missingEvidence": r["verification"]["missingEvidence"], "warnings": r["verification"]["warnings"], "contradictions": r["verification"]["contradictions"]}
             for r in records if r["verification"]["status"] in ("NEEDS_REVIEW", "SOURCE_UNAVAILABLE", "OUTDATED")]
    OUT.write_text(json.dumps({"generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "records": records}, ensure_ascii=False, indent=1), encoding="utf-8")
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps({"generatedAt": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "total": len(records), "byStatus": by_status, "duplicateIds": dup_ids,
                                  "records": [{"id": r["id"], **{k: r["verification"][k] for k in ("status", "quotesTotal", "quotesFound", "errors", "warnings", "missingEvidence")}} for r in records]}, ensure_ascii=False, indent=1), encoding="utf-8")
    QUEUE.write_text(json.dumps(queue, ensure_ascii=False, indent=1), encoding="utf-8")
    print("validated", len(records), by_status, "review queue:", len(queue))


if __name__ == "__main__":
    main()
