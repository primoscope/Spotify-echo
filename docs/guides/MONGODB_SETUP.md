# MongoDB Connection Setup - EchoTune AI (Sanitized)

This guide explains how to connect EchoTune AI to MongoDB Atlas using environment variables. No credentials are committed to the repository.

## Environment Variables

Set these in a local `.env` or in GitHub Actions secrets:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
MONGODB_DATABASE=echotune
```

> Never commit credentials to version control. Rotate credentials regularly.

## Quick Test

```
python scripts/database/test_mongodb_connection.py
```

## Migration

```
python scripts/database/migrate_to_mongodb.py --input data/spotify_listening_history_combined.csv --batch-size 1000 --update
```

## Schema

Documents follow this structure (abbreviated):

```json
{
  "_id": "spotify:track:..._user_YYYY-MM-DD hh:mm:ss+00:00",
  "spotify_track_uri": "spotify:track:...",
  "timestamp": "YYYY-MM-DD hh:mm:ss",
  "user": { "username": "..." },
  "track": { "name": "...", "artist": "...", "album": "...", "duration_ms": 210000 },
  "listening": { "ms_played": 180000, "skipped": false, "completion_rate": 0.857 },
  "audio_features": { "danceability": 0.7, "energy": 0.8, "valence": 0.6, "tempo": 120.0 },
  "metadata": { "explicit": false, "created_at": "timestamp" }
}
```

## Indexing

Create/verify indexes using your application's `createIndexes()` or MongoDB Compass. Typical indexes:

- `spotify_track_uri_1`
- `timestamp_-1`
- `user.username_1`
- `user.username_1_timestamp_-1`
- `user.username_1_spotify_track_uri_1`
- Audio feature fields for analytics (e.g., `audio_features.danceability_1`)

## Troubleshooting

- Ensure network access and IP allowlists in Atlas.
- Validate credentials and roles.
- Check driver and server versions.