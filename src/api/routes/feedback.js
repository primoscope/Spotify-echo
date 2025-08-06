const express = require('express');
const { requireAuth, createRateLimit } = require('../middleware');
const databaseManager = require('../../database/database-manager');
const { ObjectId } = require('mongodb');

const router = express.Router();

// Rate limiting for feedback endpoints
const feedbackRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 feedback submissions per window per IP
  message: 'Too many feedback submissions, please slow down'
});

/**
 * Submit feedback on recommendations
 * POST /api/feedback
 */
router.post('/', requireAuth, feedbackRateLimit, async (req, res) => {
  try {
    const {
      type, // 'recommendation' | 'chat' 
      targetId, // recommendation ID or chat session ID
      trackId, // for music recommendations
      feedback, // 'like' | 'dislike' | 'love' | 'skip'
      rating, // 1-5 scale
      comment,
      context // additional context like mood, activity, etc.
    } = req.body;

    // Validate required fields
    if (!type || !targetId || (!feedback && !rating)) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'type, targetId, and either feedback or rating are required'
      });
    }

    // Validate feedback type
    const validTypes = ['recommendation', 'chat'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid feedback type',
        message: `Type must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate feedback value
    const validFeedback = ['like', 'dislike', 'love', 'skip', 'not_relevant', 'already_know'];
    if (feedback && !validFeedback.includes(feedback)) {
      return res.status(400).json({
        error: 'Invalid feedback',
        message: `Feedback must be one of: ${validFeedback.join(', ')}`
      });
    }

    // Validate rating
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: 'Invalid rating',
        message: 'Rating must be between 1 and 5'
      });
    }

    const db = databaseManager.getDatabase();
    const feedbackCollection = db.collection('feedback');

    // Create feedback document
    const feedbackDoc = {
      userId: req.userId,
      type,
      targetId,
      trackId: trackId || null,
      feedback: feedback || null,
      rating: rating || null,
      comment: comment || null,
      context: context || {},
      timestamp: new Date(),
      processed: false
    };

    // Insert feedback
    const result = await feedbackCollection.insertOne(feedbackDoc);

    // Update the target (recommendation or chat) with feedback
    if (type === 'recommendation') {
      await updateRecommendationFeedback(targetId, trackId, feedbackDoc, req.userId, db);
    } else if (type === 'chat') {
      await updateChatFeedback(targetId, feedbackDoc, req.userId, db);
    }

    // Process feedback for model improvements (async)
    processFeedbackForLearning(feedbackDoc).catch(err => {
      console.error('Error processing feedback for learning:', err);
    });

    res.json({
      success: true,
      feedbackId: result.insertedId,
      message: 'Feedback recorded successfully',
      data: {
        type,
        targetId,
        trackId,
        feedback: feedback || null,
        rating: rating || null,
        timestamp: feedbackDoc.timestamp
      }
    });

  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      error: 'Failed to record feedback',
      message: error.message
    });
  }
});

/**
 * Get user's feedback history
 * GET /api/feedback/history
 */
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { limit = 50, page = 1, type, targetId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const db = databaseManager.getDatabase();
    const feedbackCollection = db.collection('feedback');

    // Build query
    const query = { userId: req.userId };
    if (type) query.type = type;
    if (targetId) query.targetId = targetId;

    const [feedback, total] = await Promise.all([
      feedbackCollection
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      feedbackCollection.countDocuments(query)
    ]);

    // Enrich feedback with target details
    const enrichedFeedback = await enrichFeedbackWithTargets(feedback, db);

    res.json({
      success: true,
      feedback: enrichedFeedback,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error getting feedback history:', error);
    res.status(500).json({
      error: 'Failed to get feedback history',
      message: error.message
    });
  }
});

/**
 * Get feedback analytics for user
 * GET /api/feedback/analytics
 */
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    const db = databaseManager.getDatabase();
    const feedbackCollection = db.collection('feedback');

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Aggregate feedback analytics
    const analytics = await feedbackCollection.aggregate([
      {
        $match: {
          userId: req.userId,
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalFeedback: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          feedbackBreakdown: {
            $push: {
              type: '$type',
              feedback: '$feedback',
              rating: '$rating',
              timestamp: '$timestamp'
            }
          }
        }
      }
    ]).toArray();

    // Calculate feedback distribution
    const feedbackData = analytics[0] || { totalFeedback: 0, averageRating: 0, feedbackBreakdown: [] };
    const distribution = {
      byFeedback: {},
      byType: {},
      byRating: {},
      timeline: {}
    };

    feedbackData.feedbackBreakdown.forEach(item => {
      // By feedback type
      if (item.feedback) {
        distribution.byFeedback[item.feedback] = (distribution.byFeedback[item.feedback] || 0) + 1;
      }
      
      // By content type
      distribution.byType[item.type] = (distribution.byType[item.type] || 0) + 1;
      
      // By rating
      if (item.rating) {
        const rating = `${item.rating}_stars`;
        distribution.byRating[rating] = (distribution.byRating[rating] || 0) + 1;
      }

      // By timeline (daily)
      const day = item.timestamp.toISOString().split('T')[0];
      distribution.timeline[day] = (distribution.timeline[day] || 0) + 1;
    });

    res.json({
      success: true,
      analytics: {
        timeframe,
        period: {
          start: startDate,
          end: now
        },
        summary: {
          totalFeedback: feedbackData.totalFeedback,
          averageRating: Math.round((feedbackData.averageRating || 0) * 100) / 100
        },
        distribution
      }
    });

  } catch (error) {
    console.error('Error getting feedback analytics:', error);
    res.status(500).json({
      error: 'Failed to get feedback analytics',
      message: error.message
    });
  }
});

/**
 * Update recommendation with feedback
 */
async function updateRecommendationFeedback(recommendationId, trackId, feedbackDoc, userId, db) {
  try {
    const recommendationsCollection = db.collection('recommendations');
    
    const updateData = {
      [`feedback.${feedbackDoc._id}`]: {
        trackId,
        feedback: feedbackDoc.feedback,
        rating: feedbackDoc.rating,
        comment: feedbackDoc.comment,
        timestamp: feedbackDoc.timestamp
      },
      updated_at: new Date()
    };

    await recommendationsCollection.updateOne(
      { _id: new ObjectId(recommendationId), user_id: userId },
      { $set: updateData }
    );

  } catch (error) {
    console.error('Error updating recommendation feedback:', error);
  }
}

/**
 * Update chat session with feedback
 */
async function updateChatFeedback(sessionId, feedbackDoc, userId, db) {
  try {
    const chatSessionsCollection = db.collection('chat_sessions');
    
    const updateData = {
      [`feedback.${feedbackDoc._id}`]: {
        feedback: feedbackDoc.feedback,
        rating: feedbackDoc.rating,
        comment: feedbackDoc.comment,
        timestamp: feedbackDoc.timestamp
      },
      updated_at: new Date()
    };

    await chatSessionsCollection.updateOne(
      { session_id: sessionId, user_id: userId },
      { $set: updateData }
    );

  } catch (error) {
    console.error('Error updating chat feedback:', error);
  }
}

/**
 * Enrich feedback with target details
 */
async function enrichFeedbackWithTargets(feedbackList, db) {
  const enrichedFeedback = [];

  for (const feedback of feedbackList) {
    const enriched = { ...feedback };

    try {
      if (feedback.type === 'recommendation') {
        const recommendationsCollection = db.collection('recommendations');
        const recommendation = await recommendationsCollection.findOne({
          _id: new ObjectId(feedback.targetId)
        });
        enriched.target = recommendation;
      } else if (feedback.type === 'chat') {
        const chatSessionsCollection = db.collection('chat_sessions');
        const chatSession = await chatSessionsCollection.findOne({
          session_id: feedback.targetId
        });
        enriched.target = chatSession;
      }
    } catch (error) {
      console.error(`Error enriching feedback ${feedback._id}:`, error);
      enriched.target = null;
    }

    enrichedFeedback.push(enriched);
  }

  return enrichedFeedback;
}

/**
 * Process feedback for machine learning improvements
 */
async function processFeedbackForLearning(feedbackDoc) {
  try {
    // This would integrate with your ML pipeline
    // For now, we'll just log and store for future processing
    
    console.log(`Processing feedback for learning: ${feedbackDoc.type} - ${feedbackDoc.feedback || feedbackDoc.rating}`);

    const db = databaseManager.getDatabase();
    const learningQueueCollection = db.collection('ml_learning_queue');
    
    await learningQueueCollection.insertOne({
      feedbackId: feedbackDoc._id,
      type: feedbackDoc.type,
      data: feedbackDoc,
      status: 'pending',
      createdAt: new Date()
    });

    // Future: Trigger ML model retraining or weight adjustments
    
  } catch (error) {
    console.error('Error processing feedback for learning:', error);
  }
}

module.exports = router;