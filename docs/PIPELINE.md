# EchoTune AI - Personal Music Pipeline

This pipeline automates:
- CSV ingestion and merge
- MongoDB migration/upsert
- Fetching missing Spotify audio features (and metadata)
- Analytics and visualization generation
- Continuous sync via GitHub Actions (optional PR)

## Quick Start (Local)

1. Create `.env` in repo root:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/
MONGODB_DATABASE=echotune
SPOTIFY_ACCESS_TOKEN=your_access_token
```

2. Install deps:
```
pip install -r requirements.txt  # if you maintain one
pip install pandas numpy matplotlib seaborn pymongo python-dotenv pyyaml
npm install
```

3. Run pipeline locally:
```
python scripts/pipeline/run_personal_music_pipeline.py
```

Artifacts:
- Reports: `docs/reports/last_run_report.md`
- Images: `docs/reports/images/*.png`
- State: `.pipeline/state.json`

## GitHub Actions

Set Actions secrets:
- `MONGODB_URI`
- `MONGODB_DATABASE`
- `SPOTIFY_ACCESS_TOKEN` (or your own APP-based refresh tokens after extending service)

Trigger:
- Manually via "Run workflow"
- Weekly schedule (see `.github/workflows/music-pipeline.yml`)

## MCP Agent Mode

We provide a minimal task spec (see `mcp-servers/new-candidates/mongodb-mcp-server` and `mcp-servers/new-candidates/puppeteer-mcp-server`). Extend your MCP runner to:

- Step 1: Execute `scripts/database/merge_csv_data.py` with configured output
- Step 2: Execute `scripts/database/migrate_to_mongodb.py --update`
- Step 3: Execute `scripts/pipeline/enrich_audio_features.js`
- Step 4: Execute `scripts/pipeline/analyze_and_visualize.py`
- Step 5: Commit to branch and open PR

Recommended agent loop:
- Read `.pipeline/state.json` to adjust next-run scopes (e.g., only fetch features for tracks seen since last timestamp).

## Extending (Multimodal)

To render advanced visuals and presentation assets:
- Build notebooks under `notebooks/` to call OpenAI (or equivalent) multimodal APIs.
- Save outputs into `docs/reports/` and commit via Action.
- For audio generation, store synthesized snippets under `docs/reports/audio/` (ensure repo size constraints).

Security:
- Never commit secrets. Use environment variables and GitHub Actions encrypted secrets.