const databaseManager = require('../database/database-manager');

/**
 * Enhanced Real-time Recommendation Engine for EchoTune AI
 * Integrates ML algorithms to learn user preferences and provide dynamic music recommendations
 */
class RecommendationEngine {
  constructor() {
    this.userProfiles = new Map();
    this.recommendations = new Map();
    this.feedbackQueue = [];
    this.initialized = false;
    
    // Algorithm weights for hybrid recommendations
    this.weights = {
      content_based: 0.4,
      collaborative: 0.3,
      context_aware: 0.2,
      trending: 0.1
    };
  }

  /**
   * Initialize the recommendation engine
   */
  async initialize() {
    try {
      console.log('🎯 Initializing Real-time Recommendation Engine...');
      
      // Start background processing
      this.startBackgroundProcessing();
      
      this.initialized = true;
      console.log('✅ Recommendation Engine initialized');
      return true;
    } catch (error) {
      console.error('Recommendation Engine initialization failed:', error);
      return false;
    }
  }

  /**
   * Generate personalized recommendations for a user
   */
  async generateRecommendations(userId, options = {}) {
    try {
      const {
        limit = 20,
        context = {},
        mood = null,
        activity = null,
        timeOfDay = null
      } = options;

      // Get user profile
      const userProfile = await this.getUserProfile(userId);
      
      // Get listening history
      const listeningHistory = await this.getListeningHistory(userId, { limit: 100 });
      
      // Generate context-aware recommendations
      const recommendations = await this.computeRecommendations(
        userProfile,
        listeningHistory,
        {
          mood,
          activity,
          timeOfDay: timeOfDay || this.getCurrentTimeContext(),
          limit
        }
      );

      // Store recommendations for future reference
      this.recommendations.set(userId, {
        recommendations,
        timestamp: Date.now(),
        context: { mood, activity, timeOfDay }
      });

      return {
        success: true,
        recommendations,
        userProfile: userProfile.summary,
        context: { mood, activity, timeOfDay }
      };
    } catch (error) {
      console.error('Generate recommendations error:', error);
      return {
        success: false,
        error: error.message,
        recommendations: []
      };
    }
  }
      ]);

      // Apply context filters
      let recommendations = this.combineRecommendations(
        contentRecommendations,
        collaborativeRecommendations,
        popularRecommendations
      );

      // Apply context-based filtering
      if (context || timeOfDay) {
        recommendations = await this.applyContextFiltering(recommendations, {
          context,
          timeOfDay,
          userProfile
        });
      }

      // Filter out recently played tracks if requested
      if (excludeRecentlyPlayed) {
        const recentTrackIds = listeningHistory
          .filter(h => Date.now() - new Date(h.played_at).getTime() < 7 * 24 * 60 * 60 * 1000) // Last 7 days
          .map(h => h.track_id);
        
        recommendations = recommendations.filter(rec => !recentTrackIds.includes(rec.track_id));
      }

      // Ensure diversity in recommendations
      recommendations = this.ensureDiversity(recommendations, {
        maxPerArtist: Math.ceil(limit / 10),
        maxPerGenre: Math.ceil(limit / 5)
      });

      // Limit and add metadata
      const finalRecommendations = recommendations.slice(0, limit);
      
      // Save recommendations to database
      await this.saveRecommendations(userId, {
        tracks: finalRecommendations,
        recommendation_type: 'hybrid',
        parameters: options,
        confidence_score: this.calculateConfidenceScore(finalRecommendations, listeningHistory)
      });

      return {
        recommendations: finalRecommendations,
        metadata: {
          user_profile: userProfile,
          context: { timeOfDay },
          algorithm_weights: this.weights,
          diversity_stats: this.calculateDiversityStats(finalRecommendations)
        }
      };

    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  /**
   * Combine different recommendation sources
   */
  combineRecommendations(contentRecs, collaborativeRecs, popularRecs) {
    const combinedMap = new Map();
    
    // Add content-based recommendations
    contentRecs.forEach((rec, index) => {
      const score = (contentRecs.length - index) / contentRecs.length * this.weights.content_based;
      combinedMap.set(rec.track_id, {
        ...rec,
        combined_score: score,
        sources: ['content_based']
      });
    });

    // Add collaborative recommendations
    collaborativeRecs.forEach((rec, index) => {
      const score = (collaborativeRecs.length - index) / collaborativeRecs.length * this.weights.collaborative;
      if (combinedMap.has(rec.track_id)) {
        const existing = combinedMap.get(rec.track_id);
        existing.combined_score += score;
        existing.sources.push('collaborative');
      } else {
        combinedMap.set(rec.track_id, {
          ...rec,
          combined_score: score,
          sources: ['collaborative']
        });
      }
    });

    // Add popular recommendations
    popularRecs.forEach((rec, index) => {
      const score = (popularRecs.length - index) / popularRecs.length * this.weights.popularity;
      if (combinedMap.has(rec.track_id)) {
        const existing = combinedMap.get(rec.track_id);
        existing.combined_score += score;
        existing.sources.push('popularity');
      } else {
        combinedMap.set(rec.track_id, {
          ...rec,
          combined_score: score,
          sources: ['popularity']
        });
      }
    });

    // Sort by combined score
    return Array.from(combinedMap.values())
      .sort((a, b) => b.combined_score - a.combined_score);
  }

  /**
   * Apply context-based filtering
   */
  async applyContextFiltering(recommendations, context) {
    const { mood, activity, timeOfDay } = context;
    
    return recommendations.map(rec => {
      let contextScore = 1.0;
      
      if (rec.audio_features) {
        const features = rec.audio_features;
        
        // Mood-based scoring
        if (mood) {
          switch (mood.toLowerCase()) {
            case 'happy':
            case 'upbeat':
              contextScore *= (features.valence * 0.4 + features.energy * 0.4 + features.danceability * 0.2);
              break;
            case 'sad':
            case 'melancholy':
              contextScore *= ((1 - features.valence) * 0.6 + features.acousticness * 0.4);
              break;
            case 'calm':
            case 'relaxed':
              contextScore *= (features.acousticness * 0.4 + (1 - features.energy) * 0.4 + features.instrumentalness * 0.2);
              break;
            case 'energetic':
            case 'workout':
              contextScore *= (features.energy * 0.5 + features.danceability * 0.3 + (features.tempo / 200) * 0.2);
              break;
          }
        }

        // Activity-based scoring
        if (activity) {
          switch (activity.toLowerCase()) {
            case 'workout':
            case 'running':
              contextScore *= (features.energy * 0.5 + features.danceability * 0.3 + (features.tempo / 180) * 0.2);
              break;
            case 'study':
            case 'focus':
              contextScore *= (features.instrumentalness * 0.5 + (1 - features.speechiness) * 0.3 + features.acousticness * 0.2);
              break;
            case 'party':
            case 'social':
              contextScore *= (features.danceability * 0.4 + features.energy * 0.4 + features.valence * 0.2);
              break;
            case 'sleep':
            case 'rest':
              contextScore *= (features.acousticness * 0.4 + (1 - features.energy) * 0.4 + (1 - features.loudness / -60) * 0.2);
              break;
          }
        }

        // Time of day scoring
        if (timeOfDay) {
          const hour = new Date().getHours();
          if (hour >= 6 && hour < 12) { // Morning
            contextScore *= (features.energy * 0.3 + features.valence * 0.3 + features.danceability * 0.2);
          } else if (hour >= 12 && hour < 18) { // Afternoon
            contextScore *= 1.0; // Neutral
          } else if (hour >= 18 && hour < 22) { // Evening
            contextScore *= (features.valence * 0.4 + features.danceability * 0.3);
          } else { // Night
            contextScore *= (features.acousticness * 0.4 + (1 - features.energy) * 0.4);
          }
        }
      }

      return {
        ...rec,
        context_score: contextScore,
        combined_score: rec.combined_score * contextScore
      };
    }).sort((a, b) => b.combined_score - a.combined_score);
  }

  /**
   * Ensure diversity in recommendations
   */
  ensureDiversity(recommendations, options = {}) {
    const { maxPerArtist = 3, maxPerGenre = 5 } = options;
    const artistCounts = new Map();
    const genreCounts = new Map();
    const diverseRecs = [];

    for (const rec of recommendations) {
      let include = true;

      // Check artist diversity
      if (rec.artists && rec.artists.length > 0) {
        const artistId = rec.artists[0].id;
        const currentCount = artistCounts.get(artistId) || 0;
        if (currentCount >= maxPerArtist) {
          include = false;
        } else {
          artistCounts.set(artistId, currentCount + 1);
        }
      }

      // Check genre diversity
      if (include && rec.genres && rec.genres.length > 0) {
        const primaryGenre = rec.genres[0];
        const currentCount = genreCounts.get(primaryGenre) || 0;
        if (currentCount >= maxPerGenre) {
          include = false;
        } else {
          genreCounts.set(primaryGenre, currentCount + 1);
        }
      }

      if (include) {
        diverseRecs.push(rec);
      }
    }

    return diverseRecs;
  }

  /**
   * Generate recommendations for new users based on popular tracks
   */
  async generatePopularRecommendations(limit) {
    // Note: Future enhancement to consider mood and activity for recommendations
    
    try {
      const db = mongoManager.getDb();
      const listeningHistoryCollection = db.collection('listening_history');
      
      // Get most popular tracks from last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const popularTracks = await listeningHistoryCollection.aggregate([
        { $match: { played_at: { $gte: thirtyDaysAgo } } },
        { $group: { _id: '$track_id', play_count: { $sum: 1 }, track_name: { $first: '$track_name' }, artist_name: { $first: '$artist_name' } } },
        { $sort: { play_count: -1 } },
        { $limit: limit * 2 }
      ]).toArray();

      // Enrich with audio features and metadata
      const enrichedTracks = await this.enrichTracksWithFeatures(popularTracks.map(t => ({
        track_id: t._id,
        track_name: t.track_name,
        artist_name: t.artist_name,
        popularity_score: t.play_count
      })));

      return enrichedTracks.slice(0, limit);
    } catch (error) {
      console.error('Error generating popular recommendations:', error);
      return [];
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId) {
    try {
      const db = mongoManager.getDb();
      const userProfilesCollection = db.collection('user_profiles');
      return await userProfilesCollection.findOne({ _id: userId });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Get user listening history
   */
  async getUserListeningHistory(userId, options = {}) {
    const { limit = 500 } = options;
    
    try {
      const db = mongoManager.getDb();
      const listeningHistoryCollection = db.collection('listening_history');
      
      return await listeningHistoryCollection
        .find({ user_id: userId })
        .sort({ played_at: -1 })
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('Error fetching listening history:', error);
      return [];
    }
  }

  /**
   * Get popular tracks
   */
  async getPopularTracks(options = {}) {
    const { limit = 50, excludeUserTracks = [] } = options;
    
    try {
      const db = mongoManager.getDb();
      const trackMetadataCollection = db.collection('track_metadata');
      
      const popularTracks = await trackMetadataCollection
        .find({ 
          track_id: { $nin: excludeUserTracks },
          popularity: { $gte: 50 }
        })
        .sort({ popularity: -1 })
        .limit(limit)
        .toArray();

      return popularTracks;
    } catch (error) {
      console.error('Error fetching popular tracks:', error);
      return [];
    }
  }

  /**
   * Enrich tracks with audio features
   */
  async enrichTracksWithFeatures(tracks) {
    try {
      const db = mongoManager.getDb();
      const audioFeaturesCollection = db.collection('audio_features');
      const trackMetadataCollection = db.collection('track_metadata');
      
      const trackIds = tracks.map(t => t.track_id);
      
      const [audioFeatures, metadata] = await Promise.all([
        audioFeaturesCollection.find({ track_id: { $in: trackIds } }).toArray(),
        trackMetadataCollection.find({ track_id: { $in: trackIds } }).toArray()
      ]);

      const audioFeaturesMap = new Map(audioFeatures.map(af => [af.track_id, af]));
      const metadataMap = new Map(metadata.map(m => [m.track_id, m]));

      return tracks.map(track => ({
        ...track,
        audio_features: audioFeaturesMap.get(track.track_id),
        metadata: metadataMap.get(track.track_id)
      }));
    } catch (error) {
      console.error('Error enriching tracks with features:', error);
      return tracks;
    }
  }

  /**
   * Save recommendations to database
   */
  async saveRecommendations(userId, recommendationData) {
    try {
      const db = mongoManager.getDb();
      const recommendationsCollection = db.collection('recommendations');
      
      const recommendation = {
        user_id: userId,
        ...recommendationData,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      };

      await recommendationsCollection.insertOne(recommendation);
      return recommendation;
    } catch (error) {
      console.error('Error saving recommendations:', error);
      throw error;
    }
  }

  /**
   * Calculate confidence score for recommendations
   */
  calculateConfidenceScore(recommendations, listeningHistory) {
    if (listeningHistory.length === 0) return 0.5; // Neutral for new users
    
    // Simple confidence based on user history size and recommendation diversity
    const historyScore = Math.min(listeningHistory.length / 100, 1.0);
    const diversityScore = recommendations.length > 0 ? 
      new Set(recommendations.map(r => r.artists?.[0]?.id)).size / recommendations.length : 0;
    
    return (historyScore * 0.6 + diversityScore * 0.4);
  }

  /**
   * Calculate diversity statistics
   */
  calculateDiversityStats(recommendations) {
    const artists = new Set();
    const genres = new Set();
    
    recommendations.forEach(rec => {
      if (rec.artists && rec.artists.length > 0) {
        artists.add(rec.artists[0].id);
      }
      if (rec.genres && rec.genres.length > 0) {
        rec.genres.forEach(genre => genres.add(genre));
      }
    });

    return {
      unique_artists: artists.size,
      unique_genres: genres.size,
      total_recommendations: recommendations.length,
      artist_diversity: recommendations.length > 0 ? artists.size / recommendations.length : 0,
      genre_diversity: recommendations.length > 0 ? genres.size / recommendations.length : 0
    };
  }

  /**
   * Update recommendation weights based on user feedback
   */
  updateWeights(feedback) {
    // Simple adaptive weights based on user interactions
    if (feedback.content_based_positive > feedback.collaborative_positive) {
      this.weights.content_based = Math.min(this.weights.content_based + 0.05, 0.8);
      this.weights.collaborative = Math.max(this.weights.collaborative - 0.03, 0.1);
    } else if (feedback.collaborative_positive > feedback.content_based_positive) {
      this.weights.collaborative = Math.min(this.weights.collaborative + 0.05, 0.8);
      this.weights.content_based = Math.max(this.weights.content_based - 0.03, 0.1);
    }
    
    // Ensure weights sum to 1
    const total = this.weights.content_based + this.weights.collaborative + this.weights.popularity;
    Object.keys(this.weights).forEach(key => {
      this.weights[key] /= total;
    });
  }
}

module.exports = RecommendationEngine;