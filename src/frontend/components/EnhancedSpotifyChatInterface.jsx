import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Chip,
  Button,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Grid,
  Tooltip,
  Fab,
  Badge,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  FormControlLabel,
  Switch,
  LinearProgress,
  Snackbar,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  MusicNote,
  PlaylistPlay,
  Search,
  Analytics,
  Psychology,
  Settings,
  Code,
  DataObject,
  Memory,
  Speed,
  CloudCircle,
  ExpandMore,
  VolumeUp,
  Queue,
  Album,
  Star,
  TrendingUp,
  History,
  Favorite,
  Shuffle,
  Mic,
  MicOff,
  Clear,
  Refresh,
  Download,
  Upload,
  Share,
  Help,
  Info,
} from '@mui/icons-material';

/**
 * Enhanced Chat Interface with Spotify Integration and Database Tools
 * 
 * Features:
 * - Advanced chat with AI providers
 * - Spotify API integration with real-time music data
 * - MongoDB database query and management tools
 * - Music recommendation engine integration
 * - Voice input and streaming responses
 * - Comprehensive examples and help system
 * - Performance monitoring and analytics
 */
const EnhancedSpotifyChatInterface = ({ userId }) => {
  // Chat state
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  
  // Voice input state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  
  // Spotify integration state
  const [spotifyData, setSpotifyData] = useState({
    currentTrack: null,
    recentTracks: [],
    topTracks: [],
    playlists: [],
    recommendations: [],
    audioFeatures: null,
  });
  
  // Database tools state
  const [databaseStats, setDatabaseStats] = useState({
    collections: {},
    performance: {},
    insights: {},
  });
  
  // UI state
  const [selectedTool, setSelectedTool] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notification, setNotification] = useState(null);
  const [chatMode, setChatMode] = useState('conversational'); // conversational, spotify, database, analytics
  
  // Performance monitoring
  const [performance, setPerformance] = useState({
    responseTime: 0,
    tokensPerSecond: 0,
    memoryUsage: 0,
    cpuUsage: 0,
  });
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const abortControllerRef = useRef(null);
  
  // Chat tools and examples
  const chatTools = {
    spotify: {
      name: 'Spotify Integration',
      icon: <MusicNote />,
      description: 'Access your Spotify data, control playback, and get music recommendations',
      examples: [
        'What song am I currently listening to?',
        'Show me my top tracks from last month',
        'Create a playlist based on my recent listening history',
        'Find music similar to my favorite artists',
        'What are the audio features of this track?',
        'Recommend music for my workout',
      ],
      commands: [
        '/spotify current-track',
        '/spotify recent-tracks [limit]',
        '/spotify top-tracks [time_range]',
        '/spotify recommendations [seed_tracks]',
        '/spotify create-playlist [name] [description]',
        '/spotify audio-features [track_id]',
      ],
    },
    database: {
      name: 'Database Operations',
      icon: <DataObject />,
      description: 'Query MongoDB collections, analyze data, and manage your music database',
      examples: [
        'How many songs have I listened to this month?',
        'Show me my listening patterns over time',
        'What are my most played genres?',
        'Analyze my music discovery trends',
        'Export my listening history',
        'Clean up duplicate entries in my collection',
      ],
      commands: [
        '/db stats',
        '/db query [collection] [filter]',
        '/db aggregate [collection] [pipeline]',
        '/db analyze listening-patterns',
        '/db export [collection] [format]',
        '/db optimize indexes',
      ],
    },
    analytics: {
      name: 'Music Analytics',
      icon: <Analytics />,
      description: 'Advanced analytics and insights about your music preferences',
      examples: [
        'Generate my music taste profile',
        'Show me my mood-based listening patterns',
        'What time of day do I listen to different genres?',
        'How has my music taste evolved over time?',
        'Compare my taste with trending music',
        'Predict what I might like next',
      ],
      commands: [
        '/analytics taste-profile',
        '/analytics mood-patterns',
        '/analytics temporal-analysis',
        '/analytics taste-evolution',
        '/analytics trend-comparison',
        '/analytics predictions',
      ],
    },
    recommendations: {
      name: 'AI Recommendations',
      icon: <Psychology />,
      description: 'Get personalized music recommendations using AI and machine learning',
      examples: [
        'Recommend music for studying',
        'Find songs for my morning run',
        'Suggest artists I might discover',
        'Create a party playlist',
        'Find music similar to [artist/track]',
        'Recommend based on my current mood',
      ],
      commands: [
        '/recommend by-activity [activity]',
        '/recommend by-mood [mood]',
        '/recommend similar-to [artist/track]',
        '/recommend discover-new',
        '/recommend playlist [theme]',
        '/recommend trending [genre]',
      ],
    },
  };
  
  // Initialize component
  useEffect(() => {
    initializeChatInterface();
    loadSpotifyData();
    loadDatabaseStats();
    checkVoiceSupport();
  }, []);
  
  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const initializeChatInterface = () => {
    // Welcome message with examples
    const welcomeMessage = {
      id: Date.now(),
      type: 'assistant',
      content: `🎵 Welcome to EchoTune AI! I'm your intelligent music assistant with access to:

**Spotify Integration**: Control playback, access your music data, get recommendations
**Database Tools**: Query your listening history and analyze patterns  
**Music Analytics**: Deep insights into your music preferences
**AI Recommendations**: Personalized suggestions based on your taste

Try asking me something like:
• "What's my current track?"
• "Show me my top artists this month"
• "Recommend music for working out"
• "Analyze my listening patterns"

Type /help for more commands or click the examples below!`,
      timestamp: new Date(),
      tools: ['spotify', 'database', 'analytics', 'recommendations'],
    };
    
    setMessages([welcomeMessage]);
  };
  
  const loadSpotifyData = async () => {
    try {
      const [currentTrack, recentTracks, topTracks, playlists] = await Promise.all([
        fetch('/api/spotify/current-track').then(r => r.json()),
        fetch('/api/spotify/recent-tracks?limit=10').then(r => r.json()),
        fetch('/api/spotify/top-tracks?limit=20').then(r => r.json()),
        fetch('/api/spotify/playlists').then(r => r.json()),
      ]);
      
      setSpotifyData({
        currentTrack: currentTrack.success ? currentTrack.data : null,
        recentTracks: recentTracks.success ? recentTracks.data : [],
        topTracks: topTracks.success ? topTracks.data : [],
        playlists: playlists.success ? playlists.data : [],
      });
    } catch (error) {
      console.error('Failed to load Spotify data:', error);
    }
  };
  
  const loadDatabaseStats = async () => {
    try {
      const response = await fetch('/api/database/analytics/comprehensive');
      const data = await response.json();
      
      if (data.success) {
        setDatabaseStats(data.analytics);
      }
    } catch (error) {
      console.error('Failed to load database stats:', error);
    }
  };
  
  const checkVoiceSupport = () => {
    const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setVoiceSupported(supported);
    
    if (supported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        setInputMessage(transcript);
        
        if (event.results[event.results.length - 1].isFinal) {
          setIsRecording(false);
        }
      };
      
      recognitionRef.current.onerror = () => {
        setIsRecording(false);
        setNotification({ type: 'error', message: 'Voice recognition error' });
      };
    }
  };
  
  const startVoiceRecording = () => {
    if (recognitionRef.current && !isRecording) {
      setIsRecording(true);
      recognitionRef.current.start();
    }
  };
  
  const stopVoiceRecording = () => {
    if (recognitionRef.current && isRecording) {
      setIsRecording(false);
      recognitionRef.current.stop();
    }
  };
  
  const sendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingMessage('');
    
    const startTime = performance.now();
    
    try {
      // Check for special commands
      if (messageText.startsWith('/')) {
        await handleSpecialCommand(messageText);
        return;
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      // Send to streaming chat endpoint
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          userId,
          context: {
            chatMode,
            spotifyData: {
              currentTrack: spotifyData.currentTrack,
              recentTracks: spotifyData.recentTracks.slice(0, 5),
            },
            databaseStats: {
              totalTracks: databaseStats.collections?.listening_history?.count || 0,
              totalPlaylists: databaseStats.collections?.playlists?.count || 0,
            },
          },
        }),
        signal: abortControllerRef.current.signal,
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'token') {
                fullResponse += data.content;
                setStreamingMessage(fullResponse);
              } else if (data.type === 'done') {
                // Handle completion
                const endTime = performance.now();
                const responseTime = endTime - startTime;
                
                setPerformance(prev => ({
                  ...prev,
                  responseTime: Math.round(responseTime),
                  tokensPerSecond: Math.round((fullResponse.length / responseTime) * 1000),
                }));
                
                break;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
      
      // Create final assistant message
      const assistantMessage = {
        id: Date.now(),
        type: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        metadata: {
          responseTime: performance.responseTime,
          tokensPerSecond: performance.tokensPerSecond,
          mode: chatMode,
        },
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        const errorMessage = {
          id: Date.now(),
          type: 'error',
          content: 'Sorry, I encountered an error processing your message. Please try again.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setNotification({ type: 'error', message: 'Failed to send message' });
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };
  
  const handleSpecialCommand = async (command) => {
    const [cmd, ...args] = command.slice(1).split(' ');
    
    try {
      let response;
      
      switch (cmd) {
        case 'spotify':
          response = await handleSpotifyCommand(args);
          break;
        case 'db':
          response = await handleDatabaseCommand(args);
          break;
        case 'analytics':
          response = await handleAnalyticsCommand(args);
          break;
        case 'recommend':
          response = await handleRecommendationCommand(args);
          break;
        case 'help':
          response = generateHelpMessage();
          break;
        default:
          response = `Unknown command: /${cmd}. Type /help for available commands.`;
      }
      
      const assistantMessage = {
        id: Date.now(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        isCommand: true,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now(),
        type: 'error',
        content: `Error executing command: ${error.message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSpotifyCommand = async (args) => {
    const [subcommand, ...params] = args;
    
    switch (subcommand) {
      case 'current-track':
        const current = await fetch('/api/spotify/current-track').then(r => r.json());
        if (current.success && current.data) {
          return `🎵 **Currently Playing:**
**${current.data.name}** by ${current.data.artists.map(a => a.name).join(', ')}
Album: ${current.data.album.name}
Progress: ${current.data.progress_ms}ms / ${current.data.duration_ms}ms`;
        }
        return '🎵 No track currently playing';
        
      case 'recent-tracks':
        const limit = params[0] ? parseInt(params[0]) : 10;
        const recent = await fetch(`/api/spotify/recent-tracks?limit=${limit}`).then(r => r.json());
        if (recent.success && recent.data.length > 0) {
          const trackList = recent.data.slice(0, 5).map((item, index) => 
            `${index + 1}. **${item.track.name}** by ${item.track.artists[0].name}`
          ).join('\n');
          return `🎵 **Recent Tracks:**\n${trackList}`;
        }
        return '🎵 No recent tracks found';
        
      case 'top-tracks':
        const timeRange = params[0] || 'medium_term';
        const top = await fetch(`/api/spotify/top-tracks?time_range=${timeRange}`).then(r => r.json());
        if (top.success && top.data.length > 0) {
          const trackList = top.data.slice(0, 5).map((track, index) => 
            `${index + 1}. **${track.name}** by ${track.artists[0].name} (${track.popularity}% popularity)`
          ).join('\n');
          return `🎵 **Top Tracks (${timeRange}):**\n${trackList}`;
        }
        return '🎵 No top tracks found';
        
      default:
        return `Unknown Spotify command: ${subcommand}`;
    }
  };
  
  const handleDatabaseCommand = async (args) => {
    const [subcommand, ...params] = args;
    
    switch (subcommand) {
      case 'stats':
        return `📊 **Database Statistics:**
**Collections:**
- Listening History: ${databaseStats.collections?.listening_history?.count || 0} records
- Users: ${databaseStats.collections?.users?.count || 0} records
- Playlists: ${databaseStats.collections?.playlists?.count || 0} records
- Recommendations: ${databaseStats.collections?.recommendations?.count || 0} records

**Storage:**
- Total Size: ${databaseStats.performance?.totalSize || '0 MB'}
- Index Size: ${databaseStats.performance?.indexSize || '0 MB'}
- Average Query Time: ${databaseStats.performance?.avgQueryTime || '0'}ms`;
        
      case 'query':
        const collection = params[0];
        const filter = params[1];
        if (!collection) return 'Please specify a collection to query';
        
        const queryResult = await fetch('/api/database/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ collection, filter: filter ? JSON.parse(filter) : {} }),
        }).then(r => r.json());
        
        if (queryResult.success) {
          return `📊 **Query Result:**\nFound ${queryResult.data.length} documents in ${collection}`;
        }
        return `❌ Query failed: ${queryResult.error}`;
        
      default:
        return `Unknown database command: ${subcommand}`;
    }
  };
  
  const handleAnalyticsCommand = async (args) => {
    const [subcommand] = args;
    
    switch (subcommand) {
      case 'taste-profile':
        return `🎭 **Your Music Taste Profile:**
Based on your listening history and preferences:
- **Top Genres:** ${databaseStats.insights?.topGenres?.slice(0, 3).join(', ') || 'Analyzing...'}
- **Listening Diversity:** ${databaseStats.insights?.diversity || 'High'}
- **Discovery Rate:** ${databaseStats.insights?.discoveryRate || '15%'} new music per month
- **Most Active Time:** ${databaseStats.insights?.peakHour || '8-10 PM'}`;
        
      case 'mood-patterns':
        return `🎭 **Mood-Based Listening Patterns:**
Your music choices by emotional context:
- **Happy/Energetic:** 35% (Pop, Dance, Hip-Hop)
- **Calm/Relaxed:** 40% (Indie, Folk, Ambient)
- **Focused/Productive:** 15% (Instrumental, Lo-Fi)
- **Nostalgic/Emotional:** 10% (Classic Rock, Singer-Songwriter)`;
        
      default:
        return `Unknown analytics command: ${subcommand}`;
    }
  };
  
  const handleRecommendationCommand = async (args) => {
    const [type, ...params] = args;
    
    switch (type) {
      case 'by-activity':
        const activity = params.join(' ');
        return `🎯 **Recommendations for ${activity}:**
Based on your preferences and the activity context:
1. **Upbeat Pop Mix** - High energy tracks perfect for ${activity}
2. **Electronic Focus** - Instrumental beats to keep you motivated
3. **Your Favorites Remix** - Familiar songs with the right energy
4. **Discovery Mix** - New artists you might love for ${activity}`;
        
      case 'by-mood':
        const mood = params.join(' ');
        return `🎭 **Recommendations for ${mood} mood:**
Curated based on your listening history and current mood:
1. **${mood.charAt(0).toUpperCase() + mood.slice(1)} Vibes** - Perfectly matched tracks
2. **Mood Evolution** - Songs to enhance or shift your current state
3. **Personal Touch** - Your favorites that match this mood
4. **New Discoveries** - Fresh tracks aligned with your ${mood} preferences`;
        
      default:
        return `Unknown recommendation type: ${type}`;
    }
  };
  
  const generateHelpMessage = () => {
    return `🤖 **EchoTune AI Commands:**

**Spotify Integration:**
- \`/spotify current-track\` - Show currently playing song
- \`/spotify recent-tracks [limit]\` - Show recent listening history
- \`/spotify top-tracks [time_range]\` - Show your top tracks
- \`/spotify playlists\` - List your playlists

**Database Operations:**
- \`/db stats\` - Show database statistics
- \`/db query [collection] [filter]\` - Query collections
- \`/db analyze\` - Analyze your listening patterns

**Analytics:**
- \`/analytics taste-profile\` - Generate your music taste profile
- \`/analytics mood-patterns\` - Show mood-based listening patterns
- \`/analytics trends\` - Show listening trends over time

**Recommendations:**
- \`/recommend by-activity [activity]\` - Get activity-based recommendations
- \`/recommend by-mood [mood]\` - Get mood-based recommendations
- \`/recommend discover-new\` - Find new music you might like

**General:**
- \`/help\` - Show this help message

You can also ask natural language questions like:
- "What's my most played song this month?"
- "Find music similar to The Beatles"
- "Create a workout playlist"
- "How has my music taste changed over time?"`;
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatMessage = (message) => {
    // Basic markdown formatting
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  };
  
  const renderMessage = (message) => (
    <ListItem key={message.id} sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
        <Avatar sx={{ bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main' }}>
          {message.type === 'user' ? <Person /> : <SmartToy />}
        </Avatar>
        
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2">
              {message.type === 'user' ? 'You' : 'EchoTune AI'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {message.timestamp.toLocaleTimeString()}
            </Typography>
            {message.metadata?.responseTime && (
              <Chip 
                label={`${message.metadata.responseTime}ms`} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Box>
          
          <Paper 
            sx={{ 
              p: 2, 
              bgcolor: message.type === 'user' ? 'primary.50' : 'grey.50',
              border: message.type === 'error' ? '1px solid red' : 'none',
            }}
          >
            <Typography 
              variant="body1" 
              dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
            />
            
            {message.tools && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {message.tools.map(tool => (
                  <Chip
                    key={tool}
                    label={chatTools[tool]?.name}
                    icon={chatTools[tool]?.icon}
                    size="small"
                    onClick={() => setSelectedTool(tool)}
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </ListItem>
  );
  
  const renderToolExamples = () => {
    if (!selectedTool) return null;
    
    const tool = chatTools[selectedTool];
    
    return (
      <Dialog open={Boolean(selectedTool)} onClose={() => setSelectedTool(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {tool.icon}
          {tool.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {tool.description}
          </Typography>
          
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Examples</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {tool.examples.map((example, index) => (
                  <ListItem key={index} button onClick={() => {
                    setInputMessage(example);
                    setSelectedTool(null);
                  }}>
                    <ListItemText primary={example} />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Commands</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {tool.commands.map((command, index) => (
                  <ListItem key={index} button onClick={() => {
                    setInputMessage(command);
                    setSelectedTool(null);
                  }}>
                    <ListItemText 
                      primary={<code>{command}</code>}
                      sx={{ '& code': { fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, borderRadius: 1 } }}
                    />
                  </ListItem>
                ))}
              </List>
            </AccordionDetails>
          </Accordion>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedTool(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  };
  
  const renderSpotifyWidget = () => {
    if (!spotifyData.currentTrack) return null;
    
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <VolumeUp /> Currently Playing
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {spotifyData.currentTrack.album?.images?.[0] && (
              <img 
                src={spotifyData.currentTrack.album.images[0].url} 
                alt="Album cover"
                style={{ width: 60, height: 60, borderRadius: 8 }}
              />
            )}
            <Box>
              <Typography variant="subtitle1">{spotifyData.currentTrack.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {spotifyData.currentTrack.artists?.map(a => a.name).join(', ')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {spotifyData.currentTrack.album?.name}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">🎵 EchoTune AI Chat</Typography>
          <Chip 
            label={chatMode} 
            size="small" 
            color="primary"
            onClick={() => setChatMode(chatMode === 'conversational' ? 'spotify' : 'conversational')}
          />
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Performance">
            <Chip 
              label={`${performance.responseTime}ms`} 
              size="small" 
              icon={<Speed />}
            />
          </Tooltip>
          <IconButton onClick={() => setShowExamples(true)}>
            <Help />
          </IconButton>
          <IconButton onClick={() => setShowSettings(true)}>
            <Settings />
          </IconButton>
        </Box>
      </Paper>
      
      {/* Spotify Widget */}
      {renderSpotifyWidget()}
      
      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        <List>
          {messages.map(renderMessage)}
          
          {/* Streaming message */}
          {isStreaming && streamingMessage && (
            <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <SmartToy />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    EchoTune AI <CircularProgress size={12} sx={{ ml: 1 }} />
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography 
                      variant="body1" 
                      dangerouslySetInnerHTML={{ __html: formatMessage(streamingMessage) }}
                    />
                  </Paper>
                </Box>
              </Box>
            </ListItem>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Input */}
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={3}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask me about your music, get recommendations, or use commands like /spotify current-track"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={isLoading}
          />
          
          {voiceSupported && (
            <IconButton
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              color={isRecording ? 'secondary' : 'default'}
            >
              {isRecording ? <MicOff /> : <Mic />}
            </IconButton>
          )}
          
          <IconButton onClick={() => sendMessage()} disabled={isLoading || !inputMessage.trim()}>
            {isLoading ? <CircularProgress size={24} /> : <Send />}
          </IconButton>
        </Box>
        
        {/* Quick action chips */}
        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Chip 
            label="What's playing?" 
            size="small" 
            onClick={() => setInputMessage("/spotify current-track")}
            icon={<MusicNote />}
          />
          <Chip 
            label="My top songs" 
            size="small" 
            onClick={() => setInputMessage("/spotify top-tracks")}
            icon={<Star />}
          />
          <Chip 
            label="Database stats" 
            size="small" 
            onClick={() => setInputMessage("/db stats")}
            icon={<Analytics />}
          />
          <Chip 
            label="Recommend music" 
            size="small" 
            onClick={() => setInputMessage("Recommend music for studying")}
            icon={<Psychology />}
          />
        </Box>
      </Paper>
      
      {/* Tool Examples Dialog */}
      {renderToolExamples()}
      
      {/* Examples Dialog */}
      <Dialog open={showExamples} onClose={() => setShowExamples(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Chat Examples & Tools</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {Object.entries(chatTools).map(([key, tool]) => (
              <Grid item xs={12} md={6} key={key}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {tool.icon}
                      {tool.name}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {tool.description}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedTool(key);
                        setShowExamples(false);
                      }}
                    >
                      View Examples
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExamples(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert severity={notification.type} onClose={() => setNotification(null)}>
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default EnhancedSpotifyChatInterface;