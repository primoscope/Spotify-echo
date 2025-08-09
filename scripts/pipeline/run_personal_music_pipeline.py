#!/usr/bin/env python3
"""
Personal Music Pipeline Orchestrator
- Merges local CSVs
- Migrates/Upserts into MongoDB
- Generates summary analytics & visuals
- Persists run state for continuous improvements
"""

import os
import sys
import subprocess
import json
import time
from datetime import datetime
from pathlib import Path
import argparse
import traceback
import shutil
import textwrap
import yaml

REPO_ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = REPO_ROOT / ".env"
CONFIG_FILE = REPO_ROOT / "config" / "pipeline.yaml"
STATE_FILE = REPO_ROOT / ".pipeline" / "state.json"
REPORTS_DIR = REPO_ROOT / "docs" / "reports"
IMAGES_DIR = REPORTS_DIR / "images"

def load_env():
    # Compatible with python-dotenv if installed, otherwise read .env manually
    if ENV_FILE.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(ENV_FILE)
        except Exception:
            # Fallback simple parse
            for line in ENV_FILE.read_text().splitlines():
                if "=" in line and not line.strip().startswith("#"):
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())

def load_config():
    if not CONFIG_FILE.exists():
        raise FileNotFoundError(f"Missing config file: {CONFIG_FILE}")
    return yaml.safe_load(CONFIG_FILE.read_text())

def ensure_dirs():
    (REPO_ROOT / ".pipeline").mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

def update_state(key, value):
    state = {}
    if STATE_FILE.exists():
        try:
            state = json.loads(STATE_FILE.read_text())
        except Exception:
            state = {}
    state[key] = value
    STATE_FILE.write_text(json.dumps(state, indent=2, default=str))

def run(cmd, cwd=None, env=None, check=True):
    print(f"\n$ {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd or str(REPO_ROOT), env=env or os.environ.copy())
    if check and result.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}")
    return result.returncode

def merge_csvs(config):
    # Uses existing scripts/database/merge_csv_data.py
    output_path = config["merge"]["output_csv"]
    args = ["python", "scripts/database/merge_csv_data.py", "--output", output_path]
    if config["merge"].get("verbose", False):
        args.append("--verbose")
    run(args)
    update_state("merged_csv", output_path)
    return output_path

def migrate_to_mongodb(config, csv_path):
    # Uses existing scripts/database/migrate_to_mongodb.py CLI
    batch = str(config["mongodb"]["batch_size"])
    update = "--update" if config["mongodb"].get("update_mode", True) else ""
    args = ["python", "scripts/database/migrate_to_mongodb.py", "--input", csv_path, "--batch-size", batch]
    if update:
        args.append(update)
    run(args)
    update_state("last_migration_csv", csv_path)

def enrich_audio_features(config):
    # Node script that uses src/spotify/audio-features.js
    chunk = str(config["audio_features"]["chunk_size"])
    max_tracks = str(config["audio_features"]["max_tracks"])
    args = [
        "node",
        "scripts/pipeline/enrich_audio_features.js",
        "--chunk-size", chunk,
        "--max-tracks", max_tracks
    ]
    if config["audio_features"].get("include_metadata", True):
        args.append("--include-metadata")
    run(args)
    update_state("audio_features_enriched_at", datetime.utcnow().isoformat())

def analyze_and_visualize(config):
    # Generate analytics & charts
    out_dir = str(REPORTS_DIR)
    args = [
        "python",
        "scripts/pipeline/analyze_and_visualize.py",
        "--out-dir", out_dir,
        "--images-dir", str(IMAGES_DIR),
        "--max-rows", str(config["analysis"]["max_rows"])
    ]
    run(args)
    update_state("last_report_dir", out_dir)

def write_summary_report():
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
    summary = textwrap.dedent(f"""
    # EchoTune AI - Personal Music Pipeline (Last Run)
    - Timestamp (UTC): {now}
    - State file: {STATE_FILE}
    - Reports: {REPORTS_DIR}
    """).strip()
    (REPORTS_DIR / "last_run_summary.md").write_text(summary)

def main():
    parser = argparse.ArgumentParser(description="Run personal music pipeline end-to-end")
    parser.add_argument("--steps", nargs="*", default=["merge", "migrate", "enrich", "analyze"],
                        help="Subset of steps to run: merge migrate enrich analyze")
    parser.add_argument("--skip-env", action="store_true")
    args = parser.parse_args()

    ensure_dirs()
    if not args.skip_env:
        load_env()
    config = load_config()

    # Basic env checks
    if "MONGODB_URI" not in os.environ:
        print("ERROR: MONGODB_URI not found in env; create .env or set Actions secrets.")
        sys.exit(1)
    if "MONGODB_DATABASE" not in os.environ:
        print("WARN: MONGODB_DATABASE not set, falling back to default in code if applicable.")

    start = time.time()
    try:
        merged_csv = None
        if "merge" in args.steps:
            merged_csv = merge_csvs(config)
        if "migrate" in args.steps:
            migrate_to_mongodb(config, merged_csv or config["merge"]["output_csv"])
        if "enrich" in args.steps:
            enrich_audio_features(config)
        if "analyze" in args.steps:
            analyze_and_visualize(config)

        write_summary_report()
        elapsed = round(time.time() - start, 2)
        update_state("last_run_seconds", elapsed)
        print(f"\n✅ Pipeline complete in {elapsed}s")
        return 0
    except Exception as e:
        print("❌ Pipeline error:", str(e))
        traceback.print_exc()
        update_state("last_error", {"message": str(e), "time": datetime.utcnow().isoformat()})
        return 1

if __name__ == "__main__":
    sys.exit(main())