const mongoose = require('mongoose');

/**
 * Enhanced Music Database Schema
 * Features: Comprehensive music data models, optimized indexes, advanced analytics support
 */

// Enhanced Track Schema with Spotify integration
const enhancedTrackSchema = new mongoose.Schema({
    // Spotify identifiers
    spotifyId: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    spotifyUri: { 
        type: String, 
        required: true, 
        index: true 
    },
    
    // Basic track information
    title: { 
        type: String, 
        required: true, 
        index: 'text' 
    },
    artist: { 
        type: String, 
        required: true, 
        index: true 
    },
    album: { 
        type: String, 
        required: true, 
        index: true 
    },
    albumId: { 
        type: String, 
        index: true 
    },
    
    // Audio metadata
    duration: { 
        type: Number, 
        required: true, 
        index: true 
    },
    trackNumber: { 
        type: Number 
    },
    discNumber: { 
        type: Number 
    },
    
    // Audio features (Spotify API)
    audioFeatures: {
        danceability: { 
            type: Number, 
            index: true,
            min: 0, 
            max: 1 
        },
        energy: { 
            type: Number, 
            index: true,
            min: 0, 
            max: 1 
        },
        key: { 
            type: Number, 
            index: true,
            min: 0, 
            max: 11 
        },
        loudness: { 
            type: Number, 
            index: true 
        },
        mode: { 
            type: Number, 
            index: true 
        }, // 0 = minor, 1 = major
        speechiness: { 
            type: Number, 
            index: true,
            min: 0, 
            max: 1 
        },
        acousticness: { 
            type: Number, 
            index: true,
            min: 0, 
            max: 1 
        },
        instrumentalness: { 
            type: Number, 
            index: true,
            min: 0, 
            max: 1 
        },
        liveness: { 
            type: Number, 
            index: true,
            min: 0, 
            max: 1 
        },
        valence: { 
            type: Number, 
            index: true,
            min: 0, 
            max: 1 
        },
        tempo: { 
            type: Number, 
            index: true 
        },
        timeSignature: { 
            type: Number, 
            index: true 
        }
    },
    
    // Genre and mood classification
    genres: [{ 
        type: String, 
        index: true 
    }],
    primaryGenre: { 
        type: String, 
        index: true 
    },
    mood: { 
        type: String, 
        index: true,
        enum: ['happy', 'sad', 'energetic', 'calm', 'romantic', 'mysterious', 'peaceful', 'melancholic']
    },
    energyLevel: { 
        type: String, 
        index: true,
        enum: ['low', 'medium', 'high']
    },
    
    // Popularity and metrics
    popularity: { 
        type: Number, 
        index: true,
        min: 0, 
        max: 100 
    },
    playCount: { 
        type: Number, 
        default: 0, 
        index: true 
    },
    likeCount: { 
        type: Number, 
        default: 0, 
        index: true 
    },
    skipCount: { 
        type: Number, 
        default: 0, 
        index: true 
    },
    
    // Release information
    releaseDate: { 
        type: Date, 
        index: true 
    },
    releaseYear: { 
        type: Number, 
        index: true 
    },
    
    // External URLs
    externalUrls: {
        spotify: String,
        previewUrl: String,
        albumArt: String
    },
    
    // AI-generated insights
    aiInsights: {
        emotionScore: { 
            type: Number, 
            min: -1, 
            max: 1 
        },
        complexityScore: { 
            type: Number, 
            min: 0, 
            max: 1 
        },
        culturalInfluence: { 
            type: String 
        },
        lyricalThemes: [{ 
            type: String 
        }]
    },
    
    // Timestamps
    createdAt: { 
        type: Date, 
        default: Date.now, 
        index: true 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now, 
        index: true 
    }
}, {
    timestamps: true
});

// Enhanced User Profile Schema
const enhancedUserProfileSchema = new mongoose.Schema({
    // Spotify user information
    spotifyId: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    displayName: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        index: true 
    },
    
    // Profile information
    avatar: { 
        type: String 
    },
    country: { 
        type: String, 
        index: true 
    },
    birthdate: { 
        type: Date 
    },
    
    // Music preferences
    favoriteGenres: [{ 
        type: String, 
        index: true 
    }],
    favoriteArtists: [{ 
        type: String, 
        index: true 
    }],
    preferredMoods: [{ 
        type: String, 
        index: true 
    }],
    energyPreference: { 
        type: String, 
        enum: ['low', 'medium', 'high'] 
    },
    tempoPreference: { 
        type: String, 
        enum: ['slow', 'medium', 'fast'] 
    },
    
    // Listening behavior
    totalListeningTime: { 
        type: Number, 
        default: 0 
    },
    averageSessionLength: { 
        type: Number, 
        default: 0 
    },
    preferredListeningTimes: [{ 
        type: String 
    }], // ['morning', 'afternoon', 'evening', 'night']
    
    // AI-generated profile
    aiProfile: {
        personalityType: { 
            type: String 
        },
        musicTasteComplexity: { 
            type: Number, 
            min: 0, 
            max: 1 
        },
        opennessToNewMusic: { 
            type: Number, 
            min: 0, 
            max: 1 
        },
        socialListeningTendency: { 
            type: Number, 
            min: 0, 
            max: 1 
        }
    },
    
    // Settings and preferences
    settings: {
        explicitContent: { 
            type: Boolean, 
            default: false 
        },
        crossfade: { 
            type: Number, 
            default: 0, 
            min: 0, 
            max: 12 
        },
        audioQuality: { 
            type: String, 
            enum: ['low', 'medium', 'high'], 
            default: 'medium' 
        },
        notifications: {
            newReleases: { type: Boolean, default: true },
            recommendations: { type: Boolean, default: true },
            socialActivity: { type: Boolean, default: true }
        }
    },
    
    // Timestamps
    createdAt: { 
        type: Date, 
        default: Date.now, 
        index: true 
    },
    lastActive: { 
        type: Date, 
        default: Date.now, 
        index: true 
    }
}, {
    timestamps: true
});

// Enhanced Listening History Schema
const enhancedListeningHistorySchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        index: true 
    },
    trackId: { 
        type: String, 
        required: true, 
        index: true 
    },
    
    // Listening session details
    sessionId: { 
        type: String, 
        index: true 
    },
    playedAt: { 
        type: Date, 
        required: true, 
        index: true 
    },
    duration: { 
        type: Number, 
        required: true 
    }, // How long the track was actually played
    completionRate: { 
        type: Number, 
        min: 0, 
        max: 1 
    }, // How much of the track was completed
    
    // Context information
    context: {
        source: { 
            type: String, 
            index: true 
        }, // 'search', 'playlist', 'recommendation', 'radio'
        playlistId: { 
            type: String, 
            index: true 
        },
        recommendationId: { 
            type: String, 
            index: true 
        },
        device: { 
            type: String 
        },
        location: { 
            type: String 
        },
        timeOfDay: { 
            type: String, 
            index: true 
        },
        dayOfWeek: { 
            type: String, 
            index: true 
        }
    },
    
    // User interaction
    userActions: {
        skipped: { 
            type: Boolean, 
            default: false 
        },
        liked: { 
            type: Boolean, 
            default: false 
        },
        addedToPlaylist: { 
            type: Boolean, 
            default: false 
        },
        shared: { 
            type: Boolean, 
            default: false 
        }
    },
    
    // Performance metrics
    performance: {
        loadTime: { 
            type: Number 
        },
        bufferStalls: { 
            type: Number 
        },
        audioQuality: { 
            type: String 
        }
    }
}, {
    timestamps: true
});

// Enhanced Playlist Schema
const enhancedPlaylistSchema = new mongoose.Schema({
    spotifyId: { 
        type: String, 
        required: true, 
        unique: true, 
        index: true 
    },
    name: { 
        type: String, 
        required: true, 
        index: 'text' 
    },
    description: { 
        type: String 
    },
    owner: { 
        type: String, 
        required: true, 
        index: true 
    },
    
    // Playlist details
    isPublic: { 
        type: Boolean, 
        default: true, 
        index: true 
    },
    isCollaborative: { 
        type: Boolean, 
        default: false 
    },
    totalTracks: { 
        type: Number, 
        default: 0, 
        index: true 
    },
    totalDuration: { 
        type: Number, 
        default: 0 
    },
    
    // Playlist metadata
    coverImage: { 
        type: String 
    },
    tags: [{ 
        type: String, 
        index: true 
    }],
    mood: { 
        type: String, 
        index: true 
    },
    genre: { 
        type: String, 
        index: true 
    },
    
    // AI-generated insights
    aiInsights: {
        moodConsistency: { 
            type: Number, 
            min: 0, 
            max: 1 
        },
        genreDiversity: { 
            type: Number, 
            min: 0, 
            max: 1 
        },
        energyFlow: { 
            type: String 
        }, // 'ascending', 'descending', 'mixed', 'consistent'
        recommendedFor: [{ 
            type: String 
        }] // ['workout', 'study', 'party', 'relaxation']
    },
    
    // Statistics
    stats: {
        playCount: { 
            type: Number, 
            default: 0 
        },
        likeCount: { 
            type: Number, 
            default: 0 
        },
        followerCount: { 
            type: Number, 
            default: 0 
        },
        lastUpdated: { 
            type: Date, 
            default: Date.now 
        }
    },
    
    // Timestamps
    createdAt: { 
        type: Date, 
        default: Date.now, 
        index: true 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now, 
        index: true 
    }
}, {
    timestamps: true
});

// Enhanced Recommendation Schema
const enhancedRecommendationSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true, 
        index: true 
    },
    trackId: { 
        type: String, 
        required: true, 
        index: true 
    },
    
    // Recommendation details
    type: { 
        type: String, 
        required: true, 
        index: true,
        enum: ['personalized', 'collaborative', 'content-based', 'trending', 'contextual']
    },
    score: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 1, 
        index: true 
    },
    confidence: { 
        type: Number, 
        required: true, 
        min: 0, 
        max: 1 
    },
    
    // Context and reasoning
    context: {
        mood: { 
            type: String, 
            index: true 
        },
        genre: { 
            type: String, 
            index: true 
        },
        timeOfDay: { 
            type: String, 
            index: true 
        },
        activity: { 
            type: String, 
            index: true 
        },
        weather: { 
            type: String, 
            index: true 
        }
    },
    
    reason: { 
        type: String 
    }, // Human-readable explanation
    
    // User feedback
    feedback: {
        rating: { 
            type: Number, 
            min: 1, 
            max: 5, 
            index: true 
        },
        liked: { 
            type: Boolean, 
            index: true 
        },
        skipped: { 
            type: Boolean, 
            index: true 
        },
        addedToPlaylist: { 
            type: Boolean, 
            index: true 
        }
    },
    
    // Timestamps
    createdAt: { 
        type: Date, 
        default: Date.now, 
        index: true 
    },
    expiresAt: { 
        type: Date, 
        index: true 
    } // When this recommendation expires
}, {
    timestamps: true
});

// Enhanced Analytics Schema
const enhancedAnalyticsSchema = new mongoose.Schema({
    // Analytics metadata
    type: { 
        type: String, 
        required: true, 
        index: true,
        enum: ['user_behavior', 'music_trends', 'system_performance', 'recommendation_quality']
    },
    period: { 
        type: String, 
        required: true, 
        index: true,
        enum: ['hourly', 'daily', 'weekly', 'monthly']
    },
    startDate: { 
        type: Date, 
        required: true, 
        index: true 
    },
    endDate: { 
        type: Date, 
        required: true, 
        index: true 
    },
    
    // Metrics data
    metrics: {
        totalUsers: { 
            type: Number, 
            default: 0 
        },
        activeUsers: { 
            type: Number, 
            default: 0 
        },
        totalPlays: { 
            type: Number, 
            default: 0 
        },
        totalListeningTime: { 
            type: Number, 
            default: 0 
        },
        averageSessionLength: { 
            type: Number, 
            default: 0 
        },
        recommendationAccuracy: { 
            type: Number, 
            default: 0 
        },
        userRetention: { 
            type: Number, 
            default: 0 
        }
    },
    
    // Detailed breakdowns
    breakdowns: {
        byGenre: { 
            type: Map, 
            of: Number 
        },
        byMood: { 
            type: Map, 
            of: Number 
        },
        byTimeOfDay: { 
            type: Map, 
            of: Number 
        },
        byDevice: { 
            type: Map, 
            of: Number 
        }
    },
    
    // Timestamps
    createdAt: { 
        type: Date, 
        default: Date.now, 
        index: true 
    }
}, {
    timestamps: true
});

// Create models
const EnhancedTrack = mongoose.model('EnhancedTrack', enhancedTrackSchema);
const EnhancedUserProfile = mongoose.model('EnhancedUserProfile', enhancedUserProfileSchema);
const EnhancedListeningHistory = mongoose.model('EnhancedListeningHistory', enhancedListeningHistorySchema);
const EnhancedPlaylist = mongoose.model('EnhancedPlaylist', enhancedPlaylistSchema);
const EnhancedRecommendation = mongoose.model('EnhancedRecommendation', enhancedRecommendationSchema);
const EnhancedAnalytics = mongoose.model('EnhancedAnalytics', enhancedAnalyticsSchema);

// Create compound indexes for optimal performance
async function createIndexes() {
    try {
        // Track indexes
        await EnhancedTrack.collection.createIndex({ 
            'audioFeatures.energy': 1, 
            'audioFeatures.valence': 1, 
            'audioFeatures.tempo': 1 
        });
        
        await EnhancedTrack.collection.createIndex({ 
            genre: 1, 
            mood: 1, 
            popularity: -1 
        });
        
        await EnhancedTrack.collection.createIndex({ 
            releaseYear: -1, 
            popularity: -1 
        });
        
        // Listening history indexes
        await EnhancedListeningHistory.collection.createIndex({ 
            userId: 1, 
            playedAt: -1 
        });
        
        await EnhancedListeningHistory.collection.createIndex({ 
            trackId: 1, 
            playedAt: -1 
        });
        
        // User profile indexes
        await EnhancedUserProfile.collection.createIndex({ 
            favoriteGenres: 1, 
            preferredMoods: 1 
        });
        
        // Recommendation indexes
        await EnhancedRecommendation.collection.createIndex({ 
            userId: 1, 
            type: 1, 
            score: -1 
        });
        
        await EnhancedRecommendation.collection.createIndex({ 
            expiresAt: 1 
        }, { expireAfterSeconds: 0 });
        
        // Analytics indexes
        await EnhancedAnalytics.collection.createIndex({ 
            type: 1, 
            period: 1, 
            startDate: -1 
        });
        
        console.log('Enhanced music database indexes created successfully');
    } catch (error) {
        console.error('Error creating indexes:', error);
    }
}

module.exports = {
    EnhancedTrack,
    EnhancedUserProfile,
    EnhancedListeningHistory,
    EnhancedPlaylist,
    EnhancedRecommendation,
    EnhancedAnalytics,
    createIndexes
};