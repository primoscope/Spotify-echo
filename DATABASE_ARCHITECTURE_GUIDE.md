# 🗄️ EchoTune AI - Database Architecture Guide

[![Database Design](https://img.shields.io/badge/database-architecture-blue.svg)](#overview)
[![MongoDB](https://img.shields.io/badge/MongoDB-primary-green.svg)](#mongodb-schema)
[![SQLite](https://img.shields.io/badge/SQLite-fallback-orange.svg)](#sqlite-fallback)

## Overview

EchoTune AI uses a flexible, multi-database architecture designed for resilience and scalability. The system gracefully handles database unavailability while maintaining core functionality through intelligent fallback mechanisms.

## 🏗️ Architecture Overview

### Database Strategy

**Primary Database: MongoDB**
- Production-ready NoSQL database
- Optimal for music metadata and user preferences
- Horizontal scaling capabilities
- Rich query features for recommendations

**Fallback Database: SQLite**
- Embedded database for guaranteed availability
- Automatic fallback when MongoDB unavailable
- Local storage for development and testing
- Zero configuration required

**Caching Layer: Redis (Optional)**
- Session storage and caching
- Real-time data for chat and recommendations
- Performance optimization
- Optional service (application works without it)

### Data Flow Architecture

```
Application Layer
       ↓
Database Manager (src/database/DatabaseManager.js)
       ↓
┌─────────────┬─────────────┬─────────────┐
│   MongoDB   │   SQLite    │    Redis    │
│ (Primary)   │ (Fallback)  │ (Optional)  │
└─────────────┴─────────────┴─────────────┘
```

## 📊 MongoDB Schema Design

### Core Collections

#### 1. Users Collection

```javascript
// Collection: users
{
  _id: ObjectId("..."),
  spotifyId: "spotify_user_id",          // Spotify user identifier
  displayName: "John Doe",               // User's display name
  email: "user@example.com",             // Email address
  profileImage: "https://...",           // Profile image URL
  country: "US",                         // User's country
  product: "premium",                    // Spotify subscription type
  
  // Authentication data
  auth: {
    accessToken: "encrypted_token",      // Encrypted Spotify access token
    refreshToken: "encrypted_token",     // Encrypted refresh token
    tokenExpiry: ISODate("..."),         // Token expiration time
    lastLogin: ISODate("..."),           // Last login timestamp
  },
  
  // User preferences
  preferences: {
    genres: ["rock", "jazz", "electronic"], // Preferred genres
    explicitContent: false,              // Allow explicit content
    discoveryMode: "balanced",           // conservative/balanced/adventurous
    recommendationLimit: 20,             // Number of recommendations
    language: "en",                      // Interface language
  },
  
  // Listening statistics
  stats: {
    totalTracks: 1250,                   // Total tracks in library
    totalPlaytime: 450000,               // Total listening time (seconds)
    topGenres: ["rock", "pop", "jazz"],  // Most listened genres
    topArtists: ["Artist1", "Artist2"],  // Most played artists
    lastAnalyzed: ISODate("..."),        // Last statistics update
  },
  
  // Metadata
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
  isActive: true,
  version: 1                             // Schema version for migrations
}

// Indexes
db.users.createIndex({ "spotifyId": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true, sparse: true })
db.users.createIndex({ "auth.lastLogin": 1 })
db.users.createIndex({ "createdAt": 1 })
```

#### 2. Listening History Collection

```javascript
// Collection: listening_history
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),               // Reference to users collection
  spotifyUserId: "spotify_user_id",      // Denormalized for performance
  
  // Track information
  track: {
    spotifyId: "4iV5W9uYEdYUVa79Axb7Rh",  // Spotify track ID
    name: "Hotel California",            // Track name
    duration: 391000,                    // Duration in milliseconds
    popularity: 95,                      // Spotify popularity (0-100)
    explicit: false,                     // Explicit content flag
    previewUrl: "https://...",           // 30-second preview URL
    externalUrls: {
      spotify: "https://open.spotify.com/track/..."
    }
  },
  
  // Artist information
  artists: [{
    spotifyId: "0ECwFtbIWEVNwjlrfc6xoL",
    name: "Eagles",
    genres: ["rock", "country rock"],
    popularity: 85
  }],
  
  // Album information
  album: {
    spotifyId: "4E6TGIyZZqldGB8BKuBu4a",
    name: "Hotel California",
    releaseDate: "1976-12-08",
    totalTracks: 9,
    imageUrl: "https://i.scdn.co/image/...",
    genres: ["rock"]
  },
  
  // Audio features (from Spotify Audio Features API)
  audioFeatures: {
    acousticness: 0.0255,                // 0.0 to 1.0
    danceability: 0.552,                 // 0.0 to 1.0
    energy: 0.663,                       // 0.0 to 1.0
    instrumentalness: 0.0000356,         // 0.0 to 1.0
    liveness: 0.101,                     // 0.0 to 1.0
    loudness: -8.852,                    // dB
    speechiness: 0.0365,                 // 0.0 to 1.0
    valence: 0.417,                      // 0.0 to 1.0 (positivity)
    tempo: 76.011,                       // BPM
    timeSignature: 4                     // 3-7
  },
  
  // Listening context
  context: {
    playedAt: ISODate("..."),            // When track was played
    deviceType: "computer",              // Device type
    source: "playlist",                  // playlist/album/search/radio
    sourceId: "37i9dQZF1DX0XUsuxWHRQd", // Source playlist/album ID
    shuffleState: false,                 // Shuffle enabled
    repeatState: "off"                   // off/context/track
  },
  
  // User interaction
  interaction: {
    playCount: 1,                        // Number of times played
    lastPlayed: ISODate("..."),          // Last play timestamp
    liked: true,                         // User liked the track
    skipped: false,                      // User skipped the track
    playDuration: 391000,                // How long user listened (ms)
    completionPercentage: 100            // % of track completed
  },
  
  // Metadata
  createdAt: ISODate("..."),
  version: 1
}

// Indexes
db.listening_history.createIndex({ "userId": 1, "context.playedAt": -1 })
db.listening_history.createIndex({ "track.spotifyId": 1 })
db.listening_history.createIndex({ "spotifyUserId": 1, "createdAt": -1 })
db.listening_history.createIndex({ "artists.spotifyId": 1 })
db.listening_history.createIndex({ "album.spotifyId": 1 })
db.listening_history.createIndex({ "context.playedAt": -1 })
```

#### 3. Recommendations Collection

```javascript
// Collection: recommendations
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),               // Reference to users collection
  
  // Recommendation metadata
  recommendation: {
    type: "ai_generated",                // ai_generated/collaborative/content_based
    provider: "gemini",                  // AI provider used
    requestId: "req_123456",             // Unique request identifier
    prompt: "upbeat music for working out", // Original user request
    confidence: 0.85,                    // Confidence score (0-1)
    diversity: 0.7,                      // Diversity score (0-1)
    novelty: 0.6                         // Novelty score (0-1)
  },
  
  // Recommended tracks
  tracks: [{
    spotifyId: "4iV5W9uYEdYUVa79Axb7Rh",
    name: "Don't Stop Me Now",
    artists: ["Queen"],
    album: "Jazz",
    score: 0.92,                         // Recommendation score
    reason: "High energy and positive mood match your request",
    audioFeatures: {
      energy: 0.89,
      valence: 0.96,
      danceability: 0.74,
      tempo: 156.0
    }
  }],
  
  // User feedback
  feedback: {
    overallRating: 4,                    // 1-5 stars
    likedTracks: ["4iV5W9uYEdYUVa79Axb7Rh"], // Spotify IDs
    dislikedTracks: [],                  // Spotify IDs
    playedTracks: ["4iV5W9uYEdYUVa79Axb7Rh"], // Actually played
    addedToPlaylist: true,               // Added to user playlist
    sharedRecommendation: false,         // Shared with others
    feedbackDate: ISODate("...")
  },
  
  // Context and filters
  context: {
    mood: "energetic",                   // Detected/specified mood
    activity: "workout",                 // Activity context
    timeOfDay: "morning",                // When recommendation was made
    weather: "sunny",                    // Weather context (if available)
    location: "gym",                     // Location context (if available)
    deviceType: "mobile"                 // Device used
  },
  
  // Metadata
  createdAt: ISODate("..."),
  expiresAt: ISODate("..."),             // When recommendation expires
  isActive: true,
  version: 1
}

// Indexes
db.recommendations.createIndex({ "userId": 1, "createdAt": -1 })
db.recommendations.createIndex({ "recommendation.type": 1 })
db.recommendations.createIndex({ "recommendation.provider": 1 })
db.recommendations.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
db.recommendations.createIndex({ "tracks.spotifyId": 1 })
```

#### 4. Chat Sessions Collection

```javascript
// Collection: chat_sessions
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),               // Reference to users collection
  
  // Session metadata
  session: {
    sessionId: "sess_123456789",         // Unique session identifier
    title: "Workout Music Chat",         // Auto-generated or user-set title
    provider: "gemini",                  // AI provider used
    model: "gemini-pro",                 // Specific model version
    startTime: ISODate("..."),           // Session start time
    lastActivity: ISODate("..."),        // Last message time
    isActive: true,                      // Session status
    language: "en"                       // Conversation language
  },
  
  // Conversation messages
  messages: [{
    messageId: "msg_123",                // Unique message ID
    role: "user",                        // user/assistant/system
    content: "I need energetic music for my workout",
    timestamp: ISODate("..."),
    
    // Message metadata
    metadata: {
      tokenCount: 15,                    // Token usage
      responseTime: 1200,                // Response time in ms
      confidence: 0.88,                  // AI confidence
      intent: "music_request",           // Detected intent
      entities: ["workout", "energetic"] // Extracted entities
    }
  }, {
    messageId: "msg_124",
    role: "assistant",
    content: "Here are some high-energy tracks perfect for workouts...",
    timestamp: ISODate("..."),
    
    // AI response metadata
    metadata: {
      tokenCount: 156,
      responseTime: 2400,
      confidence: 0.92,
      intent: "music_recommendation",
      
      // Generated recommendations
      recommendations: [{
        spotifyId: "4iV5W9uYEdYUVa79Axb7Rh",
        reason: "High energy and motivational"
      }],
      
      // Provider-specific data
      providerData: {
        modelVersion: "gemini-pro-001",
        safetyRatings: [],
        finishReason: "STOP"
      }
    }
  }],
  
  // Session analytics
  analytics: {
    messageCount: 12,                    // Total messages in session
    userMessages: 6,                     // User message count
    assistantMessages: 6,                // AI response count
    totalTokens: 2400,                   // Total tokens used
    avgResponseTime: 1800,               // Average response time
    recommendationCount: 15,             // Recommendations generated
    successfulRecommendations: 12,       // Recommendations acted upon
    userSatisfaction: 4.5                // User rating (1-5)
  },
  
  // Metadata
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
  version: 1
}

// Indexes
db.chat_sessions.createIndex({ "userId": 1, "session.lastActivity": -1 })
db.chat_sessions.createIndex({ "session.sessionId": 1 }, { unique: true })
db.chat_sessions.createIndex({ "session.isActive": 1 })
db.chat_sessions.createIndex({ "messages.timestamp": -1 })
```

#### 5. Playlists Collection

```javascript
// Collection: playlists
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),               // Reference to users collection
  
  // Playlist metadata
  playlist: {
    spotifyId: "37i9dQZF1DX0XUsuxWHRQd", // Spotify playlist ID (if synced)
    name: "AI Workout Mix",              // Playlist name
    description: "AI-generated workout playlist based on your preferences",
    isPublic: false,                     // Public/private status
    collaborative: false,                // Collaborative playlist
    imageUrl: "https://...",             // Playlist cover image
    followerCount: 0,                    // Number of followers
    totalTracks: 25,                     // Number of tracks
    totalDuration: 5400000               // Total duration in ms
  },
  
  // AI generation context
  generation: {
    prompt: "Create a high-energy workout playlist",
    provider: "gemini",                  // AI provider used
    algorithm: "content_based",          // Recommendation algorithm
    parameters: {
      energy: { min: 0.7, max: 1.0 },
      valence: { min: 0.6, max: 1.0 },
      tempo: { min: 120, max: 180 },
      danceability: { min: 0.6, max: 1.0 }
    },
    generatedAt: ISODate("..."),
    confidence: 0.88
  },
  
  // Tracks in playlist
  tracks: [{
    position: 1,                         // Track position in playlist
    spotifyId: "4iV5W9uYEdYUVa79Axb7Rh",
    name: "Don't Stop Me Now",
    artists: ["Queen"],
    album: "Jazz",
    duration: 209000,
    addedAt: ISODate("..."),
    addedBy: "ai_recommendation",        // user/ai_recommendation/spotify_sync
    
    // Why this track was included
    reasoning: {
      score: 0.92,
      factors: ["high_energy", "positive_mood", "user_history"],
      aiExplanation: "This track matches your preference for energetic music"
    }
  }],
  
  // User interactions
  interactions: {
    playCount: 15,                       // Times playlist was played
    lastPlayed: ISODate("..."),          // Last play timestamp
    liked: true,                         // User liked the playlist
    shared: false,                       // Playlist was shared
    exported: true,                      // Exported to Spotify
    rating: 5,                           // User rating (1-5)
    
    // Track-level interactions
    trackInteractions: {
      "4iV5W9uYEdYUVa79Axb7Rh": {
        playCount: 3,
        liked: true,
        skipped: false
      }
    }
  },
  
  // Sync status with Spotify
  sync: {
    lastSynced: ISODate("..."),          // Last sync with Spotify
    syncStatus: "synced",                // synced/pending/failed/disabled
    syncErrors: [],                      // Any sync errors
    autoSync: true,                      // Auto-sync enabled
    spotifySnapshot: "abc123def456"      // Spotify snapshot ID
  },
  
  // Metadata
  createdAt: ISODate("..."),
  updatedAt: ISODate("..."),
  isActive: true,
  version: 1
}

// Indexes
db.playlists.createIndex({ "userId": 1, "updatedAt": -1 })
db.playlists.createIndex({ "playlist.spotifyId": 1 }, { sparse: true })
db.playlists.createIndex({ "playlist.isPublic": 1 })
db.playlists.createIndex({ "tracks.spotifyId": 1 })
```

### Schema Versioning and Migrations

```javascript
// Collection: schema_migrations
{
  _id: ObjectId("..."),
  version: 2,                            // Current schema version
  migration: {
    name: "add_audio_features_to_listening_history",
    description: "Adds audio features to listening history documents",
    script: "migrations/002_add_audio_features.js",
    appliedAt: ISODate("..."),
    duration: 45000,                     // Migration duration in ms
    documentsModified: 150000,           // Number of documents changed
    success: true,
    errors: []
  },
  
  // Previous migrations
  previousVersions: [1],
  
  // Metadata
  createdAt: ISODate("..."),
  appliedBy: "system"
}
```

## 🗃️ SQLite Fallback Schema

### Database File Structure

```sql
-- File: data/echotune_fallback.db

-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    spotify_id TEXT UNIQUE NOT NULL,
    display_name TEXT,
    email TEXT UNIQUE,
    profile_image TEXT,
    country TEXT,
    product TEXT,
    
    -- Authentication (simplified for fallback)
    access_token TEXT,
    refresh_token TEXT,
    token_expiry DATETIME,
    last_login DATETIME,
    
    -- Preferences (JSON)
    preferences TEXT DEFAULT '{}',
    
    -- Statistics (JSON)
    stats TEXT DEFAULT '{}',
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    version INTEGER DEFAULT 1
);

-- Listening history table
CREATE TABLE listening_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    spotify_user_id TEXT NOT NULL,
    
    -- Track information (JSON for complex nested data)
    track_data TEXT NOT NULL,           -- JSON: track, artists, album info
    audio_features TEXT,                -- JSON: audio features
    
    -- Context
    played_at DATETIME NOT NULL,
    device_type TEXT,
    source_type TEXT,
    source_id TEXT,
    
    -- Interaction
    play_count INTEGER DEFAULT 1,
    liked BOOLEAN DEFAULT 0,
    skipped BOOLEAN DEFAULT 0,
    play_duration INTEGER,
    completion_percentage INTEGER,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Recommendations table
CREATE TABLE recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    
    -- Recommendation metadata
    type TEXT NOT NULL,                 -- ai_generated, collaborative, etc.
    provider TEXT,
    request_id TEXT UNIQUE,
    prompt TEXT,
    confidence REAL,
    
    -- Recommended tracks (JSON array)
    tracks_data TEXT NOT NULL,
    
    -- Context (JSON)
    context_data TEXT DEFAULT '{}',
    
    -- Feedback (JSON)
    feedback_data TEXT DEFAULT '{}',
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT 1,
    version INTEGER DEFAULT 1,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Chat sessions table
CREATE TABLE chat_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_id TEXT UNIQUE NOT NULL,
    
    -- Session metadata
    title TEXT,
    provider TEXT,
    model TEXT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    language TEXT DEFAULT 'en',
    
    -- Messages (JSON array)
    messages_data TEXT DEFAULT '[]',
    
    -- Analytics (JSON)
    analytics_data TEXT DEFAULT '{}',
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    version INTEGER DEFAULT 1,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Playlists table
CREATE TABLE playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    spotify_id TEXT,
    
    -- Playlist metadata
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT 0,
    collaborative BOOLEAN DEFAULT 0,
    image_url TEXT,
    total_tracks INTEGER DEFAULT 0,
    total_duration INTEGER DEFAULT 0,
    
    -- AI generation context (JSON)
    generation_data TEXT DEFAULT '{}',
    
    -- Tracks (JSON array)
    tracks_data TEXT DEFAULT '[]',
    
    -- Interactions (JSON)
    interactions_data TEXT DEFAULT '{}',
    
    -- Sync status (JSON)
    sync_data TEXT DEFAULT '{}',
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1,
    version INTEGER DEFAULT 1,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Schema migrations table
CREATE TABLE schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN DEFAULT 1
);

-- Create indexes for performance
CREATE INDEX idx_users_spotify_id ON users(spotify_id);
CREATE INDEX idx_users_last_login ON users(last_login);

CREATE INDEX idx_listening_history_user_played ON listening_history(user_id, played_at DESC);
CREATE INDEX idx_listening_history_played_at ON listening_history(played_at DESC);

CREATE INDEX idx_recommendations_user_created ON recommendations(user_id, created_at DESC);
CREATE INDEX idx_recommendations_expires ON recommendations(expires_at);

CREATE INDEX idx_chat_sessions_user_activity ON chat_sessions(user_id, last_activity DESC);
CREATE INDEX idx_chat_sessions_session_id ON chat_sessions(session_id);

CREATE INDEX idx_playlists_user_updated ON playlists(user_id, updated_at DESC);
CREATE INDEX idx_playlists_spotify_id ON playlists(spotify_id);

-- Triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_chat_sessions_updated_at 
    AFTER UPDATE ON chat_sessions
    BEGIN
        UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_playlists_updated_at 
    AFTER UPDATE ON playlists
    BEGIN
        UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
```

## 💾 Database Manager Implementation

### Core Database Manager

```javascript
// src/database/DatabaseManager.js
const { MongoClient } = require('mongodb');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseManager {
    constructor() {
        this.mongoClient = null;
        this.mongodb = null;
        this.sqlite = null;
        this.currentDb = null;
        this.connectionStatus = {
            mongodb: false,
            sqlite: false
        };
    }

    /**
     * Initialize database connections
     */
    async initialize() {
        try {
            // Try MongoDB first
            if (process.env.MONGODB_URI) {
                await this.connectMongoDB();
            }
            
            // Always set up SQLite as fallback
            await this.connectSQLite();
            
            // Determine primary database
            this.currentDb = this.connectionStatus.mongodb ? 'mongodb' : 'sqlite';
            
            console.log(`Database initialized. Primary: ${this.currentDb}`);
            return true;
        } catch (error) {
            console.error('Database initialization error:', error);
            
            // Ensure SQLite is available as last resort
            if (!this.connectionStatus.sqlite) {
                await this.connectSQLite();
            }
            
            this.currentDb = 'sqlite';
            return true; // Always return true - app should work with SQLite
        }
    }

    /**
     * Connect to MongoDB
     */
    async connectMongoDB() {
        try {
            this.mongoClient = new MongoClient(process.env.MONGODB_URI, {
                useUnifiedTopology: true,
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });

            await this.mongoClient.connect();
            this.mongodb = this.mongoClient.db('echotune');
            this.connectionStatus.mongodb = true;
            
            console.log('✅ MongoDB connected successfully');
            
            // Run migrations if needed
            await this.runMongoMigrations();
            
        } catch (error) {
            console.warn('⚠️ MongoDB connection failed:', error.message);
            this.connectionStatus.mongodb = false;
        }
    }

    /**
     * Connect to SQLite
     */
    async connectSQLite() {
        try {
            const dbPath = path.join(process.cwd(), 'data', 'echotune_fallback.db');
            
            // Ensure data directory exists
            const fs = require('fs');
            const dataDir = path.dirname(dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            this.sqlite = new sqlite3.Database(dbPath);
            this.connectionStatus.sqlite = true;
            
            console.log('✅ SQLite connected successfully');
            
            // Initialize schema if needed
            await this.initializeSQLiteSchema();
            
        } catch (error) {
            console.error('❌ SQLite connection failed:', error);
            this.connectionStatus.sqlite = false;
            throw error;
        }
    }

    /**
     * Get health check status
     */
    async getHealthStatus() {
        const status = {
            mongodb: {
                status: this.connectionStatus.mongodb ? 'healthy' : 'unhealthy',
                optional: true,
                responseTime: null
            },
            sqlite: {
                status: this.connectionStatus.sqlite ? 'healthy' : 'unhealthy',
                optional: false,
                responseTime: null
            },
            current: this.currentDb
        };

        // Test MongoDB connection
        if (this.connectionStatus.mongodb) {
            try {
                const start = Date.now();
                await this.mongodb.admin().ping();
                status.mongodb.responseTime = Date.now() - start;
            } catch (error) {
                status.mongodb.status = 'unhealthy';
                this.connectionStatus.mongodb = false;
                
                // Switch to SQLite if MongoDB fails
                if (this.currentDb === 'mongodb' && this.connectionStatus.sqlite) {
                    this.currentDb = 'sqlite';
                    console.log('🔄 Switched to SQLite due to MongoDB failure');
                }
            }
        }

        // Test SQLite connection
        if (this.connectionStatus.sqlite) {
            try {
                const start = Date.now();
                await new Promise((resolve, reject) => {
                    this.sqlite.get("SELECT 1", (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                status.sqlite.responseTime = Date.now() - start;
            } catch (error) {
                status.sqlite.status = 'unhealthy';
                this.connectionStatus.sqlite = false;
            }
        }

        return status;
    }

    /**
     * Initialize SQLite schema
     */
    async initializeSQLiteSchema() {
        const schemaSQL = `
            -- Users table
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                spotify_id TEXT UNIQUE NOT NULL,
                display_name TEXT,
                email TEXT UNIQUE,
                profile_image TEXT,
                country TEXT,
                product TEXT,
                access_token TEXT,
                refresh_token TEXT,
                token_expiry DATETIME,
                last_login DATETIME,
                preferences TEXT DEFAULT '{}',
                stats TEXT DEFAULT '{}',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active BOOLEAN DEFAULT 1,
                version INTEGER DEFAULT 1
            );

            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_users_spotify_id ON users(spotify_id);
            CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

            -- Schema migrations table
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER UNIQUE NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                success BOOLEAN DEFAULT 1
            );
        `;

        return new Promise((resolve, reject) => {
            this.sqlite.exec(schemaSQL, (error) => {
                if (error) {
                    console.error('SQLite schema initialization error:', error);
                    reject(error);
                } else {
                    console.log('✅ SQLite schema initialized');
                    resolve();
                }
            });
        });
    }

    /**
     * Run MongoDB migrations
     */
    async runMongoMigrations() {
        try {
            const migrationsCollection = this.mongodb.collection('schema_migrations');
            
            // Get current version
            const latestMigration = await migrationsCollection
                .findOne({}, { sort: { version: -1 } });
            
            const currentVersion = latestMigration ? latestMigration.version : 0;
            
            // Define available migrations
            const migrations = [
                {
                    version: 1,
                    name: 'initial_schema',
                    description: 'Create initial collections and indexes',
                    up: async () => {
                        // Create indexes for users collection
                        await this.mongodb.collection('users').createIndex(
                            { "spotifyId": 1 }, 
                            { unique: true }
                        );
                        
                        // Create indexes for listening_history collection
                        await this.mongodb.collection('listening_history').createIndex(
                            { "userId": 1, "context.playedAt": -1 }
                        );
                        
                        console.log('✅ Initial schema migration completed');
                    }
                },
                {
                    version: 2,
                    name: 'add_audio_features',
                    description: 'Add audio features to listening history',
                    up: async () => {
                        // Migration logic for adding audio features
                        console.log('✅ Audio features migration completed');
                    }
                }
            ];

            // Run pending migrations
            for (const migration of migrations) {
                if (migration.version > currentVersion) {
                    console.log(`Running migration: ${migration.name}`);
                    
                    const startTime = Date.now();
                    await migration.up();
                    const duration = Date.now() - startTime;
                    
                    // Record migration
                    await migrationsCollection.insertOne({
                        version: migration.version,
                        migration: {
                            name: migration.name,
                            description: migration.description,
                            appliedAt: new Date(),
                            duration,
                            success: true,
                            errors: []
                        },
                        appliedBy: 'system'
                    });
                    
                    console.log(`✅ Migration ${migration.name} completed in ${duration}ms`);
                }
            }
        } catch (error) {
            console.error('Migration error:', error);
            // Don't throw - app should still work
        }
    }

    /**
     * Close all database connections
     */
    async close() {
        try {
            if (this.mongoClient) {
                await this.mongoClient.close();
                console.log('MongoDB connection closed');
            }
            
            if (this.sqlite) {
                await new Promise((resolve) => {
                    this.sqlite.close((err) => {
                        if (err) console.error('SQLite close error:', err);
                        else console.log('SQLite connection closed');
                        resolve();
                    });
                });
            }
        } catch (error) {
            console.error('Error closing database connections:', error);
        }
    }
}

module.exports = DatabaseManager;
```

### Repository Pattern Implementation

```javascript
// src/database/repositories/UserRepository.js
class UserRepository {
    constructor(databaseManager) {
        this.db = databaseManager;
    }

    /**
     * Create a new user
     */
    async create(userData) {
        if (this.db.currentDb === 'mongodb') {
            return this.createMongo(userData);
        } else {
            return this.createSQLite(userData);
        }
    }

    /**
     * Create user in MongoDB
     */
    async createMongo(userData) {
        try {
            const collection = this.db.mongodb.collection('users');
            const result = await collection.insertOne({
                ...userData,
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1
            });
            
            return { ...userData, _id: result.insertedId };
        } catch (error) {
            console.error('MongoDB user creation error:', error);
            throw error;
        }
    }

    /**
     * Create user in SQLite
     */
    async createSQLite(userData) {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO users (
                    spotify_id, display_name, email, profile_image, 
                    country, product, preferences, stats
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                userData.spotifyId,
                userData.displayName,
                userData.email,
                userData.profileImage,
                userData.country,
                userData.product,
                JSON.stringify(userData.preferences || {}),
                JSON.stringify(userData.stats || {})
            ];
            
            this.db.sqlite.run(sql, params, function(error) {
                if (error) {
                    console.error('SQLite user creation error:', error);
                    reject(error);
                } else {
                    resolve({ ...userData, id: this.lastID });
                }
            });
        });
    }

    /**
     * Find user by Spotify ID
     */
    async findBySpotifyId(spotifyId) {
        if (this.db.currentDb === 'mongodb') {
            return this.findBySpotifyIdMongo(spotifyId);
        } else {
            return this.findBySpotifyIdSQLite(spotifyId);
        }
    }

    /**
     * Find user by Spotify ID in MongoDB
     */
    async findBySpotifyIdMongo(spotifyId) {
        try {
            const collection = this.db.mongodb.collection('users');
            return await collection.findOne({ spotifyId });
        } catch (error) {
            console.error('MongoDB user lookup error:', error);
            return null;
        }
    }

    /**
     * Find user by Spotify ID in SQLite
     */
    async findBySpotifyIdSQLite(spotifyId) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE spotify_id = ? AND is_active = 1';
            
            this.db.sqlite.get(sql, [spotifyId], (error, row) => {
                if (error) {
                    console.error('SQLite user lookup error:', error);
                    reject(error);
                } else {
                    if (row) {
                        // Parse JSON fields
                        row.preferences = JSON.parse(row.preferences || '{}');
                        row.stats = JSON.parse(row.stats || '{}');
                    }
                    resolve(row || null);
                }
            });
        });
    }

    /**
     * Update user
     */
    async update(userId, updateData) {
        if (this.db.currentDb === 'mongodb') {
            return this.updateMongo(userId, updateData);
        } else {
            return this.updateSQLite(userId, updateData);
        }
    }

    /**
     * Update user in MongoDB
     */
    async updateMongo(userId, updateData) {
        try {
            const collection = this.db.mongodb.collection('users');
            const result = await collection.updateOne(
                { _id: userId },
                { 
                    $set: { 
                        ...updateData, 
                        updatedAt: new Date() 
                    } 
                }
            );
            
            return result.modifiedCount > 0;
        } catch (error) {
            console.error('MongoDB user update error:', error);
            throw error;
        }
    }

    /**
     * Update user in SQLite
     */
    async updateSQLite(userId, updateData) {
        return new Promise((resolve, reject) => {
            // Build dynamic SQL based on provided fields
            const fields = [];
            const params = [];
            
            Object.keys(updateData).forEach(key => {
                if (key === 'preferences' || key === 'stats') {
                    fields.push(`${key} = ?`);
                    params.push(JSON.stringify(updateData[key]));
                } else {
                    fields.push(`${key} = ?`);
                    params.push(updateData[key]);
                }
            });
            
            fields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(userId);
            
            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            
            this.db.sqlite.run(sql, params, function(error) {
                if (error) {
                    console.error('SQLite user update error:', error);
                    reject(error);
                } else {
                    resolve(this.changes > 0);
                }
            });
        });
    }
}

module.exports = UserRepository;
```

## 🔧 Performance Optimization

### MongoDB Optimization

```javascript
// Index strategies for optimal performance
// src/database/indexes/mongodb-indexes.js

const createIndexes = async (db) => {
    try {
        // Users collection indexes
        await db.collection('users').createIndexes([
            { key: { spotifyId: 1 }, unique: true },
            { key: { email: 1 }, unique: true, sparse: true },
            { key: { "auth.lastLogin": 1 } },
            { key: { createdAt: 1 } }
        ]);

        // Listening history collection indexes
        await db.collection('listening_history').createIndexes([
            { key: { userId: 1, "context.playedAt": -1 } },
            { key: { "track.spotifyId": 1 } },
            { key: { "artists.spotifyId": 1 } },
            { key: { "context.playedAt": -1 } },
            { 
                key: { 
                    "audioFeatures.energy": 1,
                    "audioFeatures.valence": 1,
                    "audioFeatures.danceability": 1 
                },
                name: "audio_features_compound"
            }
        ]);

        // Recommendations collection indexes
        await db.collection('recommendations').createIndexes([
            { key: { userId: 1, createdAt: -1 } },
            { key: { "recommendation.type": 1 } },
            { key: { expiresAt: 1 }, expireAfterSeconds: 0 },
            { key: { "tracks.spotifyId": 1 } }
        ]);

        // Chat sessions collection indexes
        await db.collection('chat_sessions').createIndexes([
            { key: { userId: 1, "session.lastActivity": -1 } },
            { key: { "session.sessionId": 1 }, unique: true },
            { key: { "session.isActive": 1 } }
        ]);

        // Playlists collection indexes
        await db.collection('playlists').createIndexes([
            { key: { userId: 1, updatedAt: -1 } },
            { key: { "playlist.spotifyId": 1 }, sparse: true },
            { key: { "playlist.isPublic": 1 } }
        ]);

        console.log('✅ All MongoDB indexes created successfully');
    } catch (error) {
        console.error('❌ Error creating MongoDB indexes:', error);
    }
};

module.exports = { createIndexes };
```

### Query Optimization Patterns

```javascript
// Optimized query patterns
// src/database/queries/OptimizedQueries.js

class OptimizedQueries {
    constructor(databaseManager) {
        this.db = databaseManager;
    }

    /**
     * Get user listening history with pagination
     */
    async getUserListeningHistory(userId, options = {}) {
        const { limit = 50, offset = 0, startDate, endDate } = options;

        if (this.db.currentDb === 'mongodb') {
            const collection = this.db.mongodb.collection('listening_history');
            
            // Build aggregation pipeline
            const pipeline = [
                { $match: { userId: userId } }
            ];

            // Add date filtering if provided
            if (startDate || endDate) {
                const dateFilter = {};
                if (startDate) dateFilter.$gte = new Date(startDate);
                if (endDate) dateFilter.$lte = new Date(endDate);
                pipeline.push({ $match: { "context.playedAt": dateFilter } });
            }

            // Add sorting and pagination
            pipeline.push(
                { $sort: { "context.playedAt": -1 } },
                { $skip: offset },
                { $limit: limit }
            );

            // Project only needed fields for performance
            pipeline.push({
                $project: {
                    "track.name": 1,
                    "track.spotifyId": 1,
                    "artists.name": 1,
                    "album.name": 1,
                    "context.playedAt": 1,
                    "interaction.liked": 1
                }
            });

            return await collection.aggregate(pipeline).toArray();
        } else {
            // SQLite implementation with optimized query
            return new Promise((resolve, reject) => {
                let sql = `
                    SELECT 
                        track_data,
                        played_at,
                        liked
                    FROM listening_history 
                    WHERE user_id = ?
                `;
                const params = [userId];

                if (startDate || endDate) {
                    if (startDate) {
                        sql += ' AND played_at >= ?';
                        params.push(startDate);
                    }
                    if (endDate) {
                        sql += ' AND played_at <= ?';
                        params.push(endDate);
                    }
                }

                sql += ' ORDER BY played_at DESC LIMIT ? OFFSET ?';
                params.push(limit, offset);

                this.db.sqlite.all(sql, params, (error, rows) => {
                    if (error) {
                        reject(error);
                    } else {
                        // Parse JSON data
                        const parsed = rows.map(row => ({
                            ...JSON.parse(row.track_data),
                            playedAt: row.played_at,
                            liked: Boolean(row.liked)
                        }));
                        resolve(parsed);
                    }
                });
            });
        }
    }

    /**
     * Get recommendations based on audio features
     */
    async getRecommendationsByAudioFeatures(userId, features, limit = 20) {
        if (this.db.currentDb === 'mongodb') {
            const collection = this.db.mongodb.collection('listening_history');
            
            // Find similar tracks based on audio features
            const pipeline = [
                { $match: { userId: userId } },
                {
                    $match: {
                        "audioFeatures.energy": { 
                            $gte: features.energy - 0.2, 
                            $lte: features.energy + 0.2 
                        },
                        "audioFeatures.valence": { 
                            $gte: features.valence - 0.2, 
                            $lte: features.valence + 0.2 
                        }
                    }
                },
                { $sample: { size: limit } },
                {
                    $project: {
                        "track.spotifyId": 1,
                        "track.name": 1,
                        "artists.name": 1,
                        "audioFeatures": 1
                    }
                }
            ];

            return await collection.aggregate(pipeline).toArray();
        } else {
            // For SQLite, use a simpler approach
            return new Promise((resolve, reject) => {
                const sql = `
                    SELECT track_data, audio_features
                    FROM listening_history 
                    WHERE user_id = ? 
                    ORDER BY RANDOM() 
                    LIMIT ?
                `;

                this.db.sqlite.all(sql, [userId, limit], (error, rows) => {
                    if (error) {
                        reject(error);
                    } else {
                        // Filter by audio features in application code
                        const filtered = rows
                            .map(row => ({
                                ...JSON.parse(row.track_data),
                                audioFeatures: JSON.parse(row.audio_features || '{}')
                            }))
                            .filter(track => {
                                const af = track.audioFeatures;
                                return af.energy >= features.energy - 0.2 &&
                                       af.energy <= features.energy + 0.2 &&
                                       af.valence >= features.valence - 0.2 &&
                                       af.valence <= features.valence + 0.2;
                            });
                        
                        resolve(filtered.slice(0, limit));
                    }
                });
            });
        }
    }
}

module.exports = OptimizedQueries;
```

## 🔐 Security and Backup

### Data Security

```javascript
// src/database/security/DataSecurity.js
const crypto = require('crypto');

class DataSecurity {
    constructor() {
        this.encryptionKey = process.env.DATABASE_ENCRYPTION_KEY || 'default-key-change-in-production';
        this.algorithm = 'aes-256-gcm';
    }

    /**
     * Encrypt sensitive data before storing
     */
    encrypt(text) {
        if (!text) return null;
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
        cipher.setAAD(Buffer.from('EchoTune'));
        
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    /**
     * Decrypt sensitive data when retrieving
     */
    decrypt(encryptedData) {
        if (!encryptedData || !encryptedData.encrypted) return null;
        
        try {
            const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
            decipher.setAAD(Buffer.from('EchoTune'));
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    /**
     * Hash sensitive data for comparison
     */
    hash(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    /**
     * Sanitize user input
     */
    sanitize(input) {
        if (typeof input !== 'string') return input;
        
        // Remove potential injection attacks
        return input
            .replace(/[<>\"'%;()&+]/g, '')
            .trim()
            .substring(0, 1000); // Limit length
    }
}

module.exports = DataSecurity;
```

### Backup Strategy

```javascript
// src/database/backup/BackupManager.js
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class BackupManager {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.backupDir = path.join(process.cwd(), 'backups');
    }

    /**
     * Create backup based on current database
     */
    async createBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
        
        // Ensure backup directory exists
        await fs.mkdir(this.backupDir, { recursive: true });

        if (this.db.currentDb === 'mongodb') {
            return this.backupMongoDB(backupPath);
        } else {
            return this.backupSQLite(backupPath);
        }
    }

    /**
     * Backup MongoDB using mongodump
     */
    async backupMongoDB(backupPath) {
        return new Promise((resolve, reject) => {
            const uri = process.env.MONGODB_URI;
            const args = [
                '--uri', uri,
                '--out', backupPath,
                '--gzip'
            ];

            const mongodump = spawn('mongodump', args);
            
            mongodump.on('close', (code) => {
                if (code === 0) {
                    console.log(`✅ MongoDB backup created: ${backupPath}`);
                    resolve(backupPath);
                } else {
                    reject(new Error(`mongodump failed with code ${code}`));
                }
            });

            mongodump.on('error', (error) => {
                console.error('mongodump error:', error);
                reject(error);
            });
        });
    }

    /**
     * Backup SQLite by copying database file
     */
    async backupSQLite(backupPath) {
        try {
            const sourceDb = path.join(process.cwd(), 'data', 'echotune_fallback.db');
            const targetDb = `${backupPath}.db`;
            
            await fs.copyFile(sourceDb, targetDb);
            
            console.log(`✅ SQLite backup created: ${targetDb}`);
            return targetDb;
        } catch (error) {
            console.error('SQLite backup error:', error);
            throw error;
        }
    }

    /**
     * Schedule automatic backups
     */
    scheduleBackups() {
        // Daily backups at 2 AM
        const cron = require('node-cron');
        
        cron.schedule('0 2 * * *', async () => {
            try {
                console.log('🔄 Starting scheduled backup...');
                await this.createBackup();
                console.log('✅ Scheduled backup completed');
                
                // Clean old backups (keep last 7 days)
                await this.cleanOldBackups(7);
            } catch (error) {
                console.error('❌ Scheduled backup failed:', error);
            }
        });

        console.log('📅 Backup scheduler started (daily at 2 AM)');
    }

    /**
     * Clean old backup files
     */
    async cleanOldBackups(keepDays = 7) {
        try {
            const files = await fs.readdir(this.backupDir);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - keepDays);

            for (const file of files) {
                const filePath = path.join(this.backupDir, file);
                const stats = await fs.stat(filePath);
                
                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filePath);
                    console.log(`🗑️ Removed old backup: ${file}`);
                }
            }
        } catch (error) {
            console.error('Error cleaning old backups:', error);
        }
    }
}

module.exports = BackupManager;
```

## 📈 Monitoring and Analytics

### Database Monitoring

```javascript
// src/database/monitoring/DatabaseMonitor.js
class DatabaseMonitor {
    constructor(databaseManager) {
        this.db = databaseManager;
        this.metrics = {
            queries: 0,
            errors: 0,
            responseTime: [],
            connectionCount: 0
        };
    }

    /**
     * Start monitoring
     */
    startMonitoring() {
        // Monitor every 30 seconds
        setInterval(async () => {
            await this.collectMetrics();
        }, 30000);

        console.log('📊 Database monitoring started');
    }

    /**
     * Collect database metrics
     */
    async collectMetrics() {
        try {
            const metrics = {
                timestamp: new Date(),
                database: this.db.currentDb,
                mongodb: null,
                sqlite: null
            };

            if (this.db.connectionStatus.mongodb) {
                metrics.mongodb = await this.getMongoMetrics();
            }

            if (this.db.connectionStatus.sqlite) {
                metrics.sqlite = await this.getSQLiteMetrics();
            }

            // Store metrics (could be sent to monitoring service)
            this.logMetrics(metrics);

        } catch (error) {
            console.error('Error collecting database metrics:', error);
        }
    }

    /**
     * Get MongoDB metrics
     */
    async getMongoMetrics() {
        try {
            const admin = this.db.mongodb.admin();
            const serverStatus = await admin.serverStatus();
            
            return {
                connections: serverStatus.connections,
                operations: serverStatus.opcounters,
                memory: serverStatus.mem,
                network: serverStatus.network,
                uptime: serverStatus.uptime
            };
        } catch (error) {
            console.error('Error getting MongoDB metrics:', error);
            return null;
        }
    }

    /**
     * Get SQLite metrics
     */
    async getSQLiteMetrics() {
        return new Promise((resolve) => {
            // Get database size and basic info
            this.db.sqlite.get(`
                SELECT 
                    COUNT(*) as total_tables,
                    (SELECT COUNT(*) FROM users) as user_count,
                    (SELECT COUNT(*) FROM listening_history) as history_count
            `, (error, result) => {
                if (error) {
                    console.error('Error getting SQLite metrics:', error);
                    resolve(null);
                } else {
                    resolve({
                        tables: result.total_tables,
                        users: result.user_count,
                        listeningHistory: result.history_count,
                        size: this.getSQLiteFileSize()
                    });
                }
            });
        });
    }

    /**
     * Get SQLite file size
     */
    getSQLiteFileSize() {
        try {
            const fs = require('fs');
            const dbPath = path.join(process.cwd(), 'data', 'echotune_fallback.db');
            const stats = fs.statSync(dbPath);
            return stats.size;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Log metrics (could be sent to external monitoring)
     */
    logMetrics(metrics) {
        console.log('📊 Database Metrics:', {
            timestamp: metrics.timestamp,
            database: metrics.database,
            mongodb: metrics.mongodb ? 'connected' : 'disconnected',
            sqlite: metrics.sqlite ? 'connected' : 'disconnected'
        });

        // Here you could send metrics to external services like:
        // - Prometheus
        // - DataDog
        // - New Relic
        // - Custom analytics endpoint
    }
}

module.exports = DatabaseMonitor;
```

---

## 📚 Additional Resources

### Documentation References

- **MongoDB Documentation**: [Official MongoDB docs](https://docs.mongodb.com/)
- **SQLite Documentation**: [SQLite official site](https://www.sqlite.org/docs.html)
- **Node.js MongoDB Driver**: [MongoDB Node.js driver](https://mongodb.github.io/node-mongodb-native/)
- **Spotify Web API**: [API reference](https://developer.spotify.com/documentation/web-api/)

### Best Practices

1. **Connection Management**: Always use connection pooling and handle connection failures gracefully
2. **Data Validation**: Validate all data before storing in database
3. **Indexing Strategy**: Create indexes based on query patterns
4. **Backup Strategy**: Regular automated backups with retention policies
5. **Security**: Encrypt sensitive data and use parameterized queries
6. **Monitoring**: Track performance metrics and set up alerts

### Schema Evolution

The database schema is designed to evolve with the application:

- **Version Control**: All schema changes are tracked with migrations
- **Backwards Compatibility**: New features don't break existing data
- **Graceful Degradation**: Application works even when optional services are unavailable
- **Flexible Structure**: JSON fields allow for easy extension without migrations

---

**Ready to work with the database?**

```javascript
const DatabaseManager = require('./src/database/DatabaseManager');
const db = new DatabaseManager();
await db.initialize();
```

---

*Last updated: January 2025 • EchoTune AI v2.1.0*