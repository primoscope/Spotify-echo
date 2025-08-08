const express = require('express');
const recommendationEngine = require('../../ml/recommendation-engine');
const { requireAuth, createRateLimit } = require('../middleware');
const cacheManager = require('../cache/cache-manager');
const performanceMonitor = require('../monitoring/performance-monitor');

const router = express.Router();

// Rate limiting for recommendation endpoints
const recommendationRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window per IP
  message: 'Too many recommendation requests, please slow down',
});

/**
 * Get personalized recommendations
 * POST /api/recommendations/generate
 */
router.post('/generate', requireAuth, recommendationRateLimit, async (req, res) => {
  const startTime = performance.now();

  try {
    const {
      limit = 20,
      context,
      mood,
      activity,
      timeOfDay,
      includeNewMusic = true,
      excludeRecentlyPlayed = true,
    } = req.body;

    // Generate cache key for recommendations
    const cacheKey = cacheManager.generateRecommendationKey({
      userId: req.userId,
      limit,
      context,
      mood,
      activity,
      timeOfDay,
      includeNewMusic,
      excludeRecentlyPlayed,
    });

    // Try to get cached recommendations first
    const cachedRecommendations = cacheManager.get('recommendations', cacheKey);
    if (cachedRecommendations) {
      performanceMonitor.recordCustomMetric('recommendations_cache_hit', 1);
      return res.json({
        success: true,
        ...cachedRecommendations.data,
        cached: true,
        userId: req.userId,
        generatedAt: cachedRecommendations.timestamp,
      });
    }

    // Generate new recommendations
    const recommendations = await recommendationEngine.generateRecommendations(req.userId, {
      limit,
      context,
      mood,
      activity,
      timeOfDay,
      includeNewMusic,
      excludeRecentlyPlayed,
    });

    // Cache the recommendations
    cacheManager.set('recommendations', cacheKey, recommendations, 900); // Cache for 15 minutes

    // Record performance metrics
    const endTime = performance.now();
    performanceMonitor.recordCustomMetric('recommendations_generation', endTime - startTime);
    performanceMonitor.recordCustomMetric('recommendations_cache_miss', 1);

    res.json({
      success: true,
      ...recommendations,
      cached: false,
      userId: req.userId,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    performanceMonitor.recordCustomMetric('recommendations_error', 1);
    res.status(500).json({
      error: 'Failed to generate recommendations',
      message: error.message,
    });
  }
});

/**
 * Get recommendations based on mood
 * GET /api/recommendations/mood/:mood
 */
router.get('/mood/:mood', requireAuth, recommendationRateLimit, async (req, res) => {
  try {
    const { mood } = req.params;
    const { limit = 20 } = req.query;

    const validMoods = [
      'happy',
      'sad',
      'energetic',
      'calm',
      'upbeat',
      'melancholy',
      'focused',
      'party',
    ];
    if (!validMoods.includes(mood.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid mood',
        message: `Mood must be one of: ${validMoods.join(', ')}`,
      });
    }

    const recommendations = await recommendationEngine.generateRecommendations(req.userId, {
      limit: parseInt(limit),
      mood: mood.toLowerCase(),
    });

    res.json({
      success: true,
      mood: mood.toLowerCase(),
      ...recommendations,
    });
  } catch (error) {
    console.error('Error getting mood recommendations:', error);
    res.status(500).json({
      error: 'Failed to get mood recommendations',
      message: error.message,
    });
  }
});

/**
 * Get recommendations based on activity
 * GET /api/recommendations/activity/:activity
 */
router.get('/activity/:activity', requireAuth, recommendationRateLimit, async (req, res) => {
  try {
    const { activity } = req.params;
    const { limit = 20 } = req.query;

    const validActivities = ['workout', 'study', 'party', 'relaxation', 'commute', 'work', 'sleep'];
    if (!validActivities.includes(activity.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid activity',
        message: `Activity must be one of: ${validActivities.join(', ')}`,
      });
    }

    const recommendations = await recommendationEngine.generateRecommendations(req.userId, {
      limit: parseInt(limit),
      activity: activity.toLowerCase(),
    });

    res.json({
      success: true,
      activity: activity.toLowerCase(),
      ...recommendations,
    });
  } catch (error) {
    console.error('Error getting activity recommendations:', error);
    res.status(500).json({
      error: 'Failed to get activity recommendations',
      message: error.message,
    });
  }
});

/**
 * Get similar tracks to a given track
 * POST /api/recommendations/similar
 */
router.post('/similar', requireAuth, recommendationRateLimit, async (req, res) => {
  try {
    const { trackId, limit = 10 } = req.body;

    if (!trackId) {
      return res.status(400).json({
        error: 'Missing track ID',
        message: 'trackId is required',
      });
    }

    const similarTracks = await recommendationEngine.contentFilter.findSimilarTracks(trackId, {
      limit: parseInt(limit),
    });

    res.json({
      success: true,
      seedTrack: trackId,
      similarTracks,
      count: similarTracks.length,
    });
  } catch (error) {
    console.error('Error finding similar tracks:', error);
    res.status(500).json({
      error: 'Failed to find similar tracks',
      message: error.message,
    });
  }
});

/**
 * Get user's recommendation history
 * GET /api/recommendations/history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const db = require('../../database/mongodb').getDb();
    const recommendationsCollection = db.collection('recommendations');

    const [recommendations, total] = await Promise.all([
      recommendationsCollection
        .find({ user_id: req.userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      recommendationsCollection.countDocuments({ user_id: req.userId }),
    ]);

    res.json({
      success: true,
      recommendations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error getting recommendation history:', error);
    res.status(500).json({
      error: 'Failed to get recommendation history',
      message: error.message,
    });
  }
});

/**
 * Provide feedback on recommendations
 * POST /api/recommendations/feedback
 */
router.post('/feedback', requireAuth, async (req, res) => {
  try {
    const { recommendationId, trackId, feedback, rating } = req.body;

    if (!recommendationId || !trackId || (!feedback && !rating)) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'recommendationId, trackId, and either feedback or rating are required',
      });
    }

    const validFeedback = ['like', 'dislike', 'save', 'skip'];
    if (feedback && !validFeedback.includes(feedback)) {
      return res.status(400).json({
        error: 'Invalid feedback',
        message: `Feedback must be one of: ${validFeedback.join(', ')}`,
      });
    }

    const db = require('../../database/mongodb').getDb();
    const recommendationsCollection = db.collection('recommendations');

    // Update recommendation with feedback
    const updateData = {
      [`user_feedback.${trackId}`]: {
        feedback: feedback || null,
        rating: rating || null,
        timestamp: new Date(),
      },
      updated_at: new Date(),
    };

    await recommendationsCollection.updateOne(
      { _id: recommendationId, user_id: req.userId },
      { $set: updateData }
    );

    // Update recommendation engine weights based on feedback
    if (feedback === 'like' || rating > 3) {
      // Positive feedback - could adjust algorithm weights
      console.log(`Positive feedback for track ${trackId} in recommendation ${recommendationId}`);
    }

    res.json({
      success: true,
      message: 'Feedback recorded successfully',
      feedbackData: updateData[`user_feedback.${trackId}`],
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      error: 'Failed to record feedback',
      message: error.message,
    });
  }
});

/**
 * Get trending/popular recommendations
 * GET /api/recommendations/trending
 */
router.get('/trending', recommendationRateLimit, async (req, res) => {
  try {
    const { limit = 20, genre, timeframe = 'week' } = req.query;

    const recommendations = await recommendationEngine.generatePopularRecommendations(
      parseInt(limit),
      {
        genre,
        timeframe,
      }
    );

    res.json({
      success: true,
      type: 'trending',
      timeframe,
      genre: genre || 'all',
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Error getting trending recommendations:', error);
    res.status(500).json({
      error: 'Failed to get trending recommendations',
      message: error.message,
    });
  }
});

/**
 * Get personalized playlist recommendations
 * POST /api/recommendations/playlist
 */
router.post('/playlist', requireAuth, recommendationRateLimit, async (req, res) => {
  try {
    const { playlistName, trackCount = 30, mood, activity, genres, audioFeatures } = req.body;

    if (!playlistName) {
      return res.status(400).json({
        error: 'Missing playlist name',
        message: 'playlistName is required',
      });
    }

    const recommendations = await recommendationEngine.generateRecommendations(req.userId, {
      limit: trackCount,
      mood,
      activity,
      genres,
      audioFeatures,
    });

    const playlistData = {
      name: playlistName,
      description: `Personalized playlist generated by EchoTune AI${mood ? ` for ${mood} mood` : ''}${activity ? ` for ${activity}` : ''}`,
      tracks: recommendations.recommendations,
      metadata: recommendations.metadata,
      createdAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      playlist: playlistData,
      trackCount: recommendations.recommendations.length,
    });
  } catch (error) {
    console.error('Error generating playlist recommendations:', error);
    res.status(500).json({
      error: 'Failed to generate playlist recommendations',
      message: error.message,
    });
  }
});

/**
 * Explain a specific recommendation
 * GET /api/recommendations/:id/explain
 */
router.get('/:id/explain', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { trackId } = req.query;

    if (!id) {
      return res.status(400).json({
        error: 'Missing recommendation ID',
      });
    }

    const db = require('../../database/mongodb').getDb();
    const recommendationsCollection = db.collection('recommendations');

    // Get the recommendation
    const recommendation = await recommendationsCollection.findOne({
      _id: require('mongodb').ObjectId.isValid(id) ? new require('mongodb').ObjectId(id) : id,
      user_id: req.userId,
    });

    if (!recommendation) {
      return res.status(404).json({
        error: 'Recommendation not found',
      });
    }

    // Generate explanation based on recommendation type and data
    const explanation = await generateRecommendationExplanation(
      recommendation,
      trackId,
      req.userId
    );

    res.json({
      success: true,
      recommendationId: id,
      trackId: trackId || null,
      explanation,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error explaining recommendation:', error);
    res.status(500).json({
      error: 'Failed to explain recommendation',
      message: error.message,
    });
  }
});

/**
 * Get recommendation algorithm insights
 * GET /api/recommendations/insights
 */
router.get('/insights', requireAuth, async (req, res) => {
  try {
    const db = require('../../database/mongodb').getDb();

    // Get user's recent recommendations for analysis
    const recommendationsCollection = db.collection('recommendations');
    const recentRecommendations = await recommendationsCollection
      .find({ user_id: req.userId })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    // Calculate algorithm performance
    const insights = {
      totalRecommendations: recentRecommendations.length,
      algorithmBreakdown: {
        contentBased: recentRecommendations.filter((r) => r.recommendation_type === 'content_based')
          .length,
        collaborative: recentRecommendations.filter(
          (r) => r.recommendation_type === 'collaborative'
        ).length,
        hybrid: recentRecommendations.filter((r) => r.recommendation_type === 'hybrid').length,
      },
      averageConfidence:
        recentRecommendations.reduce((sum, r) => sum + (r.confidence_score || 0), 0) /
          recentRecommendations.length || 0,
      feedbackStats: {
        liked: 0,
        disliked: 0,
        saved: 0,
      },
    };

    // Count feedback
    recentRecommendations.forEach((rec) => {
      if (rec.user_feedback) {
        Object.values(rec.user_feedback).forEach((feedback) => {
          if (feedback.feedback === 'like') insights.feedbackStats.liked++;
          if (feedback.feedback === 'dislike') insights.feedbackStats.disliked++;
          if (feedback.feedback === 'save') insights.feedbackStats.saved++;
        });
      }
    });

    res.json({
      success: true,
      insights,
      recommendations: recentRecommendations.map((r) => ({
        id: r._id,
        type: r.recommendation_type,
        confidence: r.confidence_score,
        createdAt: r.created_at,
        trackCount: r.tracks?.length || 0,
      })),
    });
  } catch (error) {
    console.error('Error getting recommendation insights:', error);
    res.status(500).json({
      error: 'Failed to get recommendation insights',
      message: error.message,
    });
  }
});

/**
 * Generate human-readable explanation for a recommendation
 */
async function generateRecommendationExplanation(recommendation, trackId, userId) {
  try {
    const db = require('../../database/mongodb').getDb();

    // Get user's listening history and preferences for context
    const userProfile = await getUserListeningProfile(userId, db);

    const explanation = {
      summary: '',
      reasons: [],
      confidence: recommendation.confidence_score || 0.7,
      algorithm: recommendation.recommendation_type || 'hybrid',
      factors: [],
    };

    // Base explanation on algorithm type
    switch (recommendation.recommendation_type) {
      case 'content_based':
        explanation.summary =
          'This recommendation is based on the musical characteristics of songs you\'ve enjoyed.';
        explanation.reasons.push('Analyzes audio features like tempo, energy, and mood');
        explanation.factors.push({
          type: 'audio_features',
          description: 'Musical similarity to your liked tracks',
          weight: 0.8,
        });
        break;

      case 'collaborative':
        explanation.summary =
          'This recommendation comes from users with similar music taste to yours.';
        explanation.reasons.push('Based on listening patterns of users with similar preferences');
        explanation.factors.push({
          type: 'user_similarity',
          description: 'Recommended by users with similar taste',
          weight: 0.7,
        });
        break;

      case 'hybrid':
      default:
        explanation.summary =
          'This recommendation combines multiple AI algorithms for the best results.';
        explanation.reasons.push('Combines content analysis with user behavior patterns');
        explanation.factors.push(
          {
            type: 'content_similarity',
            description: 'Musical features match your preferences',
            weight: 0.4,
          },
          {
            type: 'collaborative_filtering',
            description: 'Liked by similar users',
            weight: 0.3,
          },
          {
            type: 'context_aware',
            description: 'Fits your current mood and activity',
            weight: 0.2,
          }
        );
        break;
    }

    // Add context-specific reasons
    if (recommendation.context?.mood) {
      explanation.reasons.push(`Matches your current mood: ${recommendation.context.mood}`);
      explanation.factors.push({
        type: 'mood_context',
        description: `Selected for ${recommendation.context.mood} mood`,
        weight: 0.3,
      });
    }

    if (recommendation.context?.activity) {
      explanation.reasons.push(`Perfect for your activity: ${recommendation.context.activity}`);
      explanation.factors.push({
        type: 'activity_context',
        description: `Optimized for ${recommendation.context.activity}`,
        weight: 0.2,
      });
    }

    if (recommendation.context?.timeOfDay) {
      const timeContext = getTimeOfDayDescription(recommendation.context.timeOfDay);
      explanation.reasons.push(`Recommended for ${timeContext}`);
    }

    // Add user-specific reasons if we have profile data
    if (userProfile.topGenres && userProfile.topGenres.length > 0) {
      explanation.reasons.push(
        `Includes genres you love: ${userProfile.topGenres.slice(0, 3).join(', ')}`
      );
    }

    if (userProfile.recentlyPlayedArtists && userProfile.recentlyPlayedArtists.length > 0) {
      explanation.reasons.push('Similar to artists you\'ve been listening to recently');
    }

    // Add specific track explanation if trackId provided
    if (trackId && recommendation.tracks) {
      const specificTrack = recommendation.tracks.find((t) => t.id === trackId);
      if (specificTrack) {
        explanation.trackSpecific = {
          name: specificTrack.name,
          artist: specificTrack.artist,
          reasons: generateTrackSpecificReasons(specificTrack, userProfile, recommendation),
        };
      }
    }

    return explanation;
  } catch (error) {
    console.error('Error generating recommendation explanation:', error);
    return {
      summary: 'This recommendation was generated using our AI algorithms.',
      reasons: ['Based on your listening history and preferences'],
      confidence: 0.5,
      algorithm: 'unknown',
      factors: [],
    };
  }
}

/**
 * Get user's listening profile for explanation context
 */
async function getUserListeningProfile(userId, db) {
  try {
    // This would typically come from your user profile collection
    // For now, we'll create a basic profile from recent activity

    const listeningHistoryCollection = db.collection('listening_history');
    const recentTracks = await listeningHistoryCollection
      .find({ user_id: userId })
      .sort({ played_at: -1 })
      .limit(100)
      .toArray();

    const profile = {
      topGenres: [],
      topArtists: [],
      recentlyPlayedArtists: [],
      averageAudioFeatures: {},
      listeningPatterns: {},
    };

    if (recentTracks.length > 0) {
      // Extract genres and artists
      const genreMap = {};
      const artistMap = {};

      recentTracks.forEach((track) => {
        if (track.genres) {
          track.genres.forEach((genre) => {
            genreMap[genre] = (genreMap[genre] || 0) + 1;
          });
        }
        if (track.artist) {
          artistMap[track.artist] = (artistMap[track.artist] || 0) + 1;
        }
      });

      profile.topGenres = Object.entries(genreMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry) => entry[0]);

      profile.topArtists = Object.entries(artistMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map((entry) => entry[0]);

      profile.recentlyPlayedArtists = recentTracks
        .slice(0, 20)
        .map((track) => track.artist)
        .filter((artist, index, arr) => arr.indexOf(artist) === index);
    }

    return profile;
  } catch (error) {
    console.error('Error getting user listening profile:', error);
    return {
      topGenres: [],
      topArtists: [],
      recentlyPlayedArtists: [],
      averageAudioFeatures: {},
      listeningPatterns: {},
    };
  }
}

/**
 * Generate track-specific reasons for recommendation
 */
function generateTrackSpecificReasons(track, userProfile, recommendation) {
  const reasons = [];

  // Check if artist is in user's top artists
  if (userProfile.topArtists && userProfile.topArtists.includes(track.artist)) {
    reasons.push(`You frequently listen to ${track.artist}`);
  }

  // Check genre matching
  if (track.genres && userProfile.topGenres) {
    const matchingGenres = track.genres.filter((genre) => userProfile.topGenres.includes(genre));
    if (matchingGenres.length > 0) {
      reasons.push(`Features ${matchingGenres[0]} genre that you enjoy`);
    }
  }

  // Audio feature similarity (if available)
  if (track.audioFeatures) {
    if (track.audioFeatures.energy > 0.7) {
      reasons.push('High energy track perfect for active listening');
    }
    if (track.audioFeatures.valence > 0.7) {
      reasons.push('Upbeat and positive vibe');
    }
    if (track.audioFeatures.danceability > 0.7) {
      reasons.push('Great for dancing and movement');
    }
  }

  // Context-based reasons
  if (recommendation.context?.mood === 'energetic' && track.audioFeatures?.energy > 0.6) {
    reasons.push('Perfect energy level for your current mood');
  }

  if (recommendation.context?.activity === 'workout' && track.audioFeatures?.tempo > 120) {
    reasons.push('Ideal tempo for workout activities');
  }

  return reasons.length > 0 ? reasons : ['Selected by our AI algorithm for your taste'];
}

/**
 * Convert time of day to human-readable description
 */
function getTimeOfDayDescription(timeOfDay) {
  const hour = parseInt(timeOfDay);

  if (hour >= 5 && hour < 12) return 'morning listening';
  if (hour >= 12 && hour < 17) return 'afternoon vibes';
  if (hour >= 17 && hour < 22) return 'evening relaxation';
  return 'late night mood';
}

module.exports = router;
