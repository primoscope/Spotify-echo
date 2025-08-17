const express = require('express');
const router = express.Router();
const { getRedisManager } = require('../../utils/redis');
const { getMongoManager } = require('../../database/mongodb-manager');

/**
 * Enhanced Music Recommendations API
 * Features: AI-powered recommendations, mood-based filtering, collaborative filtering
 */

// Get personalized recommendations for a user
router.get('/personalized/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20, mood, genre, energy, tempo } = req.query;
        
        // Create cache key based on parameters
        const cacheKey = `recs:personal:${userId}:${mood || 'all'}:${genre || 'all'}:${energy || 'all'}:${tempo || 'all'}:${limit}`;
        
        // Check cache first
        const redis = await getRedisManager();
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        // Get user preferences and listening history
        const mongo = await getMongoManager();
        const userProfile = await mongo.collection('user_profiles').findOne({ spotifyId: userId });
        const listeningHistory = await mongo.collection('listening_history')
            .find({ userId })
            .sort({ playedAt: -1 })
            .limit(100)
            .toArray();
        
        // Generate recommendations based on user preferences
        const recommendations = await generatePersonalizedRecommendations(
            userProfile, 
            listeningHistory, 
            { mood, genre, energy, tempo, limit: parseInt(limit) }
        );
        
        // Cache recommendations for 30 minutes
        await redis.setex(cacheKey, 1800, JSON.stringify(recommendations));
        
        res.json({
            success: true,
            userId,
            recommendations,
            count: recommendations.length,
            filters: { mood, genre, energy, tempo },
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Personalized recommendations error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate personalized recommendations',
            details: error.message
        });
    }
});

// Get mood-based recommendations
router.get('/mood/:mood', async (req, res) => {
    try {
        const { mood } = req.params;
        const { limit = 20, genre, energy, tempo } = req.query;
        
        // Validate mood parameter
        const validMoods = ['happy', 'sad', 'energetic', 'calm', 'romantic', 'mysterious', 'peaceful', 'melancholic'];
        if (!validMoods.includes(mood)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid mood parameter',
                validMoods 
            });
        }
        
        // Create cache key
        const cacheKey = `recs:mood:${mood}:${genre || 'all'}:${energy || 'all'}:${tempo || 'all'}:${limit}`;
        
        // Check cache
        const redis = await getRedisManager();
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        // Generate mood-based recommendations
        const mongo = await getMongoManager();
        const recommendations = await generateMoodBasedRecommendations(
            mood, 
            { genre, energy, tempo, limit: parseInt(limit) }
        );
        
        // Cache for 1 hour
        await redis.setex(cacheKey, 3600, JSON.stringify(recommendations));
        
        res.json({
            success: true,
            mood,
            recommendations,
            count: recommendations.length,
            filters: { genre, energy, tempo },
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Mood-based recommendations error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate mood-based recommendations',
            details: error.message
        });
    }
});

// Get collaborative recommendations (similar users)
router.get('/collaborative/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20 } = req.query;
        
        const cacheKey = `recs:collab:${userId}:${limit}`;
        
        // Check cache
        const redis = await getRedisManager();
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        // Find similar users based on listening patterns
        const mongo = await getMongoManager();
        const similarUsers = await findSimilarUsers(userId, mongo);
        const collaborativeRecs = await generateCollaborativeRecommendations(
            userId, 
            similarUsers, 
            parseInt(limit)
        );
        
        // Cache for 45 minutes
        await redis.setex(cacheKey, 2700, JSON.stringify(collaborativeRecs));
        
        res.json({
            success: true,
            userId,
            similarUsers: similarUsers.length,
            recommendations: collaborativeRecs,
            count: collaborativeRecs.length,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Collaborative recommendations error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate collaborative recommendations',
            details: error.message
        });
    }
});

// Get trending recommendations
router.get('/trending', async (req, res) => {
    try {
        const { limit = 20, timeRange = 'week', genre } = req.query;
        
        const cacheKey = `recs:trending:${timeRange}:${genre || 'all'}:${limit}`;
        
        // Check cache
        const redis = await getRedisManager();
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        // Generate trending recommendations
        const mongo = await getMongoManager();
        const trendingRecs = await generateTrendingRecommendations(
            timeRange, 
            genre, 
            parseInt(limit)
        );
        
        // Cache for 15 minutes (trending changes frequently)
        await redis.setex(cacheKey, 900, JSON.stringify(trendingRecs));
        
        res.json({
            success: true,
            timeRange,
            genre: genre || 'all',
            recommendations: trendingRecs,
            count: trendingRecs.length,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Trending recommendations error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate trending recommendations',
            details: error.message
        });
    }
});

// Get context-aware recommendations (time, activity, weather)
router.get('/contextual/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { 
            timeOfDay, 
            activity, 
            weather, 
            location, 
            limit = 20 
        } = req.query;
        
        const cacheKey = `recs:context:${userId}:${timeOfDay || 'all'}:${activity || 'all'}:${weather || 'all'}:${limit}`;
        
        // Check cache
        const redis = await getRedisManager();
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        // Generate context-aware recommendations
        const mongo = await getMongoManager();
        const contextualRecs = await generateContextualRecommendations(
            userId,
            { timeOfDay, activity, weather, location },
            parseInt(limit)
        );
        
        // Cache for 1 hour
        await redis.setex(cacheKey, 3600, JSON.stringify(contextualRecs));
        
        res.json({
            success: true,
            userId,
            context: { timeOfDay, activity, weather, location },
            recommendations: contextualRecs,
            count: contextualRecs.length,
            generatedAt: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Contextual recommendations error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate contextual recommendations',
            details: error.message
        });
    }
});

// Feedback endpoint for recommendation quality
router.post('/feedback', async (req, res) => {
    try {
        const { userId, trackId, recommendationId, rating, feedback, context } = req.body;
        
        if (!userId || !trackId || !rating) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, trackId, rating'
            });
        }
        
        // Store feedback for improving recommendations
        const mongo = await getMongoManager();
        await mongo.collection('recommendation_feedback').insertOne({
            userId,
            trackId,
            recommendationId,
            rating: parseInt(rating), // 1-5 scale
            feedback: feedback || '',
            context: context || {},
            timestamp: new Date()
        });
        
        res.json({
            success: true,
            message: 'Feedback recorded successfully',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Feedback recording error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to record feedback',
            details: error.message
        });
    }
});

// Helper Functions

async function generatePersonalizedRecommendations(userProfile, listeningHistory, filters) {
    // This would implement sophisticated recommendation algorithms
    // For now, return sample data
    return [
        {
            id: 'rec1',
            title: 'Personalized Track 1',
            artist: 'Artist A',
            album: 'Album X',
            score: 0.95,
            reason: 'Based on your love for similar artists',
            confidence: 0.89
        },
        {
            id: 'rec2',
            title: 'Personalized Track 2',
            artist: 'Artist B',
            album: 'Album Y',
            score: 0.87,
            reason: 'Matches your mood preferences',
            confidence: 0.82
        }
    ];
}

async function generateMoodBasedRecommendations(mood, filters) {
    // Generate recommendations based on mood
    const moodMappings = {
        happy: { valence: { $gte: 0.7 }, energy: { $gte: 0.6 } },
        sad: { valence: { $lte: 0.4 }, energy: { $lte: 0.5 } },
        energetic: { energy: { $gte: 0.8 }, tempo: { $gte: 120 } },
        calm: { energy: { $lte: 0.4 }, valence: { $gte: 0.5 } }
    };
    
    // This would query the database with mood-based filters
    return [
        {
            id: 'mood1',
            title: `${mood.charAt(0).toUpperCase() + mood.slice(1)} Track 1`,
            artist: 'Mood Artist A',
            album: 'Mood Album X',
            score: 0.92,
            reason: `Perfect for ${mood} mood`,
            confidence: 0.88
        }
    ];
}

async function findSimilarUsers(userId, mongo) {
    // Find users with similar listening patterns
    // This would implement collaborative filtering algorithms
    return ['user2', 'user3', 'user4']; // Sample similar user IDs
}

async function generateCollaborativeRecommendations(userId, similarUsers, limit) {
    // Generate recommendations based on similar users' preferences
    return [
        {
            id: 'collab1',
            title: 'Collaborative Track 1',
            artist: 'Collab Artist A',
            album: 'Collab Album X',
            score: 0.91,
            reason: 'Liked by users similar to you',
            confidence: 0.85
        }
    ];
}

async function generateTrendingRecommendations(timeRange, genre, limit) {
    // Generate trending recommendations based on popularity and recent activity
    return [
        {
            id: 'trend1',
            title: 'Trending Track 1',
            artist: 'Trending Artist A',
            album: 'Trending Album X',
            score: 0.94,
            reason: 'Currently trending',
            confidence: 0.90,
            trendScore: 0.95
        }
    ];
}

async function generateContextualRecommendations(userId, context, limit) {
    // Generate recommendations based on context (time, activity, weather, etc.)
    return [
        {
            id: 'context1',
            title: 'Contextual Track 1',
            artist: 'Context Artist A',
            album: 'Context Album X',
            score: 0.89,
            reason: 'Perfect for your current context',
            confidence: 0.83,
            contextMatch: 0.92
        }
    ];
}

module.exports = router;