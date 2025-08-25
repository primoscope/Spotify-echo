/**
 * EchoTune AI - Recommendation Engine Foundation
 * Phase 1 Epic E05: Advanced Reco Engine (Phase 1 foundation)
 * 
 * Establishes architectural boundaries and scaffolding for:
 * - Hybrid recommendation algorithms
 * - Feature vector schema
 * - Feedback event ingestion
 * - A/B experiment framework
 */

const { EventEmitter } = require('events');
const { z } = require('zod');

// Feature Vector Schema Definition
const TrackFeatureVectorSchema = z.object({
  track_id: z.string(),
  audio_features: z.object({
    acousticness: z.number().min(0).max(1),
    danceability: z.number().min(0).max(1),
    energy: z.number().min(0).max(1),
    instrumentalness: z.number().min(0).max(1),
    liveness: z.number().min(0).max(1),
    loudness: z.number(),
    speechiness: z.number().min(0).max(1),
    tempo: z.number().positive(),
    valence: z.number().min(0).max(1),
    mode: z.number().int().min(0).max(1),
    key: z.number().int().min(0).max(11),
    time_signature: z.number().int().min(1).max(7),
  }),
  metadata: z.object({
    artist_id: z.string(),
    album_id: z.string(),
    genre_tags: z.array(z.string()),
    release_year: z.number().int(),
    popularity: z.number().min(0).max(100),
    duration_ms: z.number().positive(),
  }),
  computed_features: z.object({
    embedding_vector: z.array(z.number()).length(128).optional(),
    genre_similarity: z.record(z.number()).optional(),
    mood_vector: z.array(z.number()).length(8).optional(),
  }).optional(),
  last_updated: z.string().datetime()
});

const UserFeatureVectorSchema = z.object({
  user_id: z.string(),
  preferences: z.object({
    genre_weights: z.record(z.number().min(0).max(1)),
    audio_feature_preferences: z.object({
      energy_preference: z.number().min(0).max(1),
      danceability_preference: z.number().min(0).max(1),
      valence_preference: z.number().min(0).max(1),
      acousticness_preference: z.number().min(0).max(1),
    }),
    tempo_range: z.object({
      min: z.number().positive(),
      max: z.number().positive(),
    }),
  }),
  listening_history: z.object({
    total_tracks: z.number().int().nonnegative(),
    unique_artists: z.number().int().nonnegative(),
    unique_genres: z.number().int().nonnegative(),
    listening_diversity_score: z.number().min(0).max(1),
  }),
  context_features: z.object({
    time_of_day_preferences: z.record(z.number().min(0).max(1)),
    day_of_week_preferences: z.record(z.number().min(0).max(1)),
    device_preferences: z.record(z.number().min(0).max(1)),
  }).optional(),
  last_updated: z.string().datetime()
});

// Feedback Event Schema
const FeedbackEventSchema = z.object({
  event_id: z.string(),
  user_id: z.string(),
  session_id: z.string(),
  timestamp: z.string().datetime(),
  event_type: z.enum([
    'recommendation_shown',
    'recommendation_clicked',
    'recommendation_skipped',
    'track_liked',
    'track_disliked',
    'playlist_added',
    'track_completed',
    'track_repeated'
  ]),
  track_id: z.string(),
  context: z.object({
    algorithm_used: z.string(),
    recommendation_position: z.number().int().positive(),
    recommendation_score: z.number().min(0).max(1),
    user_context: z.object({
      device_type: z.string().optional(),
      location: z.string().optional(),
      time_of_day: z.string().optional(),
    }).optional(),
  }),
  metadata: z.record(z.any()).optional()
});

/**
 * Feature Vector Manager
 * Handles creation, storage, and retrieval of feature vectors
 */
class FeatureVectorManager {
  constructor() {
    this.trackVectors = new Map();
    this.userVectors = new Map();
  }

  /**
   * Create or update track feature vector
   */
  async createTrackVector(trackData) {
    try {
      const vector = TrackFeatureVectorSchema.parse({
        ...trackData,
        last_updated: new Date().toISOString()
      });
      
      this.trackVectors.set(vector.track_id, vector);
      return vector;
    } catch (error) {
      throw new Error(`Invalid track feature vector: ${error.message}`);
    }
  }

  /**
   * Create or update user feature vector
   */
  async createUserVector(userData) {
    try {
      const vector = UserFeatureVectorSchema.parse({
        ...userData,
        last_updated: new Date().toISOString()
      });
      
      this.userVectors.set(vector.user_id, vector);
      return vector;
    } catch (error) {
      throw new Error(`Invalid user feature vector: ${error.message}`);
    }
  }

  /**
   * Get track feature vector
   */
  getTrackVector(trackId) {
    return this.trackVectors.get(trackId);
  }

  /**
   * Get user feature vector
   */
  getUserVector(userId) {
    return this.userVectors.get(userId);
  }

  /**
   * Compute similarity between track vectors
   */
  computeTrackSimilarity(trackId1, trackId2) {
    const vector1 = this.getTrackVector(trackId1);
    const vector2 = this.getTrackVector(trackId2);
    
    if (!vector1 || !vector2) {
      return 0;
    }

    // Compute cosine similarity on audio features
    const features1 = Object.values(vector1.audio_features);
    const features2 = Object.values(vector2.audio_features);
    
    return this.cosineSimilarity(features1, features2);
  }

  /**
   * Compute cosine similarity between two vectors
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

/**
 * Feedback Event Processor
 * Handles ingestion and processing of user feedback events
 */
class FeedbackEventProcessor extends EventEmitter {
  constructor() {
    super();
    this.events = [];
    this.aggregatedFeedback = new Map();
  }

  /**
   * Ingest feedback event
   */
  async ingestEvent(eventData) {
    try {
      const event = FeedbackEventSchema.parse({
        ...eventData,
        event_id: eventData.event_id || this.generateEventId(),
        timestamp: eventData.timestamp || new Date().toISOString()
      });
      
      this.events.push(event);
      await this.processEvent(event);
      
      this.emit('event_ingested', event);
      return event;
    } catch (error) {
      this.emit('event_error', { error: error.message, eventData });
      throw new Error(`Invalid feedback event: ${error.message}`);
    }
  }

  /**
   * Process individual feedback event
   */
  async processEvent(event) {
    const key = `${event.user_id}:${event.track_id}`;
    
    if (!this.aggregatedFeedback.has(key)) {
      this.aggregatedFeedback.set(key, {
        user_id: event.user_id,
        track_id: event.track_id,
        interactions: [],
        implicit_rating: 0,
        explicit_rating: null,
        last_interaction: event.timestamp
      });
    }
    
    const aggregated = this.aggregatedFeedback.get(key);
    aggregated.interactions.push(event);
    aggregated.last_interaction = event.timestamp;
    
    // Update implicit rating based on event type
    switch (event.event_type) {
      case 'track_liked':
        aggregated.explicit_rating = 1;
        aggregated.implicit_rating = Math.min(1, aggregated.implicit_rating + 0.3);
        break;
      case 'track_disliked':
        aggregated.explicit_rating = 0;
        aggregated.implicit_rating = Math.max(0, aggregated.implicit_rating - 0.5);
        break;
      case 'track_completed':
        aggregated.implicit_rating = Math.min(1, aggregated.implicit_rating + 0.2);
        break;
      case 'track_repeated':
        aggregated.implicit_rating = Math.min(1, aggregated.implicit_rating + 0.4);
        break;
      case 'recommendation_skipped':
        aggregated.implicit_rating = Math.max(0, aggregated.implicit_rating - 0.1);
        break;
      case 'recommendation_clicked':
        aggregated.implicit_rating = Math.min(1, aggregated.implicit_rating + 0.1);
        break;
    }
    
    this.emit('feedback_updated', aggregated);
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get aggregated feedback for user-track pair
   */
  getFeedback(userId, trackId) {
    return this.aggregatedFeedback.get(`${userId}:${trackId}`);
  }

  /**
   * Get all feedback for a user
   */
  getUserFeedback(userId) {
    const userFeedback = [];
    for (const [key, feedback] of this.aggregatedFeedback) {
      if (feedback.user_id === userId) {
        userFeedback.push(feedback);
      }
    }
    return userFeedback;
  }
}

/**
 * A/B Experiment Framework
 * Manages algorithm testing and performance comparison
 */
class ExperimentFramework {
  constructor() {
    this.experiments = new Map();
    this.userAssignments = new Map();
    this.metrics = new Map();
  }

  /**
   * Create new A/B experiment
   */
  createExperiment(config) {
    const experiment = {
      id: config.id || this.generateExperimentId(),
      name: config.name,
      description: config.description,
      start_date: new Date(config.start_date || Date.now()),
      end_date: new Date(config.end_date),
      variants: config.variants, // [{ id: 'control', algorithm: 'collaborative' }, { id: 'test', algorithm: 'hybrid' }]
      traffic_split: config.traffic_split || [0.5, 0.5],
      success_metrics: config.success_metrics || ['ctr', 'engagement_time'],
      status: 'active'
    };
    
    this.experiments.set(experiment.id, experiment);
    this.metrics.set(experiment.id, new Map());
    
    return experiment;
  }

  /**
   * Assign user to experiment variant
   */
  assignUserToVariant(userId, experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'active') {
      return null;
    }
    
    // Check if user already assigned
    const userKey = `${userId}:${experimentId}`;
    if (this.userAssignments.has(userKey)) {
      return this.userAssignments.get(userKey);
    }
    
    // Hash-based assignment for consistency
    const hash = this.hashString(`${userId}:${experimentId}`);
    const normalized = hash / Math.pow(2, 32);
    
    let cumulative = 0;
    for (let i = 0; i < experiment.traffic_split.length; i++) {
      cumulative += experiment.traffic_split[i];
      if (normalized < cumulative) {
        const assignment = {
          user_id: userId,
          experiment_id: experimentId,
          variant_id: experiment.variants[i].id,
          algorithm: experiment.variants[i].algorithm,
          assigned_at: new Date().toISOString()
        };
        
        this.userAssignments.set(userKey, assignment);
        return assignment;
      }
    }
    
    // Fallback to control
    const controlAssignment = {
      user_id: userId,
      experiment_id: experimentId,
      variant_id: experiment.variants[0].id,
      algorithm: experiment.variants[0].algorithm,
      assigned_at: new Date().toISOString()
    };
    
    this.userAssignments.set(userKey, controlAssignment);
    return controlAssignment;
  }

  /**
   * Record experiment metric
   */
  recordMetric(experimentId, variantId, metricName, value, userId = null) {
    const experimentMetrics = this.metrics.get(experimentId);
    if (!experimentMetrics) return;
    
    const metricKey = `${variantId}:${metricName}`;
    if (!experimentMetrics.has(metricKey)) {
      experimentMetrics.set(metricKey, []);
    }
    
    experimentMetrics.get(metricKey).push({
      value,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get experiment results
   */
  getExperimentResults(experimentId) {
    const experiment = this.experiments.get(experimentId);
    const experimentMetrics = this.metrics.get(experimentId);
    
    if (!experiment || !experimentMetrics) {
      return null;
    }
    
    const results = {
      experiment: experiment,
      variants: {},
      summary: {
        total_users: this.getUserCount(experimentId),
        start_date: experiment.start_date,
        end_date: experiment.end_date,
        duration_days: (new Date() - experiment.start_date) / (1000 * 60 * 60 * 24)
      }
    };
    
    // Calculate metrics for each variant
    for (const variant of experiment.variants) {
      results.variants[variant.id] = {};
      
      for (const metricName of experiment.success_metrics) {
        const metricKey = `${variant.id}:${metricName}`;
        const values = experimentMetrics.get(metricKey) || [];
        
        if (values.length > 0) {
          const numericValues = values.map(v => v.value);
          results.variants[variant.id][metricName] = {
            count: values.length,
            mean: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
            median: this.calculateMedian(numericValues),
            std: this.calculateStandardDeviation(numericValues)
          };
        }
      }
    }
    
    return results;
  }

  /**
   * Hash string for consistent user assignment
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate median of array
   */
  calculateMedian(values) {
    const sorted = values.slice().sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Get user count for experiment
   */
  getUserCount(experimentId) {
    let count = 0;
    for (const [key, assignment] of this.userAssignments) {
      if (assignment.experiment_id === experimentId) {
        count++;
      }
    }
    return count;
  }

  /**
   * Generate unique experiment ID
   */
  generateExperimentId() {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
}

/**
 * Recommendation Engine Core
 * Coordinates feature vectors, feedback, and experiments
 */
class RecommendationEngine {
  constructor() {
    this.featureManager = new FeatureVectorManager();
    this.feedbackProcessor = new FeedbackEventProcessor();
    this.experimentFramework = new ExperimentFramework();
    this.algorithms = new Map();
    
    this.registerDefaultAlgorithms();
  }

  /**
   * Register recommendation algorithms
   */
  registerAlgorithm(name, algorithm) {
    this.algorithms.set(name, algorithm);
  }

  /**
   * Register default placeholder algorithms
   */
  registerDefaultAlgorithms() {
    // Placeholder algorithms for Phase 1
    this.registerAlgorithm('collaborative', {
      generate: async (userId, options = {}) => {
        // Placeholder collaborative filtering
        return {
          tracks: [],
          algorithm: 'collaborative',
          confidence: 0.5,
          metadata: { placeholder: true }
        };
      }
    });
    
    this.registerAlgorithm('content_based', {
      generate: async (userId, options = {}) => {
        // Placeholder content-based filtering
        return {
          tracks: [],
          algorithm: 'content_based',
          confidence: 0.5,
          metadata: { placeholder: true }
        };
      }
    });
    
    this.registerAlgorithm('hybrid', {
      generate: async (userId, options = {}) => {
        // Placeholder hybrid algorithm
        return {
          tracks: [],
          algorithm: 'hybrid',
          confidence: 0.7,
          metadata: { placeholder: true }
        };
      }
    });
  }

  /**
   * Generate recommendations with experiment framework
   */
  async generateRecommendations(userId, options = {}) {
    // Check for active experiments
    const activeExperiments = Array.from(this.experimentFramework.experiments.values())
      .filter(exp => exp.status === 'active');
    
    let algorithmToUse = options.algorithm || 'collaborative';
    let experimentContext = null;
    
    // Use experiment assignment if active experiment exists
    if (activeExperiments.length > 0) {
      const experiment = activeExperiments[0]; // Use first active experiment
      const assignment = this.experimentFramework.assignUserToVariant(userId, experiment.id);
      if (assignment) {
        algorithmToUse = assignment.algorithm;
        experimentContext = assignment;
      }
    }
    
    // Generate recommendations using selected algorithm
    const algorithm = this.algorithms.get(algorithmToUse);
    if (!algorithm) {
      throw new Error(`Algorithm '${algorithmToUse}' not found`);
    }
    
    const recommendations = await algorithm.generate(userId, options);
    
    // Add experiment context
    if (experimentContext) {
      recommendations.experiment = experimentContext;
    }
    
    return recommendations;
  }

  /**
   * Process feedback and update models
   */
  async processFeedback(feedbackEvent) {
    const processedEvent = await this.feedbackProcessor.ingestEvent(feedbackEvent);
    
    // Record experiment metrics if applicable
    if (processedEvent.context && processedEvent.context.algorithm_used) {
      // Find relevant experiment
      const activeExperiments = Array.from(this.experimentFramework.experiments.values())
        .filter(exp => exp.status === 'active');
      
      for (const experiment of activeExperiments) {
        const assignment = this.experimentFramework.userAssignments.get(
          `${processedEvent.user_id}:${experiment.id}`
        );
        
        if (assignment && assignment.algorithm === processedEvent.context.algorithm_used) {
          // Record relevant metrics
          if (processedEvent.event_type === 'recommendation_clicked') {
            this.experimentFramework.recordMetric(
              experiment.id,
              assignment.variant_id,
              'ctr',
              1,
              processedEvent.user_id
            );
          }
        }
      }
    }
    
    return processedEvent;
  }

  /**
   * Get system health status
   */
  getHealth() {
    return {
      status: 'healthy',
      components: {
        feature_manager: {
          track_vectors: this.featureManager.trackVectors.size,
          user_vectors: this.featureManager.userVectors.size
        },
        feedback_processor: {
          total_events: this.feedbackProcessor.events.length,
          aggregated_feedback: this.feedbackProcessor.aggregatedFeedback.size
        },
        experiment_framework: {
          active_experiments: Array.from(this.experimentFramework.experiments.values())
            .filter(exp => exp.status === 'active').length,
          total_assignments: this.experimentFramework.userAssignments.size
        },
        algorithms: {
          registered: this.algorithms.size,
          available: Array.from(this.algorithms.keys())
        }
      }
    };
  }
}

module.exports = {
  RecommendationEngine,
  FeatureVectorManager,
  FeedbackEventProcessor,
  ExperimentFramework,
  TrackFeatureVectorSchema,
  UserFeatureVectorSchema,
  FeedbackEventSchema
};