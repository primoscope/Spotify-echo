#!/usr/bin/env node
/**
 * Enrich Audio Features Pipeline
 * - Scans listening_history for track URIs
 * - Derives Spotify track IDs
 * - Fetches missing audio features (and optionally track metadata)
 * - Upserts into MongoDB via src/spotify/audio-features.js service
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../../..', '.env') });

const mongoManager = require('../../src/database/mongodb');
const SpotifyAudioFeaturesService = require('../../src/spotify/audio-features');

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = { chunkSize: 100, maxTracks: 50000, includeMetadata: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--chunk-size' && args[i + 1]) parsed.chunkSize = parseInt(args[++i], 10);
    else if (args[i] === '--max-tracks' && args[i + 1]) parsed.maxTracks = parseInt(args[++i], 10);
    else if (args[i] === '--include-metadata') parsed.includeMetadata = true;
  }
  return parsed;
}

function uriToTrackId(uri) {
  // e.g., spotify:track:6MPv1Xr0w6A4t7cxv9eMv5
  if (!uri || typeof uri !== 'string') return null;
  const parts = uri.split(':');
  return parts.length === 3 && parts[1] === 'track' ? parts[2] : null;
}

async function main() {
  const { chunkSize, maxTracks, includeMetadata } = parseArgs();
  const accessToken = process.env.SPOTIFY_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('SPOTIFY_ACCESS_TOKEN is required (or implement refresh in service/auth).');
    process.exit(1);
  }

  try {
    await mongoManager.connect();
    const db = mongoManager.getDb();
    const history = db.collection('listening_history');
    const audioFeaturesCol = db.collection('audio_features');

    // 1) Gather distinct track URIs (bounded by maxTracks)
    console.log('Collecting distinct track URIs from listening_history...');
    const distinctUris = await history.distinct('spotify_track_uri', {}, { maxTimeMS: 120000 });
    let trackIds = distinctUris
      .map(uriToTrackId)
      .filter(Boolean)
      .slice(0, maxTracks);

    console.log(`Found ${trackIds.length} candidate track IDs`);

    // 2) Filter to those missing in audio_features
    const existing = await audioFeaturesCol
      .find({ track_id: { $in: trackIds } }, { projection: { track_id: 1 } })
      .toArray();
    const haveIds = new Set(existing.map((d) => d.track_id));
    const missing = trackIds.filter((id) => !haveIds.has(id));

    console.log(`Missing audio features for ${missing.length} tracks`);

    if (missing.length === 0) {
      console.log('Nothing to enrich. Exiting.');
      await mongoManager.close();
      process.exit(0);
    }

    // 3) Fetch in batches using the existing service
    const svc = new SpotifyAudioFeaturesService();

    let processed = 0;
    while (processed < missing.length) {
      const batch = missing.slice(processed, processed + chunkSize);
      console.log(`Processing batch: ${processed}..${processed + batch.length}/${missing.length}`);
      try {
        const result = await svc.getBatchAudioFeatures(batch, accessToken, {
          batchSize: Math.min(100, batch.length),
          onProgress: (p) => {
            process.stdout.write(
              `  - Fetched ${p.processed}/${p.total} (batch=${p.currentBatch})        \r`
            );
          },
        });
        console.log(`  -> OK: +${result.results.length} features, errors: ${result.errors.length}`);
      } catch (err) {
        console.error('Batch error:', err.message);
      }
      processed += batch.length;
      await new Promise((r) => setTimeout(r, 150)); // small pacing
    }

    // Optionally enrich metadata for these tracks too
    if (includeMetadata) {
      console.log('Enriching track metadata for missing IDs...');
      try {
        await svc.getBatchTrackMetadata(missing, accessToken, { batchSize: 50 });
      } catch (err) {
        console.error('Metadata batch error:', err.message);
      }
    }

    // Done
    await mongoManager.close();
    console.log('✅ Audio feature enrichment complete');
    process.exit(0);
  } catch (e) {
    console.error('❌ Enrichment error:', e.message);
    console.error(e.stack);
    try {
      await mongoManager.close();
    } catch (_) {}
    process.exit(1);
  }
}

main();