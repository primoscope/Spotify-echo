// MongoDB initialization script for EchoTune AI development environment
// This script runs when MongoDB container starts for the first time

print('🔧 Initializing EchoTune AI development database...');

// Switch to the application database
db = db.getSiblingDB('echotune_dev');

// Create application user
db.createUser({
  user: 'echotune_user',
  pwd: 'echotune_dev_password',
  roles: [
    {
      role: 'readWrite',
      db: 'echotune_dev'
    }
  ]
});

// Create collections with schema validation
print('📋 Creating collections and indexes...');

// User profiles collection
db.createCollection('user_profiles', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['spotify_user_id', 'created_at'],
      properties: {
        spotify_user_id: { bsonType: 'string' },
        display_name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        country: { bsonType: 'string' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

// Listening history collection
db.createCollection('listening_history', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'track_id', 'played_at'],
      properties: {
        user_id: { bsonType: 'objectId' },
        track_id: { bsonType: 'string' },
        track_name: { bsonType: 'string' },
        artist_name: { bsonType: 'string' },
        played_at: { bsonType: 'date' },
        duration_ms: { bsonType: 'number' }
      }
    }
  }
});

// Provider telemetry collection (TTL index for automatic cleanup)
db.createCollection('provider_telemetry', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['provider', 'latencyMs', 'success', 'ts'],
      properties: {
        provider: { bsonType: 'string' },
        model: { bsonType: 'string' },
        latencyMs: { bsonType: 'number', minimum: 0 },
        success: { bsonType: 'bool' },
        errorCode: { bsonType: 'string' },
        requestId: { bsonType: 'string' },
        ts: { bsonType: 'date' }
      }
    }
  }
});

// Chat history collection
db.createCollection('chat_history', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['user_id', 'session_id', 'message_type', 'content'],
      properties: {
        user_id: { bsonType: 'objectId' },
        session_id: { bsonType: 'string' },
        message_type: { bsonType: 'string', enum: ['user', 'assistant', 'system'] },
        content: { bsonType: 'string' }
      }
    }
  }
});

// Conversations collection for context management
db.createCollection('conversations', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['sessionId', 'userId'],
      properties: {
        sessionId: { bsonType: 'string' },
        userId: { bsonType: 'objectId' },
        summary: { bsonType: 'string' },
        messageCount: { bsonType: 'number', minimum: 0 },
        lastActivity: { bsonType: 'date' }
      }
    }
  }
});

// Insights collection
db.createCollection('insights', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['type', 'data', 'aggregationPeriod', 'timestamp'],
      properties: {
        type: { bsonType: 'string', enum: ['engagement', 'listening_patterns', 'providers'] },
        data: { bsonType: 'object' },
        aggregationPeriod: { bsonType: 'string', enum: ['daily', 'weekly', 'monthly'] },
        timestamp: { bsonType: 'date' }
      }
    }
  }
});

print('📊 Creating indexes for optimal query performance...');

// User profiles indexes
db.user_profiles.createIndex({ spotify_user_id: 1 }, { unique: true });
db.user_profiles.createIndex({ email: 1 });
db.user_profiles.createIndex({ created_at: -1 });

// Listening history indexes
db.listening_history.createIndex({ user_id: 1, played_at: -1 });
db.listening_history.createIndex({ track_id: 1 });
db.listening_history.createIndex({ artist_name: 1 });
db.listening_history.createIndex({ played_at: -1 });
db.listening_history.createIndex({ user_id: 1, track_id: 1 });

// Provider telemetry indexes with TTL
db.provider_telemetry.createIndex({ provider: 1, ts: -1 });
db.provider_telemetry.createIndex({ ts: 1 }, { expireAfterSeconds: 2592000 }); // 30 days TTL
db.provider_telemetry.createIndex({ provider: 1, success: 1, ts: -1 });
db.provider_telemetry.createIndex({ requestId: 1 });

// Chat history indexes
db.chat_history.createIndex({ user_id: 1, session_id: 1, timestamp: -1 });
db.chat_history.createIndex({ session_id: 1, timestamp: -1 });
db.chat_history.createIndex({ user_id: 1, timestamp: -1 });

// Conversations indexes
db.conversations.createIndex({ sessionId: 1 }, { unique: true });
db.conversations.createIndex({ userId: 1, lastActivity: -1 });
db.conversations.createIndex({ lastActivity: -1 });

// Insights indexes
db.insights.createIndex({ type: 1, aggregationPeriod: 1, timestamp: -1 });
db.insights.createIndex({ timestamp: -1 });

print('🔧 Setting up aggregation pipelines for analytics...');

// Create view for provider health summary
db.createView('provider_health_summary', 'provider_telemetry', [
  {
    $match: {
      ts: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    }
  },
  {
    $group: {
      _id: '$provider',
      avgLatency: { $avg: '$latencyMs' },
      successRate: { $avg: { $cond: ['$success', 1, 0] } },
      requestCount: { $sum: 1 },
      errorCount: { $sum: { $cond: ['$success', 0, 1] } },
      lastRequest: { $max: '$ts' }
    }
  },
  {
    $project: {
      provider: '$_id',
      avgLatency: { $round: ['$avgLatency', 2] },
      successRate: { $round: [{ $multiply: ['$successRate', 100] }, 2] },
      requestCount: 1,
      errorCount: 1,
      lastRequest: 1,
      _id: 0
    }
  }
]);

// Insert sample data for development
print('📝 Inserting sample development data...');

// Sample user
const sampleUserId = new ObjectId();
db.user_profiles.insertOne({
  _id: sampleUserId,
  spotify_user_id: 'dev_user_001',
  display_name: 'Development User',
  email: 'dev@echotune.ai',
  country: 'US',
  created_at: new Date(),
  updated_at: new Date()
});

// Sample listening history
const sampleTracks = [
  { track_id: 'track001', track_name: 'Sample Song 1', artist_name: 'Sample Artist 1' },
  { track_id: 'track002', track_name: 'Sample Song 2', artist_name: 'Sample Artist 2' },
  { track_id: 'track003', track_name: 'Sample Song 3', artist_name: 'Sample Artist 1' }
];

for (let i = 0; i < 10; i++) {
  const randomTrack = sampleTracks[Math.floor(Math.random() * sampleTracks.length)];
  db.listening_history.insertOne({
    user_id: sampleUserId,
    track_id: randomTrack.track_id,
    track_name: randomTrack.track_name,
    artist_name: randomTrack.artist_name,
    played_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
    duration_ms: 180000 + Math.random() * 120000, // 3-5 minutes
    created_at: new Date()
  });
}

// Sample provider telemetry
const providers = ['gemini', 'openai', 'openrouter', 'mock'];
for (let i = 0; i < 50; i++) {
  const provider = providers[Math.floor(Math.random() * providers.length)];
  db.provider_telemetry.insertOne({
    provider: provider,
    model: provider === 'gemini' ? 'gemini-1.5-flash' : 
           provider === 'openai' ? 'gpt-3.5-turbo' : 
           provider === 'openrouter' ? 'deepseek/deepseek-r1' : 'mock-model',
    latencyMs: 200 + Math.random() * 1000, // 200-1200ms
    success: Math.random() > 0.05, // 95% success rate
    errorCode: Math.random() > 0.95 ? 'timeout' : null,
    requestId: `req_${Date.now()}_${i}`,
    ts: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24 hours
    metadata: { sampleData: true }
  });
}

// Sample conversation
db.conversations.insertOne({
  sessionId: 'dev_session_001',
  userId: sampleUserId,
  summary: 'User asking about music recommendations for workout',
  context: {
    userIntent: 'workout_music',
    mood: 'energetic',
    preferences: ['electronic', 'pop']
  },
  messageCount: 5,
  lastActivity: new Date(),
  created_at: new Date(),
  updated_at: new Date()
});

print('✅ EchoTune AI development database initialized successfully!');
print('');
print('📊 Database Statistics:');
print('- Collections: ' + db.getCollectionNames().length);
print('- Users: ' + db.user_profiles.countDocuments());
print('- Listening History: ' + db.listening_history.countDocuments());
print('- Provider Telemetry: ' + db.provider_telemetry.countDocuments());
print('- Conversations: ' + db.conversations.countDocuments());
print('');
print('🔗 Connection Details:');
print('- Database: echotune_dev');
print('- User: echotune_user');
print('- Password: echotune_dev_password');
print('');
print('🚀 Ready for development!');