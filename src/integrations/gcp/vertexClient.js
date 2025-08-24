/* Lightweight Vertex AI helper utilities using gcloud CLI.
 * These utilities expect Workload Identity Federation auth already performed
 * in the calling workflow/container environment.
 */
const { execSync } = require('node:child_process');

function safeExec(cmd) {
  try {
    const out = execSync(cmd, { stdio: 'pipe', encoding: 'utf8' });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function listModels({ region = process.env.GCP_REGION || 'us-central1', limit = 5 } = {}) {
  const cmd = `gcloud ai models list --region ${region} --format=json --limit=${limit}`;
  const res = safeExec(cmd);
  if (!res.ok) return { error: true, message: res.error };
  try {
    return JSON.parse(res.out);
  } catch (e) {
    return { error: true, message: 'Failed to parse JSON output', raw: res.out };
  }
}

module.exports = {
  listModels
};