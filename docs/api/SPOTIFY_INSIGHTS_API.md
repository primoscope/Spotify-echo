# Spotify Insights API Documentation

This document describes the enhanced Spotify insights API endpoints that provide comprehensive music analytics with caching, pagination, and rate-limiting awareness.

## Base URL
```
http://localhost:3000/api/insights
```

## Authentication
All endpoints require authentication via Bearer token:
```
Authorization: Bearer <token>
```

## Rate Limiting
- **Window**: 15 minutes
- **Max requests**: 50 per window
- **Response headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

## Caching
All endpoints use intelligent caching with 5-minute TTL to improve performance:
- Cache statistics available via `/cache/stats`
- Cache can be cleared via `/cache/clear`
- Cached responses include `cached: true` field

---

## Endpoints

### 1. GET /listening-trends
Get paginated listening history with audio features trends.

**Parameters:**
- `page` (integer, default: 1) - Page number
- `limit` (integer, default: 50, max: 100) - Items per page
- `timeRange` (string, default: '30d') - Time range: '24h', '7d', '30d', '90d', '1y'
- `userId` (string, optional) - Filter by specific user
- `features` (string, optional) - Comma-separated audio features: 'energy,valence,danceability'

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "trackId": "track123",
      "trackName": "Song Name",
      "artist": "Artist Name",
      "playedAt": "2025-01-08T12:00:00Z",
      "audioFeatures": {
        "energy": 0.75,
        "valence": 0.60,
        "danceability": 0.80
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "trends": {
    "energy": {
      "average": 0.65,
      "min": 0.20,
      "max": 0.95,
      "trend": "increasing",
      "dataPoints": 45
    },
    "valence": {
      "average": 0.58,
      "min": 0.15,
      "max": 0.90,
      "trend": "stable",
      "dataPoints": 45
    }
  },
  "features": ["energy", "valence", "danceability"],
  "timeRange": "30d",
  "generatedAt": "2025-01-08T12:00:00Z"
}
```

**Example:**
```bash
curl -H "Authorization: Bearer user123" \
  "http://localhost:3000/api/insights/listening-trends?page=1&limit=20&timeRange=7d&features=energy,valence"
```

### 2. GET /song/:trackId
Get comprehensive song analytics with audio features.

**Parameters:**
- `trackId` (string, required) - Spotify track ID
- `limit` (integer, default: 10) - Number of similar tracks to return

**Response:**
```json
{
  "success": true,
  "trackId": "track123",
  "audioFeatures": {
    "energy": 0.75,
    "valence": 0.60,
    "danceability": 0.80,
    "acousticness": 0.15,
    "instrumentalness": 0.05,
    "speechiness": 0.10,
    "tempo": 120,
    "key": 1,
    "time_signature": 4,
    "duration_ms": 210000,
    "loudness": -8.5
  },
  "listening": {
    "totalPlays": 25,
    "uniqueListeners": ["user1", "user2"],
    "firstPlayed": "2024-12-01T10:00:00Z",
    "lastPlayed": "2025-01-08T15:30:00Z"
  },
  "similarTracks": [
    {
      "trackId": "similar1",
      "energy": 0.73,
      "valence": 0.65
    }
  ],
  "analysis": {
    "energy_level": "high",
    "mood": "happy",
    "danceability_level": "high",
    "tempo_category": "moderate",
    "key_signature": 1,
    "time_signature": 4
  },
  "generatedAt": "2025-01-08T12:00:00Z"
}
```

**Example:**
```bash
curl -H "Authorization: Bearer user123" \
  "http://localhost:3000/api/insights/song/4iV5W9uYEdYUVa79Axb7Rh"
```

### 3. GET /playlist/:playlistId
Get playlist analytics and trends.

**Parameters:**
- `playlistId` (string, required) - Playlist ID
- `includeAudioFeatures` (boolean, default: true) - Include audio feature analysis
- `analyzeTrends` (boolean, default: true) - Include trend analysis

**Response:**
```json
{
  "success": true,
  "playlistId": "playlist123",
  "name": "My Favorites",
  "trackCount": 25,
  "audioFeatures": {
    "energy": {
      "average": 0.65,
      "min": 0.20,
      "max": 0.95,
      "distribution": [0.1, 0.2, 0.3, 0.3, 0.1]
    },
    "valence": {
      "average": 0.58,
      "min": 0.15,
      "max": 0.90,
      "distribution": [0.15, 0.25, 0.25, 0.25, 0.1]
    }
  },
  "trends": {
    "totalChanges": 12,
    "lastModified": "2025-01-07T14:20:00Z",
    "changeFrequency": "moderate"
  },
  "generatedAt": "2025-01-08T12:00:00Z"
}
```

**Example:**
```bash
curl -H "Authorization: Bearer user123" \
  "http://localhost:3000/api/insights/playlist/37i9dQZF1DXcBWIGoYBM5M?includeAudioFeatures=true"
```

### 4. GET /cache/stats
Get cache performance statistics.

**Response:**
```json
{
  "success": true,
  "cache": {
    "keys": 15,
    "hits": 142,
    "misses": 28,
    "hitRate": 0.835,
    "ksize": 15,
    "vsize": 2048
  },
  "timestamp": "2025-01-08T12:00:00Z"
}
```

### 5. POST /cache/clear
Clear all cached insights data.

**Response:**
```json
{
  "success": true,
  "message": "Insights cache cleared successfully",
  "timestamp": "2025-01-08T12:00:00Z"
}
```

---

## Data Models

### Audio Features
Audio features are normalized values between 0.0 and 1.0:
- `energy` - Intensity and power
- `valence` - Musical positivity/happiness
- `danceability` - How suitable for dancing
- `acousticness` - Acoustic vs. electronic
- `instrumentalness` - Amount of vocals
- `speechiness` - Spoken word content
- `tempo` - BPM (not normalized)
- `key` - Musical key (0-11)
- `time_signature` - Time signature
- `loudness` - Overall loudness in dB
- `duration_ms` - Track duration in milliseconds

### Trend Categories
- `increasing` - Values trending upward
- `decreasing` - Values trending downward  
- `stable` - Values remaining relatively constant

### Change Frequency
- `very_active` - More than 1 change per day
- `active` - 0.5 to 1 change per day
- `moderate` - 0.1 to 0.5 changes per day
- `low` - Less than 0.1 changes per day
- `static` - No changes recorded

### Analysis Categories

**Energy Level:**
- `low` - < 0.3
- `medium` - 0.3 to 0.7
- `high` - > 0.7

**Mood (Valence):**
- `sad` - < 0.3
- `neutral` - 0.3 to 0.7
- `happy` - > 0.7

**Tempo Category:**
- `slow` - < 90 BPM
- `moderate` - 90-120 BPM
- `fast` - 120-140 BPM
- `very_fast` - > 140 BPM

---

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authorization required",
  "message": "Please provide an authorization header"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many insights requests, please try again later",
  "retryAfter": 900
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Failed to get listening trends",
  "message": "Database connection timeout"
}
```

---

## Fallback Mode

When MongoDB is not available, the API operates in fallback mode:
- Returns empty data structures with appropriate metadata
- Includes `fallback: true` and descriptive message
- Maintains API contract for seamless operation
- Allows testing and development without database dependency

Example fallback response:
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 50,
    "totalCount": 0,
    "totalPages": 0,
    "hasNext": false,
    "hasPrev": false
  },
  "trends": {},
  "features": ["energy", "valence", "danceability"],
  "fallback": true,
  "message": "Using fallback data - MongoDB not connected"
}
```

---

## Performance Notes

- **Caching**: 5-minute TTL reduces database load and improves response times
- **Pagination**: Default 50 items per page, maximum 100 to prevent memory issues
- **Rate Limiting**: 50 requests per 15 minutes per IP to ensure fair usage
- **Query Optimization**: Indexes on `playedAt`, `userId`, and `trackId` for fast queries
- **Aggregation Pipelines**: Efficient MongoDB aggregations for trend analysis

---

## Usage Examples

### Basic Listening Trends
```bash
# Get recent listening with default settings
curl -H "Authorization: Bearer user123" \
  "http://localhost:3000/api/insights/listening-trends"
```

### Filtered Analysis
```bash
# Get energy and valence trends for last 7 days, page 2
curl -H "Authorization: Bearer user123" \
  "http://localhost:3000/api/insights/listening-trends?timeRange=7d&features=energy,valence&page=2&limit=25"
```

### Song Deep Dive
```bash
# Get comprehensive song analysis
curl -H "Authorization: Bearer user123" \
  "http://localhost:3000/api/insights/song/4iV5W9uYEdYUVa79Axb7Rh?limit=5"
```

### Playlist Analysis
```bash
# Analyze playlist with full feature breakdown
curl -H "Authorization: Bearer user123" \
  "http://localhost:3000/api/insights/playlist/37i9dQZF1DXcBWIGoYBM5M?includeAudioFeatures=true&analyzeTrends=true"
```

### Cache Management
```bash
# Check cache performance
curl -H "Authorization: Bearer user123" \
  "http://localhost:3000/api/insights/cache/stats"

# Clear cache for fresh data
curl -X POST -H "Authorization: Bearer user123" \
  "http://localhost:3000/api/insights/cache/clear"
```