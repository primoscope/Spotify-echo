# EchoTune AI - API Documentation

Complete reference for the EchoTune AI backend API.

## 📚 API Reference

### Base URL
- **Production**: `https://your-domain.com/api`
- **Development**: `http://localhost:3000/api`

### Authentication
Most endpoints require Spotify OAuth authentication. The API uses Bearer tokens for authentication.

```bash
Authorization: Bearer <spotify_access_token>
```

## 🎵 Music Endpoints

### Get User's Top Tracks
```http
GET /api/spotify/top-tracks
```

**Response:**
```json
{
  "tracks": [
    {
      "id": "track_id",
      "name": "Song Name",
      "artists": ["Artist Name"],
      "popularity": 85,
      "audio_features": {
        "danceability": 0.8,
        "energy": 0.9,
        "valence": 0.7
      }
    }
  ]
}
```

### Get Recommendations
```http
POST /api/recommendations
Content-Type: application/json

{
  "user_id": "user123",
  "preferences": {
    "genres": ["pop", "rock"],
    "mood": "energetic"
  }
}
```

## 💬 Chat Endpoints

### Send Chat Message
```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "Recommend some upbeat songs",
  "context": {
    "user_id": "user123",
    "session_id": "session456"
  }
}
```

**Response:**
```json
{
  "response": "Here are some upbeat songs you might enjoy...",
  "recommendations": [
    {
      "track_id": "spotify:track:123",
      "confidence": 0.9
    }
  ],
  "provider": "openai"
}
```

### Switch LLM Provider
```http
POST /api/chat/provider
Content-Type: application/json

{
  "provider": "gemini"
}
```

## 🔍 Health and Monitoring

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "version": "2.1.0",
  "uptime": 123.45,
  "checks": {
    "application": {"status": "healthy"},
    "database": {"status": "healthy"},
    "spotify_api": {"status": "healthy"}
  }
}
```

### Performance Metrics
```http
GET /api/performance
```

### Security Stats
```http
GET /api/security/stats
```

## 📊 Analytics Endpoints

### User Listening History
```http
GET /api/analytics/listening-history?user_id=user123&limit=50
```

### Music Trends
```http
GET /api/analytics/trends?timeframe=week
```

## 🔒 Security

### Rate Limiting
- **Standard**: 100 requests per 15 minutes per IP
- **Authenticated**: 1000 requests per 15 minutes per user
- **Chat**: 50 requests per 15 minutes per user

### Error Responses
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "retry_after": 900
  }
}
```

## 🚀 WebSocket Events

### Real-time Chat
```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3000');

// Send message
socket.emit('chat_message', {
  message: 'Play some jazz',
  user_id: 'user123'
});

// Receive response
socket.on('chat_response', (data) => {
  console.log(data.message);
});
```

### Available Events
- `chat_message` - Send chat message
- `chat_response` - Receive chat response
- `stream_start` - Chat streaming starts
- `stream_chunk` - Streaming chunk received
- `stream_complete` - Streaming complete
- `typing_start` - User typing indicator
- `typing_stop` - Stop typing indicator

## 📝 Example Requests

### cURL Examples
```bash
# Health check
curl -X GET http://localhost:3000/api/health

# Get recommendations with auth
curl -X POST http://localhost:3000/api/recommendations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user123", "preferences": {"mood": "happy"}}'

# Send chat message
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"message": "I want some upbeat music", "context": {"user_id": "user123"}}'
```

### JavaScript Examples
```javascript
// Fetch recommendations
const recommendations = await fetch('/api/recommendations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    user_id: 'user123',
    preferences: { mood: 'energetic' }
  })
});

const data = await recommendations.json();
```

### Python Examples
```python
import requests

# Health check
response = requests.get('http://localhost:3000/api/health')
print(response.json())

# Get recommendations
payload = {
    'user_id': 'user123',
    'preferences': {'mood': 'calm'}
}
response = requests.post(
    'http://localhost:3000/api/recommendations',
    json=payload,
    headers={'Authorization': f'Bearer {token}'}
)
```

## 🛠️ Development

### API Testing
```bash
# Run API tests
npm run test:api

# Test specific endpoint
npm run test -- tests/api/chat.test.js

# Load testing
npm run test:load
```

### Local Development
```bash
# Start API server
npm run dev

# API will be available at http://localhost:3000/api
```

## 📚 Additional Resources

- [Interactive API Documentation](../interactive/) - Swagger UI
- [OpenAPI Specification](../openapi.yaml) - Machine-readable API spec
- [WebSocket Documentation](websocket.md) - Real-time features
- [Authentication Guide](auth.md) - Spotify OAuth setup