"""Phase 3.5 / 4 - normalisation.

Builds data/build/normalized.json from two inputs:

  1. Structured official pages (MahaDBT scheme pages). Sections are parsed
     from the snapshot text, and each eligibility line becomes one criterion
     with the line kept as its evidence quote (see rule_extract.py).
  2. Human-curated records in data/curation/*.json, for official pages
     without a stable structure. A reviewer writes the fields and the
     verbatim evidence quote for each one. Curated records replace automatic
     ones that have the same id.

Unavailable values are null. Nothing is inferred from scheme names.
"""
from __future__ import annotations

import html
import json
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from rule_extract import extract_rules, human_label  # noqa: E402
from safe_fetch import ROOT  # noqa: E402
from snapshot_store import load_snapshot  # noqa: E402

DISCOVERED = ROOT / "data" / "sources" / "discovered-urls.json"
CURATION_DIR = ROOT / "data" / "curation"
OUT = ROOT / "data" / "build" / "normalized.json"
LOCATIONS = json.loads((ROOT / "data" / "registry" / "locations.json").read_text(encoding="utf-8"))
LOC_NAMES = {l["code"]: l["name"] for l in LOCATIONS["locations"]}

MAHADBT_SECTIONS = ["Department Name", "Overview", "Benefits", "Eligibility", "Renewal Policy", "Documents Required"]
MAHADBT_END = ["Login to apply", "Related Documents"]


def slugify(s: str) -> str:
    s = re.sub(r"\([^)]*\)", lambda m: " " + m.group(0)[1:-1] + " ", s)
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:90]


def mahadbt_sections(text: str) -> dict | None:
    lines = text.split("\n")
    try:
        start = max(i for i, l in enumerate(lines) if l.strip() == "About Scheme")
    except ValueError:
        return None
    name = lines[start - 1].strip()
    body: dict[str, list[str]] = {}
    current = None
    for line in lines[start + 1:]:
        s = line.strip()
        if s in MAHADBT_END:
            break
        if s in MAHADBT_SECTIONS:
            current = s
            body.setdefault(current, [])
            continue
        if current:
            body[current].append(s)
    return {"name": name, **body}


_DEPT_SUFFIX = re.compile(r"\(([A-Z]{2,6})\)\s*$")


def from_mahadbt(item: dict) -> dict | None:
    snap = load_snapshot(item["url"])
    if not snap:
        return None
    sec = mahadbt_sections(snap["text"])
    if not sec or not sec.get("Eligibility"):
        return None
    name = sec["name"]
    dept = " ".join(sec.get("Department Name", [])) or None
    m = _DEPT_SUFFIX.search(dept or "")
    dept_code = m.group(1) if m else None
    sid = "mh-" + slugify(name)
    if dept_code and dept_code.lower() not in sid:
        sid += "-" + dept_code.lower()

    criteria, n = [], 0
    for line in sec.get("Eligibility", []):
        if not line or re.match(r"^\(?\s*as per gr", line, re.I):
            continue
        rules = extract_rules(line, "MH", "Maharashtra")
        evidence = {"source": 0, "quote": line}
        if rules:
            for r in rules:
                n += 1
                criteria.append({"id": f"c{n}", **r, "label": human_label(r, LOC_NAMES), "mandatory": True, "evidence": evidence, "extraction": "AUTO_PATTERN"})
        else:
            n += 1
            criteria.append({"id": f"c{n}", "op": "manual", "label": line, "mandatory": True, "evidence": evidence, "extraction": "VERBATIM"})

    gr = [l for l in sec.get("Eligibility", []) if re.match(r"^\(?\s*as per gr", l, re.I)]
    benefits_text = [l for l in sec.get("Benefits", []) if l]
    return {
        "id": sid,
        "name": name,
        "altNames": [],
        "description": " ".join(sec.get("Overview", [])) or None,
        "category": "EDUCATION_SCHOLARSHIP",
        "subcategory": None,
        "level": "STATE",
        "jurisdictions": ["MH"],
        "ministry": None,
        "department": dept,
        "implementingAuthority": dept,
        "targetBeneficiaries": None,
        "criteria": criteria,
        "benefits": [{"text": "\n".join(benefits_text), "amount": None, "frequency": None, "evidence": {"source": 0, "quote": benefits_text[0]} if benefits_text else None}] if benefits_text else [],
        "documents": [{"name": d, "evidence": {"source": 0, "quote": d}} for d in sec.get("Documents Required", []) if d],
        "renewal": "\n".join(l for l in sec.get("Renewal Policy", []) if l) or None,
        "applicationProcess": ["Register / log in on the MahaDBT portal and apply for this scheme ('Login to apply' on the scheme page)."],
        "applicationMode": "ONLINE",
        "applicationUrl": item["url"],
        "infoUrl": item["url"],
        "guidelinesUrl": None,
        "governmentOrderRef": gr[0].strip("() ") if gr else None,
        "applicationWindow": None,
        "contact": None,
        "status": "UNKNOWN",
        "sources": [{
            "title": f"MahaDBT scheme page: {name}",
            "publisher": "Government of Maharashtra (MahaDBT)",
            "url": item["url"],
            "documentType": "OFFICIAL_SCHEME_PAGE",
            "publicationDate": None,
            "retrievedAt": snap["fetchedAt"],
            "contentSha256": snap["contentSha256"],
            "evidenceNotes": "Eligibility, benefits and documents parsed from the 'Eligibility', 'Benefits' and 'Documents Required' sections of the official page.",
        }],
        "provenance": {"method": "AUTO_STRUCTURED_PAGE", "extractor": "mahadbt", "humanReviewed": False},
    }


OVERRIDES = CURATION_DIR / "overrides.json"


def apply_overrides(records: dict) -> None:
    if not OVERRIDES.exists():
        return
    doc = json.loads(OVERRIDES.read_text(encoding="utf-8"))
    notice = doc.get("portalNotices", {}).get("MH")
    for rec in records.values():
        if notice and rec["jurisdictions"] == ["MH"] and rec["provenance"].get("extractor") == "mahadbt":
            snap = load_snapshot(rec["sources"][0]["url"])
            if snap and notice["evidence"]["quote"] in snap["text"]:
                rec["applicationUrl"] = notice["applicationUrl"]
                rec["applicationUrlEvidence"] = {"source": 0, "quote": notice["evidence"]["quote"]}
                rec["applicationProcess"] = ["For Academic Year 2026-27, apply on the MahaDBT 2.0 portal (fresh and renewal applications). The scheme page on MahaDBT 1.0 remains the information source."]
    for ov in doc.get("overrides", []):
        hits = [r for sid, r in records.items() if sid.startswith(ov["idPrefix"])]
        for rec in hits:
            for c in ov.get("addCriteria", []):
                rec["criteria"].append({**c, "mandatory": c.get("mandatory", True), "extraction": "HUMAN_OVERRIDE"})
            if ov.get("needsReview"):
                rec["needsReview"] = True
            rec.setdefault("reviewFlags", []).extend(ov.get("reviewFlags", []))
            # An override is a targeted human correction, not a full review of
            # the record, so humanReviewed stays False (status stays PARTIAL).
            rec["provenance"]["overrideApplied"] = ov["idPrefix"]


def load_curated() -> list[dict]:
    out = []
    for path in sorted(p for p in CURATION_DIR.glob("*.json") if p.name != "overrides.json"):
        doc = json.loads(path.read_text(encoding="utf-8"))
        for rec in doc.get("schemes", []):
            rec = dict(rec)
            rec.setdefault("altNames", [])
            for k in ("subcategory", "ministry", "department", "implementingAuthority", "targetBeneficiaries", "renewal", "guidelinesUrl", "governmentOrderRef", "applicationWindow", "contact", "description"):
                rec.setdefault(k, None)
            rec.setdefault("benefits", [])
            rec.setdefault("documents", [])
            rec.setdefault("applicationProcess", [])
            rec.setdefault("status", "UNKNOWN")
            for s in rec.get("sources", []):
                snap = load_snapshot(s["url"])
                s.setdefault("publicationDate", None)
                s["retrievedAt"] = snap["fetchedAt"] if snap else None
                s["contentSha256"] = snap["contentSha256"] if snap else None
            for i, c in enumerate(rec.get("criteria", [])):
                c.setdefault("id", f"c{i + 1}")
                c.setdefault("mandatory", True)
                c.setdefault("extraction", "HUMAN_CURATED")
            rec["provenance"] = {"method": "HUMAN_CURATED", "file": path.name, "humanReviewed": True, "reviewer": doc.get("reviewer"), "reviewedAt": doc.get("reviewedAt")}
            out.append(rec)
    return out


def main() -> None:
    records: dict[str, dict] = {}
    skipped = []
    if DISCOVERED.exists():
        for item in json.loads(DISCOVERED.read_text(encoding="utf-8")):
            item["url"] = html.unescape(item["url"])
            rec = from_mahadbt(item)
            if rec is None:
                skipped.append({"url": item["url"], "label": html.unescape(item.get("label", "")), "reason": "snapshot missing or no Eligibility section"})
                continue
            base, k = rec["id"], 2
            while rec["id"] in records:  # same scheme name published by different directorates
                rec["id"] = f"{base}-{k}"
                k += 1
            records[rec["id"]] = rec
    apply_overrides(records)
    for rec in load_curated():
        records[rec["id"]] = rec
    stamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    for r in records.values():
        r["extractedAt"] = stamp
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"generatedAt": stamp, "records": list(records.values()), "skipped": skipped}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"normalized {len(records)} records, skipped {len(skipped)}")


if __name__ == "__main__":
    main()
