/**
 * Evaluation Harness for Music Recommendation Systems
 * Implements offline metrics: precision@k, recall@k, diversity, coverage, novelty
 */

const mongoManager = require('../database/mongodb');
const RecommendationEngine = require('./recommendation-engine-enhanced');

class EvaluationHarness {
  constructor() {
    this.engine = new RecommendationEngine();
    this.metrics = {
      precision: [],
      recall: [],
      diversity: [],
      coverage: [],
      novelty: [],
      mrr: [], // Mean Reciprocal Rank
      ndcg: [], // Normalized Discounted Cumulative Gain
    };
  }

  /**
   * Run comprehensive evaluation on recommendation system
   */
  async runEvaluation(options = {}) {
    const {
      testSetSize = 100,
      kValues = [5, 10, 20],
      holdoutRatio = 0.2,
      minUserHistory = 10,
    } = options;

    console.log('🧪 Starting recommendation system evaluation...');

    try {
      // Prepare test data
      const testData = await this.prepareTestData({
        testSetSize,
        holdoutRatio,
        minUserHistory,
      });

      console.log(`📊 Evaluating on ${testData.length} users...`);

      // Run evaluation for each k value
      const results = {};
      for (const k of kValues) {
        console.log(`📈 Evaluating for k=${k}...`);
        results[k] = await this.evaluateAtK(testData, k);
      }

      // Calculate aggregate metrics
      const aggregateResults = this.calculateAggregateMetrics(results);
      
      console.log('✅ Evaluation complete!');
      this.printResults(aggregateResults);

      return aggregateResults;
    } catch (error) {
      console.error('❌ Evaluation failed:', error);
      throw error;
    }
  }

  /**
   * Prepare test data with train/test split
   */
  async prepareTestData(options) {
    const { testSetSize, holdoutRatio, minUserHistory } = options;
    
    const db = mongoManager.getDb();
    const listeningHistoryCollection = db.collection('listening_history');

    // Get users with sufficient listening history
    const users = await listeningHistoryCollection.aggregate([
      {
        $group: {
          _id: '$user_id',
          track_count: { $sum: 1 },
          tracks: { $push: { track_id: '$track_id', played_at: '$played_at' } },
        },
      },
      {
        $match: {
          track_count: { $gte: minUserHistory },
        },
      },
      {
        $limit: testSetSize,
      },
    ]).toArray();

    console.log(`📋 Found ${users.length} users with sufficient history`);

    // Create train/test splits for each user
    const testData = users.map(user => {
      const sortedTracks = user.tracks.sort((a, b) => 
        new Date(a.played_at) - new Date(b.played_at)
      );
      
      const splitIndex = Math.floor(sortedTracks.length * (1 - holdoutRatio));
      
      return {
        userId: user._id,
        trainTracks: sortedTracks.slice(0, splitIndex),
        testTracks: sortedTracks.slice(splitIndex),
      };
    });

    return testData;
  }

  /**
   * Evaluate recommendations at specific k value
   */
  async evaluateAtK(testData, k) {
    const results = {
      precision: [],
      recall: [],
      diversity: [],
      novelty: [],
      mrr: [],
      ndcg: [],
    };

    for (const userData of testData) {
      try {
        // Generate recommendations based on training data
        const recommendations = await this.engine.generateRecommendations(
          userData.userId,
          {
            limit: k,
            context: { mode: 'evaluation' },
            listeningHistory: userData.trainTracks,
          }
        );

        const recommendedTrackIds = recommendations.map(r => r.track_id);
        const testTrackIds = userData.testTracks.map(t => t.track_id);

        // Calculate metrics
        results.precision.push(this.calculatePrecisionAtK(recommendedTrackIds, testTrackIds, k));
        results.recall.push(this.calculateRecallAtK(recommendedTrackIds, testTrackIds));
        results.diversity.push(await this.calculateDiversity(recommendations));
        results.novelty.push(await this.calculateNovelty(recommendations, userData.trainTracks));
        results.mrr.push(this.calculateMRR(recommendedTrackIds, testTrackIds));
        results.ndcg.push(this.calculateNDCG(recommendedTrackIds, testTrackIds, k));
      } catch (error) {
        console.warn(`⚠️ Failed to evaluate user ${userData.userId}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Calculate Precision@K
   */
  calculatePrecisionAtK(recommended, relevant, k) {
    const topK = recommended.slice(0, k);
    const hits = topK.filter(trackId => relevant.includes(trackId));
    return hits.length / k;
  }

  /**
   * Calculate Recall@K
   */
  calculateRecallAtK(recommended, relevant) {
    if (relevant.length === 0) return 0;
    const hits = recommended.filter(trackId => relevant.includes(trackId));
    return hits.length / relevant.length;
  }

  /**
   * Calculate intra-list diversity based on audio features
   */
  async calculateDiversity(recommendations) {
    if (recommendations.length < 2) return 0;

    const db = mongoManager.getDb();
    const audioFeaturesCollection = db.collection('audio_features');

    // Get audio features for recommendations
    const trackIds = recommendations.map(r => r.track_id);
    const features = await audioFeaturesCollection.find({
      track_id: { $in: trackIds },
    }).toArray();

    if (features.length < 2) return 0;

    // Calculate pairwise similarities and return 1 - average similarity
    let totalSimilarity = 0;
    let pairCount = 0;

    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const similarity = this.calculateAudioSimilarity(features[i], features[j]);
        totalSimilarity += similarity;
        pairCount++;
      }
    }

    const averageSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0;
    return 1 - averageSimilarity;
  }

  /**
   * Calculate novelty score (how different recommendations are from user's history)
   */
  async calculateNovelty(recommendations, userHistory) {
    if (recommendations.length === 0 || userHistory.length === 0) return 0;

    const db = mongoManager.getDb();
    const audioFeaturesCollection = db.collection('audio_features');

    // Get audio features
    const recTrackIds = recommendations.map(r => r.track_id);
    const historyTrackIds = userHistory.map(h => h.track_id);

    const [recFeatures, historyFeatures] = await Promise.all([
      audioFeaturesCollection.find({ track_id: { $in: recTrackIds } }).toArray(),
      audioFeaturesCollection.find({ track_id: { $in: historyTrackIds } }).toArray(),
    ]);

    if (recFeatures.length === 0 || historyFeatures.length === 0) return 0;

    // Calculate average similarity between recommendations and history
    let totalSimilarity = 0;
    let pairCount = 0;

    for (const recFeature of recFeatures) {
      for (const histFeature of historyFeatures) {
        const similarity = this.calculateAudioSimilarity(recFeature, histFeature);
        totalSimilarity += similarity;
        pairCount++;
      }
    }

    const averageSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0;
    return 1 - averageSimilarity;
  }

  /**
   * Calculate Mean Reciprocal Rank
   */
  calculateMRR(recommended, relevant) {
    for (let i = 0; i < recommended.length; i++) {
      if (relevant.includes(recommended[i])) {
        return 1 / (i + 1);
      }
    }
    return 0;
  }

  /**
   * Calculate Normalized Discounted Cumulative Gain
   */
  calculateNDCG(recommended, relevant, k) {
    const dcg = this.calculateDCG(recommended, relevant, k);
    const idcg = this.calculateIdealDCG(relevant, k);
    return idcg > 0 ? dcg / idcg : 0;
  }

  /**
   * Calculate Discounted Cumulative Gain
   */
  calculateDCG(recommended, relevant, k) {
    let dcg = 0;
    for (let i = 0; i < Math.min(k, recommended.length); i++) {
      const relevance = relevant.includes(recommended[i]) ? 1 : 0;
      dcg += relevance / Math.log2(i + 2);
    }
    return dcg;
  }

  /**
   * Calculate Ideal Discounted Cumulative Gain
   */
  calculateIdealDCG(relevant, k) {
    let idcg = 0;
    const idealLength = Math.min(k, relevant.length);
    for (let i = 0; i < idealLength; i++) {
      idcg += 1 / Math.log2(i + 2);
    }
    return idcg;
  }

  /**
   * Calculate audio similarity between two tracks
   */
  calculateAudioSimilarity(features1, features2) {
    const audioFeatures = [
      'danceability', 'energy', 'valence', 'acousticness',
      'instrumentalness', 'speechiness', 'liveness'
    ];

    let similarity = 0;
    let validFeatures = 0;

    for (const feature of audioFeatures) {
      if (features1[feature] !== undefined && features2[feature] !== undefined) {
        const diff = Math.abs(features1[feature] - features2[feature]);
        similarity += 1 - diff;
        validFeatures++;
      }
    }

    return validFeatures > 0 ? similarity / validFeatures : 0;
  }

  /**
   * Calculate aggregate metrics across all k values
   */
  calculateAggregateMetrics(results) {
    const aggregate = {};

    for (const [k, metrics] of Object.entries(results)) {
      aggregate[k] = {};
      for (const [metricName, values] of Object.entries(metrics)) {
        if (values.length > 0) {
          aggregate[k][metricName] = {
            mean: values.reduce((sum, val) => sum + val, 0) / values.length,
            std: this.calculateStandardDeviation(values),
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length,
          };
        }
      }
    }

    return aggregate;
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Print evaluation results in a formatted way
   */
  printResults(results) {
    console.log('\n📊 EVALUATION RESULTS');
    console.log('========================');

    for (const [k, metrics] of Object.entries(results)) {
      console.log(`\n📈 Results for k=${k}:`);
      console.log('------------------------');
      
      for (const [metricName, stats] of Object.entries(metrics)) {
        console.log(
          `${metricName.padEnd(12)}: ${stats.mean.toFixed(4)} ± ${stats.std.toFixed(4)} ` +
          `(min: ${stats.min.toFixed(4)}, max: ${stats.max.toFixed(4)}, n=${stats.count})`
        );
      }
    }

    console.log('\n✅ Evaluation complete!\n');
  }

  /**
   * Save results to database for tracking
   */
  async saveResults(results, metadata = {}) {
    const db = mongoManager.getDb();
    const evaluationCollection = db.collection('evaluation_results');

    const document = {
      timestamp: new Date(),
      results,
      metadata,
      version: process.env.npm_package_version || '1.0.0',
    };

    await evaluationCollection.insertOne(document);
    console.log('💾 Results saved to database');
  }
}

module.exports = EvaluationHarness;