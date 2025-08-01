const BaseLLMProvider = require('./base-provider');

/**
 * Mock LLM Provider for Demo/Testing
 * Provides realistic music assistant responses without requiring API keys
 */
class MockLLMProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'mock';
    this.defaultModel = 'mock-music-assistant';
    this.responses = [
      'I\'d love to help you discover new music! What kind of mood are you in today? Are you looking for something upbeat and energetic, or perhaps something more mellow and relaxing?',
      'Great choice! Based on your preferences, I can recommend some fantastic tracks. What genre or activity would you like music for?',
      'I can help you create the perfect playlist! Tell me about the vibe you\'re going for - is this for working out, studying, a road trip, or just chilling at home?',
      'Music discovery is my specialty! I can analyze audio features like energy, danceability, and mood to find tracks that perfectly match what you\'re looking for.',
      'That\'s an interesting request! Let me think about some songs that would fit that description. Do you have any favorite artists or genres I should consider?',
      'I love helping people explore new music! Based on what you\'ve told me, I have some great suggestions that I think you\'ll enjoy.',
      'Music has such a powerful effect on our mood and energy! What kind of atmosphere are you trying to create with your music today?'
    ];
    this.musicResponses = {
      workout: 'For your workout playlist, I recommend high-energy tracks with strong beats! Try artists like The Weeknd, Dua Lipa, or some classic rock anthems. Look for songs with high energy and danceability scores.',
      study: 'Perfect study music should be focus-enhancing without being distracting. I\'d suggest lo-fi hip hop, ambient electronic, or instrumental post-rock. Artists like Ólafur Arnalds, Tycho, or curated lo-fi playlists work great.',
      chill: 'For a chill vibe, I recommend tracks with lower energy but good emotional resonance. Think artists like Billie Eilish, The 1975, or some indie folk. Look for songs with higher acousticness and moderate valence.',
      party: 'Party music needs high danceability and energy! Current pop hits, classic dance tracks, and upbeat hip-hop work perfectly. Think Doja Cat, Bruno Mars, or throwback party anthems.',
      road: 'Road trip music should be engaging and sing-along worthy! Classic rock, pop hits, and feel-good indie tracks are perfect. Mix some nostalgic favorites with current discoveries.'
    };
  }

  async initialize() {
    // Mock provider is always ready
    this.isInitialized = true;
    console.log('✅ Mock LLM provider initialized - Demo mode active');
  }

  validateConfig() {
    // Mock provider doesn't need real configuration
    return true;
  }

  isAvailable() {
    return true; // Always available
  }

  getCapabilities() {
    return {
      streaming: true,
      functionCalling: false,
      maxTokens: 4096,
      supportedModels: ['mock-music-assistant'],
      features: ['chat', 'music_recommendations', 'demo_mode']
    };
  }

  async generateCompletion(messages, options = {}) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content?.toLowerCase() || '';
    
    let response = this.generateMusicResponse(userMessage);

    return {
      content: response,
      role: 'assistant',
      model: this.defaultModel,
      usage: {
        promptTokens: this.estimateTokens(messages.map(m => m.content).join(' ')),
        completionTokens: this.estimateTokens(response),
        totalTokens: this.estimateTokens(messages.map(m => m.content).join(' ') + response)
      },
      metadata: {
        provider: 'mock',
        demoMode: true
      }
    };
  }

  async* generateStreamingCompletion(messages, options = {}) {
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage?.content?.toLowerCase() || '';
    
    const response = this.generateMusicResponse(userMessage);
    const words = response.split(' ');
    
    // Stream words with realistic timing
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
      
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      yield {
        content: chunk,
        role: 'assistant',
        model: this.defaultModel,
        isPartial: i < words.length - 1
      };
    }
  }

  generateMusicResponse(userMessage) {
    // Check for specific music-related keywords and contexts
    if (userMessage.includes('workout') || userMessage.includes('exercise') || userMessage.includes('gym')) {
      return this.musicResponses.workout;
    }
    
    if (userMessage.includes('study') || userMessage.includes('focus') || userMessage.includes('concentration')) {
      return this.musicResponses.study;
    }
    
    if (userMessage.includes('chill') || userMessage.includes('relax') || userMessage.includes('calm')) {
      return this.musicResponses.chill;
    }
    
    if (userMessage.includes('party') || userMessage.includes('dance') || userMessage.includes('celebration')) {
      return this.musicResponses.party;
    }
    
    if (userMessage.includes('road trip') || userMessage.includes('driving') || userMessage.includes('travel')) {
      return this.musicResponses.road;
    }
    
    if (userMessage.includes('playlist')) {
      return 'I\'d be happy to help you create a playlist! To make the perfect one, I need to know more about what you\'re looking for. What\'s the occasion? Are you thinking about:\n\n• A specific mood (happy, relaxed, energetic)?\n• An activity (working out, studying, driving)?\n• A genre preference?\n• A particular time of day?\n\nOnce I know more, I can suggest tracks with the right energy, tempo, and vibe for your needs!';
    }
    
    if (userMessage.includes('recommend') || userMessage.includes('suggest') || userMessage.includes('music')) {
      return 'I\'d love to recommend some music for you! To give you the best suggestions, tell me:\n\n🎵 **What\'s your current mood?** (happy, chill, energetic, contemplative)\n🎯 **What\'s the setting?** (work, exercise, relaxation, social)\n🎨 **Any genre preferences?** (or open to anything!)\n\nI can analyze audio features like energy, danceability, and valence to find tracks that perfectly match what you\'re looking for. What sounds good to you?';
    }
    
    if (userMessage.includes('analyze') || userMessage.includes('habits') || userMessage.includes('taste')) {
      return 'I\'d love to analyze your music taste! While this is a demo version, here\'s what I could do with your Spotify data:\n\n📊 **Listening Patterns Analysis:**\n• Your top genres and how they\'ve evolved\n• Most active listening times and patterns\n• Audio feature preferences (energy, danceability, valence)\n• Discovery vs. repeat listening habits\n\n🎯 **Personalized Insights:**\n• Mood-based listening trends\n• Seasonal music preferences\n• Artist diversity in your library\n• Recommendations based on your unique taste profile\n\nTo get this analysis, you\'d need to connect your Spotify account. Would you like me to explain more about any of these features?';
    }
    
    if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey')) {
      return 'Hello! 🎵 I\'m EchoTune AI, your personal music assistant! I\'m here to help you discover amazing music, create perfect playlists, and explore your musical taste.\n\n**I can help you with:**\n• 🎯 Personalized music recommendations\n• 📝 Custom playlist creation\n• 📊 Music taste analysis\n• 🎨 Mood-based suggestions\n• 🔍 Artist and genre discovery\n\n*Note: This is demo mode - connect your Spotify account for the full experience!*\n\nWhat kind of music adventure shall we start with today?';
    }
    
    if (userMessage.includes('help') || userMessage.includes('what can you do')) {
      return '🎵 **EchoTune AI - Your Music Assistant**\n\nI\'m designed to be your personal music curator! Here\'s what I can help you with:\n\n**🎯 Music Discovery:**\n• Get recommendations based on mood, activity, or genre\n• Discover new artists similar to your favorites\n• Find perfect songs for any occasion\n\n**📝 Playlist Creation:**\n• Build custom playlists for workouts, study, parties, etc.\n• Mix familiar favorites with new discoveries\n• Balance energy levels and moods perfectly\n\n**📊 Music Analysis:**\n• Understand your listening patterns and preferences\n• Get insights into your musical evolution\n• Explore audio features like energy, danceability, and mood\n\n**🔧 Smart Features:**\n• Context-aware suggestions (time of day, weather, activity)\n• Audio feature analysis for precise matching\n• Integration with your Spotify library\n\nJust tell me what you\'re in the mood for, and I\'ll help you find the perfect soundtrack!';
    }
    
    // Default responses for general conversation
    const randomResponse = this.responses[Math.floor(Math.random() * this.responses.length)];
    return randomResponse + '\n\n*This is demo mode - connect your Spotify account for personalized recommendations based on your actual listening history!*';
  }

  handleError(error) {
    console.error('Mock provider error:', error);
    return {
      error: false, // Mock provider shouldn't fail
      content: 'I\'m having a small hiccup, but I\'m still here to help! What kind of music are you interested in exploring today?',
      metadata: { provider: 'mock', recovered: true }
    };
  }
}

module.exports = MockLLMProvider;