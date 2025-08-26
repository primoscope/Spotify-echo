const express = require('express');

const router = express.Router();

/**
 * Basic chatbot endpoint
 * POST /message (mounted under /api/chat)
 */
router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    // Note: user_context available for future personalization features

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Simple intent recognition (in production, use proper NLP)
    const lowerMessage = message.toLowerCase();
    let response = '';
    let action = null;

    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      response =
        'I\'d love to recommend some music for you! What mood are you in? Or what genre would you like to explore?';
      action = 'recommend';
    } else if (lowerMessage.includes('playlist')) {
      response =
        'I can help you create a personalized playlist! What would you like to name it and what kind of vibe are you going for?';
      action = 'create_playlist';
    } else if (lowerMessage.includes('mood') || lowerMessage.includes('feel')) {
      response =
        'Tell me more about your mood! Are you looking for something upbeat and energetic, or maybe something more chill and relaxing?';
      action = 'mood_analysis';
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      response =
        'Hello! I\'m your AI music assistant. I can help you discover new music, create playlists, and find the perfect songs for any mood. What would you like to explore today?';
    } else {
      response =
        'I\'m here to help you with music recommendations and playlist creation! Try asking me to recommend songs for a specific mood or to create a playlist.';
    }

    res.json({
      response: response,
      action: action,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Failed to process message',
      message: 'Sorry, I encountered an error. Please try again.',
    });
  }
});

module.exports = router;