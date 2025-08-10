#!/usr/bin/env python3
"""
Generates analytics + visualizations from MongoDB (with CSV fallback)
Outputs:
- docs/reports/last_run_report.md
- docs/reports/images/*.png
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime
import json
import traceback

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

def load_env_dotenv(repo_root: Path):
    env_path = repo_root / ".env"
    if env_path.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_path)
        except Exception:
            pass

def connect_mongo():
    try:
        from pymongo import MongoClient
        uri = os.getenv("MONGODB_URI")
        db_name = os.getenv("MONGODB_DATABASE", "echotune")
        if not uri:
            return None, None
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        db = client[db_name]
        # ping
        client.admin.command('ping')
        return client, db
    except Exception:
        return None, None

def mongo_to_df(db, max_rows=50000):
    # Listening history minimal projection
    try:
        cursor = db["listening_history"].find(
            {},
            {
                "spotify_track_uri": 1,
                "timestamp": 1,
                "listening.ms_played": 1,
                "track.name": 1,
                "track.artist": 1,
                "audio_features": 1,
                "user.username": 1
            },
        ).limit(max_rows)
        docs = list(cursor)
        if not docs:
            return pd.DataFrame()
        df = pd.json_normalize(docs, sep="_")
        return df
    except Exception:
        return pd.DataFrame()

def csv_fallback(repo_root: Path, max_rows=100000):
    # Use ml_datasets/train_interactions.csv + track_features.csv + train_temporal.csv minimal
    try:
        inter = pd.read_csv(repo_root / "ml_datasets" / "train_interactions.csv", nrows=max_rows)
    except Exception:
        inter = pd.DataFrame()
    try:
        track = pd.read_csv(repo_root / "ml_datasets" / "track_features.csv", nrows=max_rows)
    except Exception:
        track = pd.DataFrame()
    try:
        temporal = pd.read_csv(repo_root / "ml_datasets" / "train_temporal.csv", nrows=max_rows)
    except Exception:
        temporal = pd.DataFrame()
    return inter, track, temporal

def save_plot(fig, images_dir: Path, name: str):
    out = images_dir / f"{name}.png"
    fig.tight_layout()
    fig.savefig(out, dpi=180)
    plt.close(fig)
    return str(out)

def make_visuals(df, images_dir: Path):
    outputs = []
    if df.empty:
        return outputs

    # Parse timestamp
    if "timestamp" in df.columns:
        try:
            df["timestamp"] = pd.to_datetime(df["timestamp"])
        except Exception:
            pass
    elif "ts_x" in df.columns:
        try:
            df["timestamp"] = pd.to_datetime(df["ts_x"], errors="coerce")
        except Exception:
            pass

    # Plays over time
    if "timestamp" in df.columns:
        fig, ax = plt.subplots(figsize=(10,4))
        ts = df.dropna(subset=["timestamp"])
        if not ts.empty:
            ts_group = ts.set_index("timestamp").resample("W").size()
            ts_group.plot(ax=ax, color="dodgerblue")
            ax.set_title("Listening Events Over Time (Weekly)")
            ax.set_ylabel("Plays")
            outputs.append(save_plot(fig, images_dir, "listening_over_time"))

    # Top artists
    artist_col = None
    for c in ["track_artist", "track.artist", "track_artist_1", "track.artist_1", "track_artist_name", "master_metadata_album_artist_name_x"]:
        if c in df.columns:
            artist_col = c
            break
    if not artist_col and "track.name" in df.columns and "track.artist" in df.columns:
        artist_col = "track.artist"

    if artist_col:
        fig, ax = plt.subplots(figsize=(10,5))
        df[artist_col].dropna().value_counts().head(20).sort_values().plot(kind="barh", ax=ax, color="seagreen")
        ax.set_title("Top Artists (by play events)")
        outputs.append(save_plot(fig, images_dir, "top_artists"))

    # Audio features correlation
    feats = []
    for f in ["audio_features_danceability","audio_features_energy","audio_features_valence","audio_features_tempo","audio_features_acousticness",
              "Danceability","Energy","Valence","Tempo","Acousticness"]:
        if f in df.columns:
            feats.append(f)
    if feats:
        corr_df = df[feats].apply(pd.to_numeric, errors="coerce").dropna()
        if not corr_df.empty:
            fig, ax = plt.subplots(figsize=(6,5))
            sns.heatmap(corr_df.corr(), annot=True, cmap="mako", ax=ax)
            ax.set_title("Audio Features Correlation")
            outputs.append(save_plot(fig, images_dir, "audio_features_correlation"))

    # Listening duration distribution
    dur_col = None
    for c in ["listening_ms_played", "ms_played_x", "ms_played_y"]:
        if c in df.columns:
            dur_col = c
            break
    if dur_col:
        fig, ax = plt.subplots(figsize=(8,4))
        series = pd.to_numeric(df[dur_col], errors="coerce").dropna() / 1000.0
        sns.histplot(series, bins=50, kde=True, color="orchid", ax=ax)
        ax.set_title("Listening Duration (seconds) Distribution")
        outputs.append(save_plot(fig, images_dir, "listening_duration_distribution"))

    return outputs

def write_report(report_dir: Path, images_paths, meta):
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%SZ")
    md = [
        f"# EchoTune AI - Personal Music Report",
        f"- Generated: {now} UTC",
        f"- Source: MongoDB preferred, CSV fallback if Mongo unavailable",
        "",
        "## Visuals",
    ]
    for p in images_paths:
        rel = os.path.relpath(p, report_dir)
        md.append(f"![{Path(p).stem}]({rel})")

    md.append("")
    md.append("## Summary")
    md.append("```json")
    md.append(json.dumps(meta, indent=2, default=str))
    md.append("```")

    (report_dir / "last_run_report.md").write_text("\n".join(md))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--images-dir", required=True)
    parser.add_argument("--max-rows", type=int, default=50000)
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    load_env_dotenv(repo_root)

    out_dir = Path(args.out_dir)
    images_dir = Path(args.images_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    images_dir.mkdir(parents=True, exist_ok=True)

    meta = {"source": None, "rows": 0, "notes": []}
    images = []

    client, db = connect_mongo()
    df = None
    try:
        if db is not None:
            df = mongo_to_df(db, max_rows=args.max_rows)
            if not df.empty:
                meta["source"] = "mongodb"
                meta["rows"] = len(df)
    except Exception as e:
        meta["notes"].append(f"Mongo error: {e}")

    if df is None or df.empty:
        inter, track, temporal = csv_fallback(repo_root, max_rows=args.max_rows)
        # Basic join fallback for visuals
        if not inter.empty:
            df = inter.copy()
            meta["source"] = "csv"
            meta["rows"] = len(df)
        else:
            df = pd.DataFrame()
            meta["notes"].append("No CSV fallback found")

    try:
        images = make_visuals(df, images_dir)
    except Exception as e:
        meta["notes"].append(f"Visualization error: {e}")
        traceback.print_exc()

    write_report(out_dir, images, meta)

if __name__ == "__main__":
    sys.exit(main() or 0)