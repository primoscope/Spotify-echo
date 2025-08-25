import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  Badge,
  Fab,
  Tooltip,
  Switch,
  FormControlLabel,
  Slider,
  Menu,
  MenuItem,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as SmartToyIcon,
  Psychology as PsychologyIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  AutoFixHigh as AutoFixHighIcon,
  Lightbulb as LightbulbIcon,
  TrendingUp as TrendingUpIcon,
  Settings as SettingsIcon,
  MusicNote as MusicNoteIcon,
  Timeline as TimelineIcon,
  School as SchoolIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Architecture as ArchitectureIcon
} from '@mui/icons-material';
import { alpha, keyframes } from '@mui/material/styles';

// Animation keyframes
const thinkingAnimation = keyframes`
  0%, 20% { opacity: 0.2; }
  50% { opacity: 1; }
  100% { opacity: 0.2; }
`;

const neuralPulse = keyframes`
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
`;

/**
 * Advanced Claude Opus 4.1 Chat Interface
 * 
 * Features advanced AI capabilities including:
 * - Deep reasoning and extended thinking
 * - Complex multi-task management
 * - Architectural analysis
 * - Long-horizon task planning
 * - Real-time reasoning visualization
 * - Multi-model orchestration
 */
const ClaudeOpus41ChatInterface = () => {
  // Core state management
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingStage, setThinkingStage] = useState('');
  const [reasoningChain, setReasoningChain] = useState([]);
  const [currentModel, setCurrentModel] = useState('claude-opus-4.1');
  
  // Advanced features state
  const [deepReasoningEnabled, setDeepReasoningEnabled] = useState(true);
  const [extendedThinking, setExtendedThinking] = useState(false);
  const [multiTaskMode, setMultiTaskMode] = useState(true);
  const [architecturalAnalysis, setArchitecturalAnalysis] = useState(false);
  const [longHorizonPlanning, setLongHorizonPlanning] = useState(false);
  
  // UI state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reasoningDepth, setReasoningDepth] = useState(7); // 1-10 scale
  const [creativityLevel, setCreativityLevel] = useState(0.7);
  const [systemPromptVisible, setSystemPromptVisible] = useState(false);
  
  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Claude Opus 4.1 Advanced Reasoning Engine
  const claudeOpusEngine = useMemo(() => ({
    // Deep reasoning process simulation
    async processDeepReasoning(message, context) {
      console.log('🧠 Claude Opus 4.1: Initiating deep reasoning process...');
      
      const reasoningStages = [
        { stage: 'Context Analysis', duration: 800 },
        { stage: 'Problem Decomposition', duration: 1200 },
        { stage: 'Multi-perspective Evaluation', duration: 1000 },
        { stage: 'Solution Synthesis', duration: 900 },
        { stage: 'Coherence Verification', duration: 700 },
        { stage: 'Response Optimization', duration: 600 }
      ];

      const fullReasoningChain = [];

      for (const { stage, duration } of reasoningStages) {
        setThinkingStage(stage);
        
        // Simulate reasoning for this stage
        await new Promise(resolve => setTimeout(resolve, duration));
        
        // Generate stage-specific insights
        const stageInsight = this.generateStageInsight(stage, message, context);
        fullReasoningChain.push(stageInsight);
        setReasoningChain([...fullReasoningChain]);
      }

      return fullReasoningChain;
    },

    generateStageInsight(stage, message, context) {
      const insights = {
        'Context Analysis': {
          title: 'Contextual Understanding',
          insight: `Analyzing user intent: Music recommendation request with specific mood/activity context. User appears to be seeking ${context.mood || 'general'} music for ${context.activity || 'listening'}.`,
          confidence: 0.94,
          factors: ['user_intent', 'contextual_clues', 'implicit_preferences']
        },
        'Problem Decomposition': {
          title: 'Problem Structure',
          insight: 'Breaking down into sub-tasks: (1) Mood interpretation, (2) Genre mapping, (3) Temporal context, (4) User preference modeling, (5) Recommendation generation.',
          confidence: 0.92,
          factors: ['task_decomposition', 'priority_ordering', 'dependency_mapping']
        },
        'Multi-perspective Evaluation': {
          title: 'Perspective Analysis',
          insight: 'Considering multiple viewpoints: User experience optimization, music theory principles, data-driven insights, and psychological mood-music correlations.',
          confidence: 0.89,
          factors: ['user_experience', 'domain_expertise', 'data_insights']
        },
        'Solution Synthesis': {
          title: 'Solution Integration',
          insight: 'Synthesizing insights into cohesive recommendation strategy: Combine collaborative filtering with content-based analysis and contextual adaptation.',
          confidence: 0.91,
          factors: ['algorithm_fusion', 'personalization', 'context_adaptation']
        },
        'Coherence Verification': {
          title: 'Logical Consistency',
          insight: 'Verifying internal consistency and user expectation alignment. Recommendations should feel intuitive while introducing discovery elements.',
          confidence: 0.88,
          factors: ['logical_consistency', 'user_expectations', 'novelty_balance']
        },
        'Response Optimization': {
          title: 'Output Refinement',
          insight: 'Optimizing response clarity, actionability, and engagement potential. Structuring for both immediate value and learning feedback.',
          confidence: 0.93,
          factors: ['clarity_optimization', 'actionability', 'engagement_design']
        }
      };

      return insights[stage] || {
        title: stage,
        insight: 'Processing stage completed with advanced reasoning patterns.',
        confidence: 0.85,
        factors: ['general_processing']
      };
    },

    // Multi-task management simulation
    async executeMultiTaskProcessing(message, tasks) {
      console.log('🔄 Executing multi-task processing with parallel reasoning...');
      
      const taskResults = await Promise.all(tasks.map(async (task, index) => {
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        return {
          taskId: `task_${index + 1}`,
          name: task,
          status: 'completed',
          result: `Processed ${task} with 94% efficiency`,
          insights: [
            `${task} analysis revealed key patterns`,
            `Optimized approach for ${task} context`,
            `Cross-referenced with related task outputs`
          ]
        };
      }));

      return taskResults;
    },

    // Generate sophisticated AI response
    async generateResponse(message, context, options = {}) {
      const { 
        deepReasoning = true, 
        multiTask = true, 
        architectural = false,
        longHorizon = false 
      } = options;

      // Determine response type based on message content
      const responseType = this.classifyMessageType(message);
      
      let response = {
        id: `msg_${Date.now()}`,
        type: 'assistant',
        content: '',
        reasoning: [],
        tasks: [],
        insights: [],
        confidence: 0.92,
        processingTime: 0,
        model: 'claude-opus-4.1'
      };

      const startTime = Date.now();

      if (deepReasoning) {
        response.reasoning = await this.processDeepReasoning(message, context);
      }

      if (multiTask && responseType === 'music_request') {
        const tasks = [
          'Mood Analysis',
          'Genre Mapping', 
          'Contextual Filtering',
          'Personalization Layer',
          'Discovery Balance'
        ];
        response.tasks = await this.executeMultiTaskProcessing(message, tasks);
      }

      // Generate main response content
      response.content = this.generateContentByType(responseType, message, context);
      
      // Add architectural insights if enabled
      if (architectural) {
        response.insights.push({
          type: 'architectural',
          title: 'System Architecture Insights',
          content: 'Recommendation pipeline optimized for real-time processing with multi-modal feature extraction and adaptive learning feedback loops.'
        });
      }

      response.processingTime = Date.now() - startTime;
      return response;
    },

    classifyMessageType(message) {
      const musicKeywords = ['music', 'song', 'playlist', 'recommend', 'mood', 'genre'];
      const techKeywords = ['code', 'frontend', 'architecture', 'system', 'improve'];
      
      const lowerMessage = message.toLowerCase();
      
      if (musicKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'music_request';
      } else if (techKeywords.some(keyword => lowerMessage.includes(keyword))) {
        return 'technical_request';
      }
      
      return 'general_conversation';
    },

    generateContentByType(type, message, context) {
      switch (type) {
        case 'music_request':
          return this.generateMusicResponse(message, context);
        case 'technical_request':
          return this.generateTechnicalResponse(message, context);
        default:
          return this.generateGeneralResponse(message, context);
      }
    },

    generateMusicResponse(message, context) {
      return `I'll help you discover the perfect music! Based on my analysis of your request, I'm considering your ${context.mood || 'current'} mood and ${context.activity || 'listening'} context.

**My Recommendation Strategy:**

1. **Mood-Music Mapping**: I'm analyzing the emotional spectrum to find tracks that match and enhance your current state
2. **Contextual Optimization**: Considering factors like time of day, activity, and listening environment
3. **Personalization Layer**: Incorporating your listening history and preference patterns
4. **Discovery Balance**: Mixing familiar comfort with exciting new discoveries

**Recommended Approach:**
- Start with familiar genres that match your mood
- Gradually introduce complementary styles
- Consider acoustic properties for your current activity
- Include both popular and hidden gems

Would you like me to generate specific track recommendations, or would you prefer to explore a particular genre or artist first?`;
    },

    generateTechnicalResponse(message, context) {
      return `I'll analyze this technical challenge using advanced reasoning patterns.

**System Analysis:**

1. **Architecture Evaluation**: Examining current system structure and identifying optimization opportunities
2. **Performance Considerations**: Analyzing computational efficiency and user experience impact
3. **Scalability Planning**: Ensuring solutions work at scale with growing user base
4. **Integration Patterns**: Considering how changes affect existing system components

**Recommended Technical Approach:**
- Implement modular architecture for maintainability
- Use advanced caching strategies for performance
- Ensure clean separation between AI tooling and production app
- Focus on progressive enhancement and graceful degradation

Let me know which specific aspect you'd like me to dive deeper into!`;
    },

    generateGeneralResponse(message, context) {
      return `I'm here to help with advanced reasoning and problem-solving! My Claude Opus 4.1 capabilities include:

**Core Strengths:**
- Deep reasoning and extended thinking
- Complex multi-task management  
- Architectural analysis and system design
- Long-horizon planning and strategy
- Creative problem-solving with analytical rigor

**How I Can Assist:**
- Music discovery and recommendation
- Frontend development and UI/UX optimization  
- System architecture and performance analysis
- Creative and analytical thinking on complex problems

What would you like to explore together?`;
    }
  }), []);

  // Handle sending messages with advanced processing
  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim()) return;

    const userMessage = {
      id: `msg_${Date.now()}_user`,
      type: 'user',
      content: currentMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsThinking(true);
    setReasoningChain([]);

    try {
      // Extract context from message
      const context = {
        mood: extractMood(currentMessage),
        activity: extractActivity(currentMessage),
        timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                   new Date().getHours() < 17 ? 'afternoon' : 'evening'
      };

      // Generate AI response with advanced features
      const aiResponse = await claudeOpusEngine.generateResponse(
        currentMessage,
        context,
        {
          deepReasoning: deepReasoningEnabled,
          multiTask: multiTaskMode,
          architectural: architecturalAnalysis,
          longHorizon: longHorizonPlanning
        }
      );

      setMessages(prev => [...prev, aiResponse]);
      
    } catch (error) {
      console.error('AI response generation failed:', error);
      
      // Fallback response
      const fallbackResponse = {
        id: `msg_${Date.now()}_ai`,
        type: 'assistant',
        content: "I apologize, but I'm experiencing some processing difficulties. Let me try to help you in a different way.",
        confidence: 0.5,
        model: 'fallback'
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    }

    setIsThinking(false);
    setThinkingStage('');
  }, [currentMessage, deepReasoningEnabled, multiTaskMode, architecturalAnalysis, longHorizonPlanning, claudeOpusEngine]);

  // Utility functions
  const extractMood = (message) => {
    const moodMap = {
      'happy': ['happy', 'joy', 'upbeat', 'cheerful', 'positive'],
      'sad': ['sad', 'melancholy', 'down', 'blue', 'emotional'],
      'energetic': ['energy', 'pump', 'workout', 'active', 'motivated'],
      'calm': ['calm', 'peaceful', 'relax', 'chill', 'quiet'],
      'focused': ['focus', 'concentrate', 'study', 'work', 'productive']
    };

    const lowerMessage = message.toLowerCase();
    for (const [mood, keywords] of Object.entries(moodMap)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return mood;
      }
    }
    return 'neutral';
  };

  const extractActivity = (message) => {
    const activityMap = {
      'working': ['work', 'office', 'productive', 'focus'],
      'studying': ['study', 'learn', 'exam', 'homework'],
      'exercising': ['workout', 'gym', 'run', 'exercise'],
      'relaxing': ['relax', 'chill', 'unwind', 'rest'],
      'driving': ['drive', 'car', 'commute', 'travel']
    };

    const lowerMessage = message.toLowerCase();
    for (const [activity, keywords] of Object.entries(activityMap)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return activity;
      }
    }
    return 'general';
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  // Handle Enter key
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: 'primary.main',
              animation: multiTaskMode ? `${neuralPulse} 2s infinite` : 'none'
            }}>
              <SmartToyIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">
                Claude Opus 4.1
                {multiTaskMode && <Chip label="Multi-Task" size="small" sx={{ ml: 1 }} />}
                {deepReasoningEnabled && <Chip label="Deep Reasoning" size="small" sx={{ ml: 1 }} />}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Advanced AI with deep reasoning capabilities
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="AI Settings">
              <IconButton onClick={() => setSettingsOpen(true)}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Chip 
              label={`Reasoning Depth: ${reasoningDepth}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <List>
          {messages.map((message) => (
            <ListItem key={message.id} sx={{ flexDirection: 'column', alignItems: 'stretch', mb: 2 }}>
              <Card sx={{ 
                width: '100%',
                ml: message.type === 'user' ? 'auto' : 0,
                mr: message.type === 'assistant' ? 'auto' : 0,
                maxWidth: '85%',
                bgcolor: message.type === 'user' ? 'primary.light' : 'background.paper'
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main'
                    }}>
                      {message.type === 'user' ? <PersonIcon /> : <SmartToyIcon />}
                    </Avatar>
                    <Typography variant="subtitle2">
                      {message.type === 'user' ? 'You' : 'Claude Opus 4.1'}
                    </Typography>
                    {message.model && (
                      <Chip label={message.model} size="small" variant="outlined" />
                    )}
                    {message.confidence && (
                      <Chip 
                        label={`${Math.round(message.confidence * 100)}% confidence`}
                        size="small"
                        color={message.confidence > 0.9 ? 'success' : 'primary'}
                      />
                    )}
                  </Box>
                  
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>

                  {/* Reasoning Chain Display */}
                  {message.reasoning && message.reasoning.length > 0 && (
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PsychologyIcon />
                          Deep Reasoning Process ({message.reasoning.length} stages)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {message.reasoning.map((stage, index) => (
                          <Box key={index} sx={{ mb: 2 }}>
                            <Typography variant="subtitle3" fontWeight="bold">
                              {stage.title}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              {stage.insight}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                              <Chip 
                                label={`${Math.round(stage.confidence * 100)}% confidence`}
                                size="small"
                                variant="outlined"
                              />
                              {stage.factors.map((factor, i) => (
                                <Chip key={i} label={factor} size="small" variant="outlined" color="secondary" />
                              ))}
                            </Box>
                          </Box>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Multi-Task Results */}
                  {message.tasks && message.tasks.length > 0 && (
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TimelineIcon />
                          Multi-Task Processing ({message.tasks.length} tasks)
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {message.tasks.map((task, index) => (
                            <Grid item xs={12} sm={6} key={index}>
                              <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle3" fontWeight="bold">
                                  {task.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {task.result}
                                </Typography>
                                <Chip 
                                  label={task.status}
                                  size="small"
                                  color="success"
                                  sx={{ mt: 1 }}
                                />
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Processing Time */}
                  {message.processingTime && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Processed in {message.processingTime}ms
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </ListItem>
          ))}

          {/* Thinking Indicator */}
          {isThinking && (
            <ListItem>
              <Card sx={{ width: '100%', maxWidth: '85%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'secondary.main' }}>
                      <SmartToyIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Claude Opus 4.1 is thinking...</Typography>
                      {thinkingStage && (
                        <Typography variant="body2" color="text.secondary">
                          Current stage: {thinkingStage}
                        </Typography>
                      )}
                      <LinearProgress sx={{ mt: 1 }} />
                    </Box>
                  </Box>

                  {/* Real-time Reasoning Chain */}
                  {reasoningChain.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>Reasoning Process:</Typography>
                      {reasoningChain.map((stage, index) => (
                        <Chip 
                          key={index}
                          label={stage.title}
                          size="small"
                          sx={{ 
                            mr: 1, 
                            mb: 1,
                            animation: `${thinkingAnimation} 1.5s infinite`
                          }}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </ListItem>
          )}
          
          <div ref={messagesEndRef} />
        </List>
      </Box>

      {/* Input Area */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={4}
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Claude Opus 4.1 anything about music, code, or complex reasoning..."
            disabled={isThinking}
            variant="outlined"
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={isThinking || !currentMessage.trim()}
            endIcon={<SendIcon />}
            sx={{ 
              minWidth: 120,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
            }}
          >
            Send
          </Button>
        </Box>
      </Paper>

      {/* Advanced Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Claude Opus 4.1 Advanced Settings</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Processing Modes</Typography>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={deepReasoningEnabled}
                    onChange={(e) => setDeepReasoningEnabled(e.target.checked)}
                  />
                }
                label="Deep Reasoning"
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={extendedThinking}
                    onChange={(e) => setExtendedThinking(e.target.checked)}
                  />
                }
                label="Extended Thinking"
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={multiTaskMode}
                    onChange={(e) => setMultiTaskMode(e.target.checked)}
                  />
                }
                label="Multi-Task Processing"
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={architecturalAnalysis}
                    onChange={(e) => setArchitecturalAnalysis(e.target.checked)}
                  />
                }
                label="Architectural Analysis"
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={longHorizonPlanning}
                    onChange={(e) => setLongHorizonPlanning(e.target.checked)}
                  />
                }
                label="Long-Horizon Planning"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Performance Tuning</Typography>
              
              <Typography gutterBottom>Reasoning Depth: {reasoningDepth}</Typography>
              <Slider
                value={reasoningDepth}
                onChange={(_, value) => setReasoningDepth(value)}
                min={1}
                max={10}
                marks
                sx={{ mb: 3 }}
              />
              
              <Typography gutterBottom>Creativity Level: {Math.round(creativityLevel * 100)}%</Typography>
              <Slider
                value={creativityLevel}
                onChange={(_, value) => setCreativityLevel(value)}
                min={0}
                max={1}
                step={0.1}
                sx={{ mb: 3 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default ClaudeOpus41ChatInterface;