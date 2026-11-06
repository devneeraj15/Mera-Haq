"""Phase 3.8 - ingestion: fetch every seed / discovered / cited source URL into
the snapshot store.

Incremental by default: a URL whose snapshot is younger than --max-age-days is
skipped. A failed fetch NEVER deletes or overwrites the previous snapshot; the
failure is appended to data/reports/ingest-log.json so validate_schemes.py can
mark affected records SOURCE_UNAVAILABLE / OUTDATED instead.

Usage: python scripts/pipeline/ingest_schemes.py [--max-age-days N] [--only-cited] [--limit N]
"""
from __future__ import annotations

import argparse
import html
import json
import time
from datetime import datetime, timezone

from safe_fetch import ROOT, FetchError, SafeFetcher
from snapshot_store import build_snapshot, load_snapshot, save_snapshot

SEEDS = ROOT / "data" / "sources" / "seed-urls.json"
DISCOVERED = ROOT / "data" / "sources" / "discovered-urls.json"
CURATION_DIR = ROOT / "data" / "curation"
LOG = ROOT / "data" / "reports" / "ingest-log.json"


def cited_urls() -> list[str]:
    urls = []
    for path in sorted(CURATION_DIR.glob("*.json")):
        doc = json.loads(path.read_text(encoding="utf-8"))
        for rec in doc.get("schemes", []):
            urls.extend(s["url"] for s in rec.get("sources", []))
    return urls


def all_urls(only_cited: bool) -> list[str]:
    urls = cited_urls()
    if not only_cited:
        seeds = json.loads(SEEDS.read_text(encoding="utf-8"))
        urls += seeds.get("pages", [])
        if DISCOVERED.exists():
            urls += [d["url"] for d in json.loads(DISCOVERED.read_text(encoding="utf-8"))]
    seen, ordered = set(), []
    for u in urls:
        u = html.unescape(u)
        if u not in seen:
            seen.add(u)
            ordered.append(u)
    return ordered


def is_fresh(snap: dict | None, max_age_days: float) -> bool:
    if not snap:
        return False
    fetched = datetime.strptime(snap["fetchedAt"], "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    return (datetime.now(timezone.utc) - fetched).total_seconds() < max_age_days * 86400


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-age-days", type=float, default=7)
    ap.add_argument("--only-cited", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    args = ap.parse_args()

    fetcher = SafeFetcher()
    log = {"startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "ok": [], "skippedFresh": [], "failed": [], "changed": []}
    urls = all_urls(args.only_cited)
    if args.limit:
        urls = urls[: args.limit]
    for url in urls:
        prev = load_snapshot(url)
        if is_fresh(prev, args.max_age_days):
            log["skippedFresh"].append(url)
            continue
        try:
            res = fetcher.get(url)
            snap = build_snapshot(res)
            if snap["textLength"] < 200:
                # JS-rendered shell or empty PDF: keep the previous good snapshot if any
                log["failed"].append({"url": url, "code": "INSUFFICIENT_TEXT", "textLength": snap["textLength"]})
                if prev is None:
                    save_snapshot(snap)
                continue
            if prev and prev.get("contentSha256") != snap["contentSha256"]:
                log["changed"].append(url)
            save_snapshot(snap)
            log["ok"].append(url)
            print("OK  ", snap["kind"], snap["textLength"], url, flush=True)
        except FetchError as exc:
            log["failed"].append({"url": url, "code": exc.code, "detail": str(exc)[:300]})
            print("FAIL", exc.code, url, flush=True)
    log["finishedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    LOG.parent.mkdir(parents=True, exist_ok=True)
    LOG.write_text(json.dumps(log, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"ok={len(log['ok'])} fresh={len(log['skippedFresh'])} failed={len(log['failed'])} changed={len(log['changed'])}")


if __name__ == "__main__":
    main()
