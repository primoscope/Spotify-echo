import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Chip,
  Avatar,
  List,
  ListItem,
  Stack,
  Divider,
  Tooltip,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Collapse,
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  ThumbUp,
  ExpandMore,
  ExpandLess,
  Psychology,
  Mood,
  LibraryMusic,
  FitnessCenter,
  VolumeUp,
  Info,
} from '@mui/icons-material';
import { useLLM } from '../contexts/LLMContext';

/**
 * Enhanced Chat Interface with Context Chips and Explainable Responses
 */
const EnhancedChatInterface = ({
  sessionId,
  onSendMessage,
  onProvideFeedback,
  initialMessages = [],
  loading = false,
  disabled = false,
}) => {
  const renderStart = (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const [messages, setMessages] = useState(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [contextChips, setContextChips] = useState({});
  const [selectedContext, setSelectedContext] = useState({});
  const [expandedContexts, setExpandedContexts] = useState({ moods: true });
  const [feedbackDialog, setFeedbackDialog] = useState({ open: false, message: null });
  const [explanationDialog, setExplanationDialog] = useState({
    open: false,
    message: null,
    explanation: null,
  });
  const [explainInline, setExplainInline] = useState(false);
  const [providerMenu, setProviderMenu] = useState(null);
  const [currentProviderLocal, setCurrentProviderLocal] = useState('mock');

  const { currentProvider, providers, switchProvider, loading: providerLoading } = useLLM?.()
    || { currentProvider: 'mock', providers: {}, switchProvider: async () => false, loading: false };

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setCurrentProviderLocal(currentProvider);
  }, [currentProvider]);

  // Mount-time performance log
  useEffect(() => {
    const end = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const dur = Math.round(end - renderStart);
    try { console.info(`[perf] EnhancedChatInterface mount render ${dur}ms`); } catch {}
  }, []);

  // Load context chips
  useEffect(() => {
    loadContextChips();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadContextChips = async () => {
    try {
      const response = await fetch('/api/chat/context-chips', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setContextChips(data.contextChips || {});
      }
    } catch (error) {
      console.error('Error loading context chips:', error);
      // Fallback context chips
      setContextChips({
        moods: [
          { id: 'happy', label: 'Happy', emoji: '😊', description: 'Upbeat and positive music' },
          { id: 'sad', label: 'Sad', emoji: '😢', description: 'Melancholic and emotional tracks' },
          {
            id: 'energetic',
            label: 'Energetic',
            emoji: '⚡',
            description: 'High-energy and motivating',
          },
          { id: 'calm', label: 'Calm', emoji: '😌', description: 'Peaceful and relaxing vibes' },
        ],
        genres: [
          { id: 'pop', label: 'Pop', emoji: '🎵', description: 'Popular and mainstream hits' },
          { id: 'rock', label: 'Rock', emoji: '🎸', description: 'Guitar-driven rock music' },
          { id: 'hip-hop', label: 'Hip-Hop', emoji: '🎤', description: 'Rap and urban beats' },
          {
            id: 'electronic',
            label: 'Electronic',
            emoji: '🎛️',
            description: 'EDM and electronic dance music',
          },
        ],
        activities: [
          { id: 'workout', label: 'Workout', emoji: '🏋️', description: 'High-energy gym music' },
          {
            id: 'study',
            label: 'Study',
            emoji: '📚',
            description: 'Focus and concentration music',
          },
          { id: 'party', label: 'Party', emoji: '🎉', description: 'Dance and party anthems' },
          {
            id: 'relaxation',
            label: 'Relaxation',
            emoji: '🧘',
            description: 'Meditation and chill music',
          },
        ],
      });
    }
  };

  const handleContextChipClick = (category, chip) => {
    setSelectedContext((prev) => ({
      ...prev,
      [category]: prev[category] === chip.id ? null : chip.id,
    }));
  };

  const toggleContextExpansion = (category) => {
    setExpandedContexts((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading || disabled) return;

    const newMessage = {
      id: Date.now(),
      role: 'user',
      content: inputMessage,
      context: selectedContext,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');

    try {
      if (onSendMessage) {
        const response = await onSendMessage(inputMessage, selectedContext);

        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.response,
          context: selectedContext,
          recommendations: response.recommendations,
          explanation: response.explanation,
          provider: response.provider,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        error: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFeedback = async (message, feedback, rating = null) => {
    try {
      if (onProvideFeedback) {
        await onProvideFeedback(sessionId, message.id, feedback, rating);
      }
      setFeedbackDialog({ open: false, message: null });
    } catch (error) {
      console.error('Error providing feedback:', error);
    }
  };

  const showExplanation = (message) => {
    setExplanationDialog({
      open: true,
      message,
      explanation: message.explanation,
    });
  };

  const openProviderMenu = (event) => setProviderMenu(event.currentTarget);
  const closeProviderMenu = () => setProviderMenu(null);

  const handleProviderSelect = async (providerId) => {
    closeProviderMenu();
    if (providerId === currentProvider) return;
    const ok = await switchProvider(providerId);
    if (ok) setCurrentProviderLocal(providerId);
  };

  const ProviderQuickSwitch = () => (
    <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
      <Chip
        size="small"
        color="primary"
        label={`Provider: ${currentProviderLocal}`}
        onClick={openProviderMenu}
        avatar={<SmartToy fontSize="small" />}
        variant="outlined"
      />
      {providerLoading && <CircularProgress size={16} />}
      <Menu anchorEl={providerMenu} open={Boolean(providerMenu)} onClose={closeProviderMenu}>
        {Object.entries(providers)
          .filter(([, p]) => p.available)
          .map(([id, p]) => (
            <MenuItem key={id} selected={id === currentProviderLocal} onClick={() => handleProviderSelect(id)}>
              {p.name} {id === currentProviderLocal ? '✓' : ''}
            </MenuItem>
          ))}
      </Menu>
    </Box>
  );

  const statusToColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'connected':
        return 'success';
      case 'error':
        return 'error';
      case 'unknown':
        return 'warning';
      default:
        return 'default';
    }
  };

  const ProviderStatusChip = () => {
    const st = providers?.[currentProvider]?.status || 'unknown';
    return (
      <Chip
        size="small"
        label={`Status: ${st}`}
        color={statusToColor(st)}
        variant="outlined"
      />
    );
  };

  const ContextChipsSection = ({ category, chips, icon: Icon }) => (
    <Box sx={{ mb: 2 }}>
      <Button
        startIcon={<Icon />}
        endIcon={expandedContexts[category] ? <ExpandLess /> : <ExpandMore />}
        onClick={() => toggleContextExpansion(category)}
        size="small"
        sx={{ mb: 1, textTransform: 'capitalize' }}
      >
        {category}
      </Button>

      <Collapse in={expandedContexts[category]}>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {chips.map((chip) => (
            <Chip
              key={chip.id}
              label={`${chip.emoji} ${chip.label}`}
              variant={selectedContext[category] === chip.id ? 'filled' : 'outlined'}
              color={selectedContext[category] === chip.id ? 'primary' : 'default'}
              size="small"
              onClick={() => handleContextChipClick(category, chip)}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
      </Collapse>
    </Box>
  );

  const MessageItem = ({ message }) => {
    const isUser = message.role === 'user';
    const hasRecommendations = message.recommendations && message.recommendations.length > 0;
    const hasExplanation = message.explanation;

    return (
      <ListItem
        sx={{
          flexDirection: 'column',
          alignItems: isUser ? 'flex-end' : 'flex-start',
          px: 2,
          py: 1,
        }}
      >
        <Box sx={{ maxWidth: '80%', width: 'fit-content' }}>
          {/* Message Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 1 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                bgcolor: isUser ? 'primary.main' : 'secondary.main',
                order: isUser ? 2 : 1,
              }}
            >
              {isUser ? <Person /> : <SmartToy />}
            </Avatar>
            <Typography variant="caption" color="text.secondary" sx={{ order: isUser ? 1 : 2 }}>
              {isUser ? 'You' : message.provider ? `AI (${message.provider})` : 'AI'}
            </Typography>
          </Box>

          {/* Message Content */}
          <Paper
            elevation={1}
            sx={{
              p: 2,
              bgcolor: isUser ? 'primary.light' : 'background.paper',
              color: isUser ? 'primary.contrastText' : 'text.primary',
              borderRadius: 2,
              borderTopRightRadius: isUser ? 0 : 2,
              borderTopLeftRadius: isUser ? 2 : 0,
            }}
          >
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>

            {/* Context Display */}
            {message.context && Object.keys(message.context).length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                  {Object.entries(message.context).map(
                    ([key, value]) =>
                      value && (
                        <Chip
                          key={key}
                          label={`${key}: ${value}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                      )
                  )}
                </Stack>
              </Box>
            )}
          </Paper>

          {/* Recommendations */}
          {hasRecommendations && (
            <Card sx={{ mt: 1, maxWidth: 400 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <VolumeUp fontSize="small" />
                  Recommended Tracks
                </Typography>
                <List dense sx={{ p: 0 }}>
                  {message.recommendations.slice(0, 3).map((track, idx) => (
                    <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                      <Typography variant="body2" noWrap>
                        {track.name} - {track.artist}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
                {message.recommendations.length > 3 && (
                  <Typography variant="caption" color="text.secondary">
                    +{message.recommendations.length - 3} more tracks
                  </Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assistant Message Actions */}
          {!isUser && !message.error && (
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
              <Tooltip title="Rate this response">
                <IconButton size="small" onClick={() => setFeedbackDialog({ open: true, message })}>
                  <ThumbUp fontSize="small" />
                </IconButton>
              </Tooltip>

              {hasExplanation && !explainInline && (
                <Tooltip title="View explanation">
                  <IconButton size="small" color="info" onClick={() => showExplanation(message)}>
                    <Info fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}

          {/* Inline Explanation */}
          {!isUser && hasExplanation && explainInline && (
            <Card sx={{ mt: 1 }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Why this response
                </Typography>
                <Typography variant="body2" paragraph>
                  {message.explanation.summary}
                </Typography>
                {Array.isArray(message.explanation.reasoning) && (
                  <List dense sx={{ py: 0 }}>
                    {message.explanation.reasoning.map((r, idx) => (
                      <ListItem key={idx} sx={{ py: 0 }}>
                        <Typography variant="body2">• {r}</Typography>
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          )}

          {/* Error indicator */}
          {message.error && (
            <Alert severity="error" sx={{ mt: 1 }}>
              <Typography variant="body2">There was an error processing this message.</Typography>
            </Alert>
          )}
        </Box>
      </ListItem>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy color="primary" />
            AI Music Assistant
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ProviderStatusChip />
            <ProviderQuickSwitch />
            <Chip
              size="small"
              label={explainInline ? 'Explain: On' : 'Explain: Off'}
              color={explainInline ? 'success' : 'default'}
              onClick={() => setExplainInline((v) => !v)}
              variant={explainInline ? 'filled' : 'outlined'}
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Get personalized music recommendations with AI explanations
        </Typography>
      </Paper>

      {/* Context Chips */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Typography variant="subtitle2" gutterBottom>
          Set Context for Better Recommendations:
        </Typography>

        <Stack spacing={1}>
          {contextChips.moods && (
            <ContextChipsSection category="moods" chips={contextChips.moods} icon={Mood} />
          )}

          {contextChips.genres && (
            <ContextChipsSection
              category="genres"
              chips={contextChips.genres}
              icon={LibraryMusic}
            />
          )}

          {contextChips.activities && (
            <ContextChipsSection
              category="activities"
              chips={contextChips.activities}
              icon={FitnessCenter}
            />
          )}
        </Stack>
      </Paper>

      <Divider />

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', bgcolor: 'grey.50' }}>
        {messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 4 }}>
            <SmartToy sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Start a Conversation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ask me for music recommendations, set your mood, or explore new genres!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))}
            {loading && (
              <ListItem sx={{ justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  AI is thinking...
                </Typography>
              </ListItem>
            )}
          </List>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Input */}
      <Paper sx={{ p: 2, borderRadius: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            ref={inputRef}
            fullWidth
            multiline
            maxRows={3}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask for music recommendations, set your mood, or explore genres..."
            disabled={loading || disabled}
            variant="outlined"
            size="small"
          />

          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || loading || disabled}
            sx={{ p: 1 }}
          >
            <Send />
          </IconButton>
        </Box>

        {/* Selected Context Summary */}
        {Object.keys(selectedContext).length > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Current context:
            </Typography>
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              {Object.entries(selectedContext).map(
                ([key, value]) =>
                  value && (
                    <Chip
                      key={key}
                      label={`${value}`}
                      size="small"
                      variant="filled"
                      color="primary"
                      onDelete={() => handleContextChipClick(key, { id: value })}
                    />
                  )
              )}
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Feedback Dialog */}
      <Dialog
        open={feedbackDialog.open}
        onClose={() => setFeedbackDialog({ open: false, message: null })}
      >
        <DialogTitle>Rate This Response</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Help improve the AI by rating this response:
          </Typography>

          <Rating
            size="large"
            onChange={(_, value) => {
              if (feedbackDialog.message && value) {
                handleFeedback(feedbackDialog.message, 'rating', value);
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialog({ open: false, message: null })}>Cancel</Button>
          <Button onClick={() => handleFeedback(feedbackDialog.message, 'helpful')}>Helpful</Button>
          <Button onClick={() => handleFeedback(feedbackDialog.message, 'not_helpful')}>
            Not Helpful
          </Button>
        </DialogActions>
      </Dialog>

      {/* Explanation Dialog */}
      <Dialog
        open={explanationDialog.open}
        onClose={() => setExplanationDialog({ open: false, message: null, explanation: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Psychology color="primary" />
          AI Reasoning
        </DialogTitle>
        <DialogContent>
          {explanationDialog.explanation ? (
            <Box>
              <Typography variant="body1" paragraph>
                {explanationDialog.explanation.summary}
              </Typography>

              {explanationDialog.explanation.reasoning && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Reasoning:
                  </Typography>
                  <List dense>
                    {explanationDialog.explanation.reasoning.map((reason, idx) => (
                      <ListItem key={idx} sx={{ pl: 0 }}>
                        <Typography variant="body2">• {reason}</Typography>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          ) : (
            <Typography>No explanation available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setExplanationDialog({ open: false, message: null, explanation: null })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Provider Menu handled via ProviderQuickSwitch */}
    </Box>
  );
};

export default EnhancedChatInterface;
