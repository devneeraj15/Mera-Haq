"""Duplicate detection across the validated dataset.

Reports three kinds of duplicates (it never merges them automatically):
  * SAME_ID          identical scheme ids
  * SAME_NAME        same normalised name within one jurisdiction. These are
                     often the same scheme run by different directorates, which
                     MahaDBT lists separately; they stay separate records.
  * SAME_SOURCE_TEXT two records whose primary snapshots have identical
                     content hashes (the same page reached via different URLs)

Output: data/reports/duplicates.json
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from safe_fetch import ROOT  # noqa: E402

IN = ROOT / "data" / "build" / "validated.json"
OUT = ROOT / "data" / "reports" / "duplicates.json"


def norm_name(n: str) -> str:
    n = re.sub(r"\([^)]*\)", " ", n.lower())
    n = n.replace("rajarshri", "rajarshi").replace("punjabrao", "panjabrao").replace("vastigruh", "vasatigruh")
    return " ".join(re.sub(r"[^a-z0-9 ]", " ", n).split())


def find_duplicates(records: list[dict]) -> dict:
    by_id, by_name, by_hash = defaultdict(list), defaultdict(list), defaultdict(list)
    for r in records:
        by_id[r["id"]].append(r["id"])
        by_name[(tuple(r["jurisdictions"]), norm_name(r["name"]))].append({"id": r["id"], "department": r.get("department")})
        h = r["sources"][0].get("contentSha256") if r.get("sources") else None
        if h:
            by_hash[h].append(r["id"])
    return {
        "sameId": {k: v for k, v in by_id.items() if len(v) > 1},
        "sameName": [{"name": k[1], "jurisdictions": list(k[0]), "records": v} for k, v in by_name.items() if len(v) > 1],
        "sameSourceText": [v for v in by_hash.values() if len(v) > 1],
    }


def main() -> None:
    records = json.loads(IN.read_text(encoding="utf-8"))["records"]
    d = find_duplicates(records)
    OUT.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"sameId={len(d['sameId'])} sameName groups={len(d['sameName'])} sameSourceText groups={len(d['sameSourceText'])}")


if __name__ == "__main__":
    main()
