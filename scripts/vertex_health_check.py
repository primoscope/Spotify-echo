#!/usr/bin/env python3
import json, os, subprocess, sys

def run(cmd):
    try:
        return subprocess.check_output(cmd, text=True, stderr=subprocess.STDOUT)
    except subprocess.CalledProcessError as e:
        return e.output

def main():
    region = os.getenv("GCP_REGION", "us-central1")
    model_id = os.getenv("VERTEX_MODEL_ID", "")
    result = {"region": region, "model_id": model_id}

    # List models
    list_out = run(["gcloud", "ai", "models", "list", "--region", region, "--format=json", "--limit=3"])
    try:
        models = json.loads(list_out)
        result["models_listed"] = len(models)
        result["model_names"] = [m.get("displayName") for m in models]
    except Exception:
        result["models_list_error"] = list_out.strip()[:400]

    # Placeholder prediction hook (no-op if model_id absent)
    if model_id:
        result["prediction_placeholder"] = f"Prediction step ready for model {model_id}"

    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()