"""Phase 3.1/3.2 - source discovery.

1. For every host in data/sources/domains.json marked ALLOWED, read robots.txt
   and test reachability of the home page (records HTTP / TLS / WAF findings).
2. Expand "listing" seeds (e.g. the MahaDBT scheme index) into individual
   scheme-page URLs by harvesting links that match a reviewed pattern.

Output: data/sources/discovery-report.json and data/sources/discovered-urls.json
Usage:  python scripts/pipeline/discover_sources.py [--skip-domains]
"""
from __future__ import annotations

import json
import re
import sys
import time
import urllib.parse

from safe_fetch import ROOT, FetchError, SafeFetcher, html_to_text

SEEDS = ROOT / "data" / "sources" / "seed-urls.json"
REPORT = ROOT / "data" / "sources" / "discovery-report.json"
DISCOVERED = ROOT / "data" / "sources" / "discovered-urls.json"


def check_domains(f: SafeFetcher) -> list[dict]:
    out = []
    for host, entry in sorted(f.policy.items()):
        if entry.get("status") != "ALLOWED":
            out.append({"host": host, "status": entry.get("status"), "notes": entry.get("notes")})
            continue
        row = {"host": host, "status": "ALLOWED"}
        try:
            res = f.get(f"https://{host}/")
            row.update(homeStatus=res.status, finalUrl=res.final_url, homeBytes=len(res.body))
        except FetchError as exc:
            row.update(homeStatus=None, error=exc.code)
        rp = f._robots.get(host)
        row["robotsTxt"] = "absent-or-unreadable" if rp is None else "parsed"
        row["crawlDelay"] = f.policy.get(host, {}).get("crawlDelay")
        out.append(row)
        print(row, flush=True)
    return out


def expand_listings(f: SafeFetcher, seeds: dict) -> list[dict]:
    found: dict[str, dict] = {}
    for listing in seeds.get("listings", []):
        try:
            res = f.get(listing["url"])
        except FetchError as exc:
            print("listing failed", listing["url"], exc.code, flush=True)
            continue
        html = res.body.decode("utf-8", "ignore")
        pattern = re.compile(listing["linkPattern"])
        # anchor text is captured so a reviewer can see which scheme a link is
        for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, re.S | re.I):
            href, label = m.group(1), re.sub(r"<[^>]+>", " ", m.group(2))
            if not pattern.search(href):
                continue
            absolute = urllib.parse.urljoin(res.final_url, href.replace("&amp;", "&"))
            label = " ".join(label.split())
            found.setdefault(absolute, {"url": absolute, "label": label, "listing": listing["url"], "jurisdiction": listing.get("jurisdiction")})
    return list(found.values())


def main() -> None:
    f = SafeFetcher()
    seeds = json.loads(SEEDS.read_text(encoding="utf-8"))
    report = {"generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    if "--skip-domains" not in sys.argv:
        report["domains"] = check_domains(f)
    discovered = expand_listings(f, seeds)
    report["listingExpansion"] = {"listings": len(seeds.get("listings", [])), "urlsDiscovered": len(discovered)}
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding="utf-8")
    DISCOVERED.write_text(json.dumps(discovered, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"discovered {len(discovered)} scheme URLs")


if __name__ == "__main__":
    main()
