// MongoDB Initialization Script for EchoTune AI
// This script sets up the database collections and indexes

// Switch to the echotune database
db = db.getSiblingDB('echotune');

// Create collections
db.createCollection('users');
db.createCollection('listening_history');
db.createCollection('recommendations');
db.createCollection('audio_features');
db.createCollection('sessions');

// Create indexes for performance
// Users collection
db.users.createIndex({ "spotify_id": 1 }, { unique: true });
db.users.createIndex({ "email": 1 });
db.users.createIndex({ "created_at": 1 });

// Listening history collection
db.listening_history.createIndex({ "user_id": 1 });
db.listening_history.createIndex({ "track_id": 1 });
db.listening_history.createIndex({ "played_at": 1 });
db.listening_history.createIndex({ "user_id": 1, "played_at": -1 });

// Recommendations collection
db.recommendations.createIndex({ "user_id": 1 });
db.recommendations.createIndex({ "created_at": 1 });
db.recommendations.createIndex({ "user_id": 1, "created_at": -1 });

// Audio features collection
db.audio_features.createIndex({ "track_id": 1 }, { unique: true });

// Sessions collection
db.sessions.createIndex({ "session_id": 1 }, { unique: true });
db.sessions.createIndex({ "expires": 1 }, { expireAfterSeconds: 0 });

print('MongoDB initialized successfully for EchoTune AI');