"""Snapshot store: plain-text captures of official source pages.

Only extracted *text* is stored (never raw HTML/JS), so a snapshot can never
execute in a browser. Each snapshot records URL, final URL after redirects,
fetch timestamp and SHA-256 of the raw response body, which is what lets
validate_schemes.py prove that an evidence quote really came from the source.
"""
from __future__ import annotations

import hashlib
import io
import json
from pathlib import Path

from safe_fetch import ROOT, FetchResult, html_to_text

SNAP_DIR = ROOT / "data" / "snapshots"
MAX_PDF_PAGES = 60


def snapshot_key(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:20]


def snapshot_path(url: str) -> Path:
    return SNAP_DIR / f"{snapshot_key(url)}.json"


def pdf_to_text(body: bytes) -> tuple[str, str]:
    try:
        from pypdf import PdfReader  # optional dependency (scripts/requirements.txt)
    except ImportError:
        return "", ""
    try:
        reader = PdfReader(io.BytesIO(body), strict=False)
        pages = []
        for i, page in enumerate(reader.pages):
            if i >= MAX_PDF_PAGES:  # resource-exhaustion guard for huge/malformed PDFs
                break
            pages.append(page.extract_text() or "")
        title = (reader.metadata.title if reader.metadata and reader.metadata.title else "") or ""
        lines = [" ".join(l.split()) for l in "\n".join(pages).splitlines()]
        return str(title), "\n".join(l for l in lines if l)
    except Exception:  # malformed PDF: record as empty, never crash the run
        return "", ""


def build_snapshot(res: FetchResult) -> dict:
    if res.content_type == "application/pdf" or res.body[:5] == b"%PDF-":
        title, text = pdf_to_text(res.body)
        kind = "PDF"
    else:
        title, text = html_to_text(res.body)
        kind = "HTML"
    return {
        "url": res.url,
        "finalUrl": res.final_url,
        "status": res.status,
        "kind": kind,
        "fetchedAt": res.fetched_at,
        "contentSha256": res.sha256,
        "title": title,
        "textLength": len(text),
        "text": text,
    }


def save_snapshot(snap: dict) -> Path:
    SNAP_DIR.mkdir(parents=True, exist_ok=True)
    path = snapshot_path(snap["url"])
    path.write_text(json.dumps(snap, ensure_ascii=False, indent=1), encoding="utf-8")
    return path


def load_snapshot(url: str) -> dict | None:
    p = snapshot_path(url)
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))
