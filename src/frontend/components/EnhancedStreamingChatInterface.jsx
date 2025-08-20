/**
 * Enhanced Streaming Chat Interface with Autonomous Improvements
 * This component includes research-driven enhancements based on autonomous development patterns
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Skeleton
} from '@mui/material';
import {
  Send,
  Stop,
  SmartToy,
  Person,
  ContentCopy,
  Speed,
  Check,
  Error,
  Warning,
  AutoAwesome,
  Refresh
} from '@mui/icons-material';
import { useLLM } from '../contexts/LLMContext';

/**
 * Enhanced Streaming Chat Interface with Autonomous Development Features
 * Integrates research-driven UI improvements and performance optimizations
 */
const EnhancedStreamingChatInterface = ({ sessionId = 'default', onAutonomousEnhancement }) => {
  const {
    currentProvider,
    providers,
    providerHealth,
    streamingState,
    sendStreamingMessage,
    abortStream,
    switchProviderEnhanced,
  } = useLLM();

  // Enhanced state management with performance optimizations
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [providerSwitching, setProviderSwitching] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState(false);
  
  // Performance monitoring
  const [performanceMetrics, setPerformanceMetrics] = useState({
    renderTime: 0,
    streamLatency: 0,
    tokensPerSecond: 0
  });

  // Refs for performance optimization
  const messagesEndRef = useRef(null);
  const streamingMessageRef = useRef(null);
  const renderStartTime = useRef(0);
  const retryTimeoutRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const voiceRecognitionRef = useRef(null);

  // Enhanced state for new features
  const [isRecording, setIsRecording] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [messageQueue, setMessageQueue] = useState([]);

  // Memoized computed values for performance
  const currentProviderInfo = useMemo(() => {
    return providers[currentProvider] || { name: 'Unknown', status: 'unknown' };
  }, [providers, currentProvider]);

  const providerHealthInfo = useMemo(() => {
    return providerHealth[currentProvider] || { status: 'unknown', latency: 0 };
  }, [providerHealth, currentProvider]);

  const canSendMessage = useMemo(() => {
    return currentMessage.trim().length > 0 && 
           !streamingState.isStreaming && 
           connectionStatus === 'connected';
  }, [currentMessage, streamingState.isStreaming, connectionStatus]);

  const availableProviders = useMemo(() => 
    Object.entries(providers).filter(([_, info]) => info.available),
    [providers]
  );

  // Enhanced typing indicator with real-time updates
  useEffect(() => {
    if (typingIndicator) {
      const timeout = setTimeout(() => {
        setTypingIndicator(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [typingIndicator]);

  // Performance monitoring for streaming
  useEffect(() => {
    if (streamingState.isStreaming) {
      renderStartTime.current = performance.now();
    }
  }, [streamingState.isStreaming]);

  // Enhanced streaming message handler with performance tracking
  const handleStreamDelta = useCallback((delta) => {
    const now = performance.now();
    const tokensAdded = delta.split(' ').length;
    const timeDiff = now - renderStartTime.current;
    const tps = tokensAdded / (timeDiff / 1000);

    setPerformanceMetrics(metrics => ({
      ...metrics,
      tokensPerSecond: Math.round(tps * 10) / 10,
      streamLatency: timeDiff,
      memoryUsage: `${Math.round(performance.memory?.usedJSHeapSize / 1024 / 1024 || 0)}MB`
    }));

    setStreamingMessage(prev => {
      const updated = prev ? prev + delta : delta;
      
      if (prev) {
        // First token received
        renderStartTime.current = now;
      }
      
      return updated;
    });
  }, []);

  // Enhanced message sending with retry logic
  const sendMessage = useCallback(async (messageText = currentMessage, isRetry = false) => {
    if (!messageText.trim()) return;

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newMessage = {
      id: messageId,
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      sessionId,
      retryCount: isRetry ? retryCount + 1 : 0
    };

    try {
      setMessages(prev => [...prev, newMessage]);
      setCurrentMessage('');
      setTypingIndicator(true);
      setStreamingMessage('');
      
      if (isRetry) {
        setRetryCount(prev => prev + 1);
      } else {
        setRetryCount(0);
        setLastFailedMessage(null);
      }

      const response = await sendStreamingMessage(messageText, {
        sessionId,
        messageId,
        onDelta: handleStreamDelta,
        onComplete: (fullResponse) => {
          setTypingIndicator(false);
          setMessages(prev => [...prev, {
            id: `ai_${Date.now()}`,
            text: fullResponse,
            sender: 'ai',
            timestamp: new Date(),
            provider: currentProvider,
            model: currentProviderInfo.model,
            metrics: performanceMetrics
          }]);
          setStreamingMessage('');
        },
        onError: (error) => {
          handleMessageError(error, messageText, newMessage);
        }
      });

    } catch (error) {
      handleMessageError(error, messageText, newMessage);
    }
  }, [currentMessage, sessionId, retryCount, sendStreamingMessage, currentProvider, currentProviderInfo, performanceMetrics, handleStreamDelta]);

  // Enhanced error handling with retry mechanism
  const handleMessageError = useCallback((error, messageText, originalMessage) => {
    console.error('Message send error:', error);
    setTypingIndicator(false);
    setStreamingMessage('');
    setLastFailedMessage({ text: messageText, original: originalMessage });
    
    let errorMessage = 'Failed to send message';
    let canRetry = true;
    
    if (error.name === 'NetworkError' || error.message.includes('network')) {
      errorMessage = 'Network connection error';
      setConnectionStatus('disconnected');
      // Auto-retry after 3 seconds for network errors
      retryTimeoutRef.current = setTimeout(() => {
        setConnectionStatus('connected');
        if (retryCount < 3) {
          sendMessage(messageText, true);
        }
      }, 3000);
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please wait before sending another message.';
      canRetry = false;
    } else if (error.message.includes('provider')) {
      errorMessage = `${currentProvider} provider error. Try switching providers.`;
    }

    setSnackbar({
      open: true,
      message: errorMessage,
      severity: 'error',
      action: canRetry && retryCount < 3 ? 'retry' : null
    });
  }, [currentProvider, retryCount, sendMessage]);

  // Manual retry function
  const retryLastMessage = useCallback(() => {
    if (lastFailedMessage && retryCount < 3) {
      sendMessage(lastFailedMessage.text, true);
    }
  }, [lastFailedMessage, retryCount, sendMessage]);

  // Voice input functionality
  const startVoiceRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSnackbar({
        open: true,
        message: 'Voice recognition not supported in this browser',
        severity: 'warning'
      });
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceTranscript('');
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript(transcript);
      
      // Update current message with transcript
      if (event.results[event.results.length - 1].isFinal) {
        setCurrentMessage(transcript);
        setIsRecording(false);
      }
    };

    recognition.onerror = (event) => {
      setIsRecording(false);
      setSnackbar({
        open: true,
        message: `Voice recognition error: ${event.error}`,
        severity: 'error'
      });
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    voiceRecognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopVoiceRecording = useCallback(() => {
    if (voiceRecognitionRef.current) {
      voiceRecognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Enhanced provider switching with health checks
  const handleProviderSwitch = useCallback(async (newProvider) => {
    setProviderSwitching(true);
    try {
      await switchProviderEnhanced(newProvider);
      setSnackbar({
        open: true,
        message: `Switched to ${newProvider}`,
        severity: 'success'
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: `Failed to switch to ${newProvider}: ${error.message}`,
        severity: 'error'
      });
    } finally {
      setProviderSwitching(false);
    }
  }, [switchProviderEnhanced]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  // Enhanced keyboard shortcuts
  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSendMessage) {
        sendMessage();
      }
    } else if (event.key === 'Escape' && streamingState.isStreaming) {
      abortStream();
    } else if (event.ctrlKey && event.key === 'r' && lastFailedMessage) {
      event.preventDefault();
      retryLastMessage();
    }
  }, [canSendMessage, sendMessage, streamingState.isStreaming, abortStream, lastFailedMessage, retryLastMessage]);

  // Performance monitoring effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (streamingState.isStreaming) {
        const now = performance.now();
        setPerformanceMetrics(prev => ({
          ...prev,
          renderTime: now - renderStartTime.current
        }));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [streamingState.isStreaming]);

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('connected');
    const handleOffline = () => setConnectionStatus('disconnected');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup effects
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (voiceRecognitionRef.current) {
        voiceRecognitionRef.current.stop();
      }
    };
  }, []);

  // Enhanced stream completion handler
  const handleStreamComplete = useCallback((result) => {
    const renderTime = performance.now() - renderStartTime.current;
    
    setPerformanceMetrics(metrics => ({
      ...metrics,
      renderTime: Math.round(renderTime)
    }));

    setTypingIndicator(false);
    
    if (result.success && streamingMessage) {
      const assistantMessage = {
        id: Date.now(),
        sender: 'assistant',
        content: streamingMessage,
        timestamp: new Date(),
        provider: currentProvider,
        metadata: {
          streamingTime: renderTime,
          tokensPerSecond: performanceMetrics.tokensPerSecond,
          modelUsed: currentProviderInfo.model
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessage(null);
      
      // Autonomous enhancement suggestion
      if (autonomousMode && onAutonomousEnhancement) {
        onAutonomousEnhancement({
          type: 'chat_interaction',
          metrics: performanceMetrics,
          suggestion: 'Consider implementing message caching for improved performance'
        });
      }

      setSnackbar({
        open: true,
        message: `Response completed in ${Math.round(renderTime)}ms`,
        severity: 'success'
      });
    } else if (result.error) {
      setStreamingMessage(null);
      setSnackbar({
        open: true,
        message: result.error || 'Stream failed',
        severity: 'error'
      });
    }
  }, [streamingMessage, currentProvider, currentProviderInfo, performanceMetrics, autonomousMode, onAutonomousEnhancement]);

  // Enhanced message sending with performance tracking
  const handleSendMessage = useCallback(async () => {
    if (!currentMessage.trim() || streamingState.isStreaming) return;

    const sendStartTime = performance.now();
    
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
    setStreamingMessage('');
    renderStartTime.current = performance.now();

    try {
      await sendStreamingMessage(
        messageToSend,
        { sessionId, startTime: sendStartTime },
        handleStreamDelta,
        handleStreamComplete
      );
    } catch (error) {
      setTypingIndicator(false);
      setStreamingMessage(null);
      setSnackbar({
        open: true,
        message: 'Failed to send message',
        severity: 'error'
      });
    }
  }, [currentMessage, streamingState.isStreaming, sessionId, sendStreamingMessage, handleStreamDelta, handleStreamComplete]);

  // Autonomous mode toggle
  const toggleAutonomousMode = useCallback(() => {
    setAutonomousMode(prev => {
      const newMode = !prev;
      setSnackbar({
        open: true,
        message: `Autonomous mode ${newMode ? 'enabled' : 'disabled'}`,
        severity: 'info'
      });
      return newMode;
    });
  }, []);

  // Enhanced provider health indicator
  const getProviderHealthColor = useCallback((providerId) => {
    const health = providerHealth[providerId];
    if (!health) return 'default';
    
    if (health.health === 'healthy') return 'success';
    if (health.health === 'recovering') return 'warning';
    return 'error';
  }, [providerHealth]);

  // Performance metrics display
  const PerformanceMetrics = useMemo(() => (
    <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
      <CardContent sx={{ py: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Speed fontSize="small" />
          Performance: 
          {performanceMetrics.renderTime > 0 && ` Render: ${performanceMetrics.renderTime}ms`}
          {performanceMetrics.tokensPerSecond > 0 && ` | Speed: ${performanceMetrics.tokensPerSecond} t/s`}
          {performanceMetrics.streamLatency > 0 && ` | Latency: ${Math.round(performanceMetrics.streamLatency)}ms`}
        </Typography>
      </CardContent>
    </Card>
  ), [performanceMetrics]);

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter' && !event.shiftKey && !streamingState.isStreaming) {
        event.preventDefault();
        handleSendMessage();
      } else if (event.key === 'Escape' && streamingState.isStreaming) {
        abortStream();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleSendMessage, streamingState.isStreaming, abortStream]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Enhanced Header with Autonomous Mode */}
      <Paper sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6">
            Enhanced Streaming Chat
          </Typography>
          
          <Box display="flex" gap={1} alignItems="center">
            <Tooltip title={autonomousMode ? "Disable autonomous enhancements" : "Enable autonomous enhancements"}>
              <Chip
                icon={<AutoAwesome />}
                label={autonomousMode ? "Autonomous ON" : "Autonomous OFF"}
                color={autonomousMode ? "primary" : "default"}
                onClick={toggleAutonomousMode}
                clickable
              />
            </Tooltip>
            
            <Tooltip title="Current Provider">
              <Chip
                label={`${currentProviderInfo.name}${currentProviderInfo.model ? ` (${currentProviderInfo.model})` : ''}`}
                color={getProviderHealthColor(currentProvider)}
                size="small"
              />
            </Tooltip>
          </Box>
        </Box>

        {/* Provider Selection */}
        <Box display="flex" gap={1} flexWrap="wrap">
          {availableProviders.map(([providerId, info]) => (
            <Chip
              key={providerId}
              label={info.name}
              variant={providerId === currentProvider ? "filled" : "outlined"}
              color={getProviderHealthColor(providerId)}
              size="small"
              onClick={() => handleProviderSwitch(providerId)}
              disabled={providerSwitching || streamingState.isStreaming}
            />
          ))}
        </Box>
      </Paper>

      {/* Performance Metrics (shown in autonomous mode) */}
      {autonomousMode && PerformanceMetrics}

      {/* Messages Area with Enhanced Scrolling */}
      <Paper sx={{ flex: 1, p: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, overflow: 'auto', mb: 2 }}>
          <List>
            {messages.map((message) => (
              <ListItem key={message.id} sx={{ alignItems: 'flex-start', px: 0 }}>
                <Avatar sx={{ mr: 2, mt: 0.5 }}>
                  {message.sender === 'user' ? <Person /> : <SmartToy />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                    {message.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {message.timestamp.toLocaleTimeString()}
                    {message.metadata && autonomousMode && (
                      <> • {message.metadata.streamingTime}ms • {message.metadata.tokensPerSecond} t/s</>
                    )}
                  </Typography>
                </Box>
              </ListItem>
            ))}
            
            {/* Streaming message */}
            {streamingMessage && (
              <ListItem sx={{ alignItems: 'flex-start', px: 0 }}>
                <Avatar sx={{ mr: 2, mt: 0.5 }}>
                  <SmartToy />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" ref={streamingMessageRef}>
                    {streamingMessage}
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        width: '8px',
                        height: '16px',
                        bgcolor: 'primary.main',
                        ml: 0.5,
                        animation: 'blink 1s infinite'
                      }}
                    />
                  </Typography>
                  <LinearProgress sx={{ mt: 1 }} />
                </Box>
              </ListItem>
            )}

            {/* Typing indicator */}
            {typingIndicator && !streamingMessage && (
              <ListItem sx={{ px: 0 }}>
                <Avatar sx={{ mr: 2 }}>
                  <SmartToy />
                </Avatar>
                <Box>
                  <Skeleton variant="text" width={200} />
                  <Skeleton variant="text" width={150} />
                </Box>
              </ListItem>
            )}
          </List>
          <div ref={messagesEndRef} />
        </Box>

        {/* Enhanced Input Area */}
        <Box display="flex" gap={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type your message... (Enter to send, Esc to cancel)"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            disabled={streamingState.isStreaming}
            variant="outlined"
            size="small"
          />
          
          {streamingState.isStreaming ? (
            <IconButton
              onClick={abortStream}
              color="error"
              sx={{ p: 1 }}
            >
              <Stop />
            </IconButton>
          ) : (
            <IconButton
              onClick={handleSendMessage}
              disabled={!currentMessage.trim()}
              color="primary"
              sx={{ p: 1 }}
            >
              <Send />
            </IconButton>
          )}
        </Box>
      </Paper>

      {/* Enhanced Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* CSS for blinking cursor */}
      <style>
        {`
          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </Box>
  );
};

export default EnhancedStreamingChatInterface;