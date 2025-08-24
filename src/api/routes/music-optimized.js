const express = require('express');
const router = express.Router();
const { getRedisManager } = require('../../utils/redis');
const { getMongoManager } = require('../../database/mongodb-manager');

// Optimized music search endpoint with caching
router.get('/search', async (req, res) => {
    try {
        const { query, limit = 20 } = req.query;
        const cacheKey = `music:search:${query}:${limit}`;
        
        // Check cache first
        const redis = await getRedisManager();
        const cached = await redis.get(cacheKey);
        
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        // Perform search with optimization
        const mongo = await getMongoManager();
        const results = await mongo.collection('tracks')
            .find({ 
                $text: { $search: query } 
            })
            .limit(parseInt(limit))
            .toArray();
        
        // Cache results for 1 hour
        await redis.setex(cacheKey, 3600, JSON.stringify(results));
        
        res.json(results);
        
    } catch (error) {
        console.error('Music search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// High-performance music recommendations
router.get('/recommendations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const cacheKey = `music:recs:${userId}`;
        
        // Check cache
        const redis = await getRedisManager();
        const cached = await redis.get(cacheKey);
        
        if (cached) {
            return res.json(JSON.parse(cached));
        }
        
        // Generate recommendations
        const recommendations = await this.generateRecommendations(userId);
        
        // Cache for 30 minutes
        await redis.setex(cacheKey, 1800, JSON.stringify(recommendations));
        
        res.json(recommendations);
        
    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({ error: 'Recommendations failed' });
    }
});

module.exports = router;