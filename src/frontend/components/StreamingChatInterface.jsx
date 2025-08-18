import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Paper,
  TextField,
  IconButton,
  Typography,
  Box,
  Chip,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Snackbar,
  Alert,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Stack,
  Fade,
} from '@mui/material';
import {
  Send,
  Stop,
  SmartToy,
  Person,
  ContentCopy,
  ExpandMore,
  ExpandLess,
  Speed,
  Check,
  Error,
  Warning,
} from '@mui/icons-material';
import { useLLM } from '../contexts/LLMContext';

/**
 * Enhanced Streaming Chat Interface with Provider Quick-Switch
 */
const StreamingChatInterface = ({ sessionId = 'default' }) => {
  const {
    currentProvider,
    providers,
    providerHealth,
    streamingState,
    sendStreamingMessage,
    abortStream,
    switchProviderEnhanced,
  } = useLLM();

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [explainabilityPanel, setExplainabilityPanel] = useState({
    open: false,
    data: null
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [providerSwitching, setProviderSwitching] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingState.currentMessage]);

  // Handle streaming delta updates
  const handleStreamDelta = useCallback((delta, fullContent, isPartial) => {
    setTypingIndicator(true);
    // Delta is handled by streamingState.currentMessage
  }, []);

  // Handle streaming completion
  const handleStreamComplete = useCallback((result) => {
    setTypingIndicator(false);
    
    if (result.success) {
      const newMessage = {
        id: Date.now(),
        sender: 'assistant',
        content: result.response,
        timestamp: new Date(),
        provider: result.provider,
        metadata: {
          requestId: result.requestId,
          totalTime: result.totalTime,
          explainable: true
        }
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Show success feedback
      setSnackbar({
        open: true,
        message: `Response completed (${result.totalTime}ms)`,
        severity: 'success'
      });
    } else {
      // Show error feedback
      setSnackbar({
        open: true,
        message: result.error || 'Stream failed',
        severity: 'error'
      });
    }
  }, []);

  // Send message with streaming
  const handleSendMessage = async () => {
    if (!currentMessage.trim() || streamingState.isStreaming) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: currentMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage('');
    setTypingIndicator(true);

    try {
      await sendStreamingMessage(
        messageToSend,
        { sessionId },
        handleStreamDelta,
        handleStreamComplete
      );
    } catch (error) {
      setTypingIndicator(false);
      setSnackbar({
        open: true,
        message: 'Failed to send message',
        severity: 'error'
      });
    }
  };

  // Handle provider switching
  const handleProviderSwitch = async (providerId) => {
    if (providerId === currentProvider || streamingState.isStreaming) return;

    setProviderSwitching(true);
    try {
      await switchProviderEnhanced(providerId);
      setSnackbar({
        open: true,
        message: `Switched to ${providers[providerId]?.name}`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to switch provider: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setProviderSwitching(false);
    }
  };

  // Get provider health color
  const getProviderHealthColor = (providerId) => {
    const health = providerHealth[providerId];
    if (!health) return 'default';
    
    if (health.health === 'healthy') return 'success';
    if (health.health === 'recovering') return 'warning';
    return 'error';
  };

  // Format latency display
  const formatLatency = (latency) => {
    if (!latency) return 'N/A';
    return `${Math.round(latency)}ms`;
  };

  // Show explainability panel
  const showExplainability = (message) => {
    setExplainabilityPanel({
      open: true,
      data: {
        model: message.provider,
        prompt: 'User asked about music recommendations...',
        reasoning: 'Based on your listening history and current mood indicators...',
        confidence: 0.87,
        features: ['listening_history', 'time_of_day', 'mood_indicators'],
        metadata: message.metadata
      }
    });
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({
      open: true,
      message: 'Copied to clipboard',
      severity: 'success'
    });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Provider Health Chips */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Provider Status
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {Object.entries(providers).map(([id, provider]) => (
            <Chip
              key={id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="caption">{provider.name}</Typography>
                  {providerHealth[id] && (
                    <Typography variant="caption" color="text.secondary">
                      {formatLatency(providerHealth[id].avgLatency)}
                    </Typography>
                  )}
                </Box>
              }
              color={id === currentProvider ? 'primary' : getProviderHealthColor(id)}
              variant={id === currentProvider ? 'filled' : 'outlined'}
              onClick={() => handleProviderSwitch(id)}
              disabled={!provider.available || providerSwitching || streamingState.isStreaming}
              icon={id === currentProvider ? <Check /> : 
                    providerHealth[id]?.health === 'healthy' ? <Check /> :
                    providerHealth[id]?.health === 'recovering' ? <Warning /> : <Error />}
              sx={{ cursor: 'pointer' }}
            />
          ))}
        </Stack>
      </Paper>

      {/* Messages Area */}
      <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          <List>
            {messages.map((message) => (
              <ListItem
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Card 
                  sx={{ 
                    maxWidth: '70%',
                    bgcolor: message.sender === 'user' ? 'primary.main' : 'grey.100',
                    color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary'
                  }}
                >
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {message.sender === 'user' ? <Person /> : <SmartToy />}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {message.content}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            {message.timestamp.toLocaleTimeString()}
                            {message.provider && ` • ${providers[message.provider]?.name}`}
                          </Typography>
                          <Box>
                            <Tooltip title="Copy message">
                              <IconButton size="small" onClick={() => copyToClipboard(message.content)}>
                                <ContentCopy fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {message.metadata?.explainable && (
                              <Tooltip title="Show reasoning">
                                <IconButton size="small" onClick={() => showExplainability(message)}>
                                  <ExpandMore fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </ListItem>
            ))}

            {/* Streaming Message */}
            {streamingState.isStreaming && streamingState.currentMessage && (
              <ListItem sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                <Card sx={{ maxWidth: '70%', bgcolor: 'grey.100' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        <SmartToy />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          {streamingState.currentMessage}
                          <span style={{ opacity: 0.7 }}>▊</span>
                        </Typography>
                        <LinearProgress sx={{ mb: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Streaming from {providers[currentProvider]?.name}...
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </ListItem>
            )}

            {/* Typing Indicator */}
            {typingIndicator && !streamingState.currentMessage && (
              <ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Fade in={typingIndicator}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    AI is thinking...
                  </Typography>
                </Fade>
              </ListItem>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        {/* Input Area */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              ref={inputRef}
              fullWidth
              multiline
              maxRows={4}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask about music, get recommendations..."
              disabled={streamingState.isStreaming}
              aria-label="Message input"
            />
            {streamingState.isStreaming ? (
              <Tooltip title="Stop streaming">
                <IconButton 
                  color="error" 
                  onClick={abortStream}
                  aria-label="Stop streaming"
                >
                  <Stop />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Send message">
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!currentMessage.trim()}
                  aria-label="Send message"
                >
                  <Send />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Explainability Panel */}
      {explainabilityPanel.open && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">AI Reasoning</Typography>
              <IconButton onClick={() => setExplainabilityPanel({ open: false, data: null })}>
                <ExpandLess />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Model:</strong> {explainabilityPanel.data?.model}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Reasoning:</strong> {explainabilityPanel.data?.reasoning}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Confidence:</strong> {(explainabilityPanel.data?.confidence * 100).toFixed(1)}%
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">Key Features:</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                {explainabilityPanel.data?.features?.map((feature) => (
                  <Chip key={feature} label={feature} size="small" variant="outlined" />
                ))}
              </Stack>
            </Box>
            <Button
              size="small"
              startIcon={<ContentCopy />}
              onClick={() => copyToClipboard(JSON.stringify(explainabilityPanel.data, null, 2))}
              sx={{ mt: 2 }}
            >
              Copy Debug Info
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StreamingChatInterface;