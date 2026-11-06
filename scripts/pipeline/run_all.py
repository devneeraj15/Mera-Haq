"""Run the whole pipeline in order.

  python scripts/pipeline/run_all.py            # full run (network)
  python scripts/pipeline/run_all.py --offline  # rebuild from stored snapshots only
"""
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).parent
offline = "--offline" in sys.argv
steps = ([] if offline else [["discover_sources.py", "--skip-domains"], ["ingest_schemes.py"]]) + [
    ["normalize_schemes.py"], ["validate_schemes.py"], ["detect_duplicates.py"], ["sync_schemes.py"], ["generate_data_report.py"],
]
for step in steps:
    print(f"\n>>> {' '.join(step)}", flush=True)
    r = subprocess.run([sys.executable, str(HERE / step[0]), *step[1:]])
    if r.returncode != 0:
        sys.exit(f"step {step[0]} failed with exit code {r.returncode}")
